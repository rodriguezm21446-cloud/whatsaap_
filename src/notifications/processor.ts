import { TelegramClient } from "../integrations/telegram/client.ts";
import type { NotificationJob } from "./types.ts";

export async function processNotification(job: NotificationJob, env: Env): Promise<void> {
  const telegram = new TelegramClient(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
  if (job.type === "ADVISOR_REQUEST") {
    await telegram.sendOwnerDecision(
      job.conversationId,
      `👤 CLIENTE SOLICITA ASESOR HUMANO\n\n` +
        `WhatsApp: ${job.whatsappId}\n` +
        `Mensaje: “${job.lastMessage.slice(0, 300)}”\n\n` +
        "Robotín quedó pausado solamente en este chat."
    );
    return;
  }

  if (job.type === "OWNER_DECISION") {
    await telegram.sendOwnerDecision(
      job.conversationId,
      `🛒 CLIENTE CONFIRMÓ QUE QUIERE COMPRAR\n\n` +
        `WhatsApp: ${job.whatsappIdMasked}\n` +
        `Producto: ${job.productName}\n` +
        `Valor informado: ${job.productPrice}\n` +
        `Pago: contra entrega\n` +
        `Mensaje: “${job.lastMessage.slice(0, 300)}”\n\n` +
        "¿Qué deseas hacer?"
    );
    return;
  }

  await telegram.sendText(
    `📩 MENSAJE EN MODO HUMANO\n\nWhatsApp: ${job.whatsappIdMasked}\nMensaje: “${job.message.slice(0, 500)}”`
  );
}

