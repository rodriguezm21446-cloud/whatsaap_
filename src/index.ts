import { handleTelegramPayload } from "./handlers/telegram.ts";
import { handleWhatsAppPayload } from "./handlers/whatsapp.ts";
import { BodyTooLargeError, readTextBody } from "./http/body.ts";
import { verifySecret, verifyWebhookSignature } from "./integrations/whatsapp/security.ts";
import { processNotification } from "./notifications/processor.ts";
import type { NotificationJob } from "./notifications/types.ts";

const json = (body: unknown, status = 200): Response => Response.json(body, { status });
const MAX_WEBHOOK_BYTES = 256 * 1024;

async function handleFetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/health") {
    return json({ ok: true });
  }

  if (request.method === "GET" && url.pathname === "/webhooks/whatsapp") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const valid = mode === "subscribe" && (await verifySecret(token, env.META_VERIFY_TOKEN));
    return valid && challenge ? new Response(challenge) : new Response("Forbidden", { status: 403 });
  }

  if (request.method === "POST" && url.pathname === "/webhooks/whatsapp") {
    const rawBody = await readTextBody(request, MAX_WEBHOOK_BYTES);
    const valid = await verifyWebhookSignature(
      rawBody,
      request.headers.get("X-Hub-Signature-256"),
      env.META_APP_SECRET
    );
    if (!valid) return json({ error: "invalid_signature" }, 401);
    const payload: unknown = JSON.parse(rawBody);
    ctx.waitUntil(handleWhatsAppPayload(payload, env));
    return json({ accepted: true }, 202);
  }

  if (request.method === "POST" && url.pathname === "/webhooks/telegram") {
    const valid = await verifySecret(
      request.headers.get("X-Telegram-Bot-Api-Secret-Token"),
      env.TELEGRAM_WEBHOOK_SECRET
    );
    if (!valid) return json({ error: "invalid_secret" }, 401);
    const rawBody = await readTextBody(request, MAX_WEBHOOK_BYTES);
    const payload: unknown = JSON.parse(rawBody);
    ctx.waitUntil(handleTelegramPayload(payload, env));
    return json({ accepted: true }, 202);
  }

  return json({ error: "not_found" }, 404);
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      return await handleFetch(request, env, ctx);
    } catch (error) {
      if (error instanceof BodyTooLargeError) {
        return json({ error: "payload_too_large" }, 413);
      }
      console.error(
        JSON.stringify({
          message: "unhandled_request_error",
          path: new URL(request.url).pathname,
          error: error instanceof Error ? error.message : String(error)
        })
      );
      return json({ error: "internal_error" }, 500);
    }
  },

  async queue(batch, env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processNotification(message.body as NotificationJob, env);
        message.ack();
      } catch (error) {
        console.error(
          JSON.stringify({
            message: "notification_failed",
            queueMessageId: message.id,
            error: error instanceof Error ? error.message : String(error)
          })
        );
        message.retry();
      }
    }
  }
} satisfies ExportedHandler<Env, NotificationJob>;

