import { ConversationRepository } from "../database/conversation-repository.ts";
import { TelegramClient } from "../integrations/telegram/client.ts";
import { telegramUpdateSchema } from "../integrations/telegram/types.ts";

export async function handleTelegramPayload(payload: unknown, env: Env): Promise<void> {
  const update = telegramUpdateSchema.parse(payload);
  const callback = update.callback_query;
  if (!callback?.data) return;
  if (String(callback.from.id) !== env.TELEGRAM_OWNER_ID) return;

  const [action, conversationId] = callback.data.split(":", 2);
  if (!conversationId) return;

  const conversations = new ConversationRepository(env.DB);
  const telegram = new TelegramClient(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);

  if (action === "resume") {
    const changed = await conversations.setControl(conversationId, "BOT", "START");
    await telegram.answerCallback(
      callback.id,
      changed ? "Robotín quedó activo solamente en este chat." : "No encontré esa conversación."
    );
    return;
  }

  if (action === "pause") {
    const changed = await conversations.setControl(conversationId, "HUMAN", "EVALUATING");
    await telegram.answerCallback(
      callback.id,
      changed ? "Robotín quedó pausado solamente en este chat." : "No encontré esa conversación."
    );
    return;
  }

  if (action === "continue") {
    const changed = await conversations.setControl(conversationId, "BOT", "COLLECTING_DATA");
    await telegram.answerCallback(
      callback.id,
      changed ? "Robotín continuará con los datos." : "No encontré esa conversación."
    );
    return;
  }

  if (action === "take") {
    const changed = await conversations.setControl(conversationId, "HUMAN", "PURCHASE_INTENT");
    await telegram.answerCallback(
      callback.id,
      changed ? "Tomaste el control de esta conversación." : "No encontré esa conversación."
    );
  }
}

