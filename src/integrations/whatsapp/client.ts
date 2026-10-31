import type { BotReply } from "../../domain/responses.ts";

interface WhatsAppClientConfig {
  accessToken: string;
  phoneNumberId: string;
  graphApiVersion: string;
}

export class WhatsAppClient {
  constructor(private readonly config: WhatsAppClientConfig) {}

  async sendReply(to: string, reply: BotReply): Promise<void> {
    const payload = reply.buttons?.length
      ? {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: reply.text },
            action: {
              buttons: reply.buttons.slice(0, 3).map((button) => ({
                type: "reply",
                reply: button
              }))
            }
          }
        }
      : {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: reply.text }
        };

    const response = await fetch(
      `https://graph.facebook.com/${this.config.graphApiVersion}/${this.config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`WhatsApp API error ${response.status}: ${errorBody.slice(0, 500)}`);
    }
  }
}

