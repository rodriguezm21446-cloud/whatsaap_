export class TelegramClient {
  constructor(
    private readonly token: string,
    private readonly chatId: string
  ) {}

  async sendOwnerDecision(conversationId: string, text: string): Promise<void> {
    await this.call("sendMessage", {
      chat_id: this.chatId,
      text,
      protect_content: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "▶️ Continuar Robotín", callback_data: `continue:${conversationId}` },
            { text: "👤 Tomar el mando", callback_data: `take:${conversationId}` }
          ]
        ]
      }
    });
  }

  async sendText(text: string): Promise<void> {
    await this.call("sendMessage", { chat_id: this.chatId, text, protect_content: true });
  }

  async answerCallback(callbackQueryId: string, text: string): Promise<void> {
    await this.call("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      text,
      show_alert: false
    });
  }

  private async call(method: string, body: unknown): Promise<void> {
    const response = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Telegram API error ${response.status}: ${errorBody.slice(0, 500)}`);
    }
  }
}

