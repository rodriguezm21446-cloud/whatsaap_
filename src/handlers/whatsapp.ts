import { ConversationRepository } from "../database/conversation-repository.ts";
import { EventRepository } from "../database/event-repository.ts";
import { GeminiProductAssistant } from "../ai/gemini.ts";
import { detectIntent } from "../domain/intent.ts";
import {
  buildAllowedVariableReply,
  buildPreCheckoutReply,
  buildReply,
  type AllowedProductVariables,
  type ProductFacts
} from "../domain/responses.ts";
import { WhatsAppClient } from "../integrations/whatsapp/client.ts";
import { extractMessages } from "../integrations/whatsapp/types.ts";
import { maskWhatsappId } from "../utils/privacy.ts";

const holdingReply = {
  text: "¡Excelente! Estoy preparando el registro de tu pedido. Dame un momentito 😊"
};

export async function handleWhatsAppPayload(payload: unknown, env: Env): Promise<void> {
  const conversations = new ConversationRepository(env.DB);
  const events = new EventRepository(env.DB);
  const whatsapp = new WhatsAppClient({
    accessToken: env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    graphApiVersion: env.META_GRAPH_API_VERSION
  });
  const product: ProductFacts = {
    name: env.PRODUCT_NAME,
    price: env.PRODUCT_PRICE,
    specificationsReady: true,
    specifications: env.PRODUCT_SPECIFICATIONS
  };
  const allowedProduct: AllowedProductVariables = {
    ...product,
    features: env.PRODUCT_FEATURES,
    size: env.PRODUCT_SIZE,
    specifications: env.PRODUCT_SPECIFICATIONS,
    useCases: env.PRODUCT_USE_CASES,
    delivery: env.PRODUCT_DELIVERY,
    warranty: env.PRODUCT_WARRANTY,
    stock: env.PRODUCT_STOCK,
    usage: env.PRODUCT_USAGE
  };

  for (const message of extractMessages(payload)) {
    const lookup = await conversations.getOrCreate(message.from);
    const conversation = lookup.conversation;
    const isNew = await events.recordInbound(
      conversation.id,
      message.id,
      message.type
    );
    if (!isNew) continue;

    if (lookup.created) {
      await env.NOTIFICATIONS.send({
        type: "CHAT_CONTROL",
        conversationId: conversation.id,
        whatsappId: message.from
      });
    }

    if (conversation.mode === "HUMAN") {
      await env.NOTIFICATIONS.send({
        type: "HUMAN_MESSAGE",
        conversationId: conversation.id,
        whatsappId: message.from,
        message: message.text
      });
      continue;
    }
    if (conversation.mode === "WAITING_OWNER") continue;

    const intent = detectIntent(message.text, message.interactiveId);
    if (message.interactiveId === "cancel_checkout") {
      await whatsapp.sendReply(message.from, {
        text: "No hay problema 😊 Si después deseas continuar o tienes otra pregunta, aquí estaré para ayudarte."
      });
      continue;
    }

    if (
      message.interactiveId === "continue_purchase" ||
      (intent === "PURCHASE_INTENT" && message.interactiveId !== "confirm_checkout")
    ) {
      await whatsapp.sendReply(message.from, buildPreCheckoutReply(product));
      continue;
    }

    if (message.interactiveId === "confirm_checkout") {
      await conversations.setControl(conversation.id, "WAITING_OWNER", "PURCHASE_INTENT");
      await Promise.all([
        whatsapp.sendReply(message.from, holdingReply),
        env.NOTIFICATIONS.send({
          type: "OWNER_DECISION",
          conversationId: conversation.id,
          whatsappIdMasked: maskWhatsappId(message.from),
          lastMessage: message.text,
          productName: product.name,
          productPrice: product.price === "POR_CONFIGURAR" ? "por confirmar" : `$${product.price}`
        })
      ]);
      continue;
    }

    if (!message.interactiveId && intent !== "PURCHASE_INTENT") {
      try {
        const assistant = new GeminiProductAssistant({
          apiKey: env.GEMINI_API_KEY,
          model: env.GEMINI_MODEL
        });
        const classification = await assistant.classify(message.text);
        await whatsapp.sendReply(
          message.from,
          buildAllowedVariableReply(classification, allowedProduct)
        );
      } catch (error) {
        console.error(
          JSON.stringify({
            message: "gemini_product_answer_failed",
            error: error instanceof Error ? error.message : "unknown_error"
          })
        );
        await whatsapp.sendReply(message.from, {
          text: "No pude clasificar esa consulta en este momento. Puedes consultar el costo, ver los detalles o iniciar el pedido.",
          buttons: [
            { id: "show_price", title: "Consultar costo" },
            { id: "show_specs", title: "Ver detalles" },
            { id: "continue_purchase", title: "Hacer pedido" }
          ]
        });
      }
      continue;
    }

    await whatsapp.sendReply(message.from, buildReply(intent, product));
  }
}

