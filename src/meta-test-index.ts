import { handleWhatsAppMetaTestPayload } from "./handlers/whatsapp-meta-test.ts";
import { BodyTooLargeError, readTextBody } from "./http/body.ts";
import { verifySecret, verifyWebhookSignature } from "./integrations/whatsapp/security.ts";

const MAX_WEBHOOK_BYTES = 256 * 1024;

async function handleFetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/health") {
    return Response.json({ ok: true, mode: "meta-test" });
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
    if (!valid) return Response.json({ error: "invalid_signature" }, { status: 401 });
    const payload: unknown = JSON.parse(rawBody);
    ctx.waitUntil(handleWhatsAppMetaTestPayload(payload, env));
    return Response.json({ accepted: true }, { status: 202 });
  }

  return Response.json({ error: "not_found" }, { status: 404 });
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      return await handleFetch(request, env, ctx);
    } catch (error) {
      if (error instanceof BodyTooLargeError) {
        return Response.json({ error: "payload_too_large" }, { status: 413 });
      }
      console.error(
        JSON.stringify({
          message: "unhandled_request_error",
          path: new URL(request.url).pathname,
          error: error instanceof Error ? error.message : String(error)
        })
      );
      return Response.json({ error: "internal_error" }, { status: 500 });
    }
  }
} satisfies ExportedHandler<Env>;
