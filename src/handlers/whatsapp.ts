import { ConversationRepository } from "../database/conversation-repository.ts";
import { EventRepository } from "../database/event-repository.ts";
import { GeminiProductAssistant } from "../ai/gemini.ts";
import { detectIntent } from "../domain/intent.ts";
import {
  buildAllowedVariableReply,
  buildPreCheckoutReply,
  buildReply,
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
    specificationsReady: false
  };

  for (const message of extractMessages(payload)) {
    const conversation = await conversations.getOrCreate(message.from);
    const isNew = await events.recordInbound(
      conversation.id,
      message.id,
      message.type
    );
    if (!isNew) continue;

    if (conversation.mode === "HUMAN") {
      await env.NOTIFICATIONS.send({
        type: "HUMAN_MESSAGE",
        conversationId: conversation.id,
        whatsappIdMasked: maskWhatsappId(message.from),
        message: message.text
      });
      continue;
    }
    if (conversation.mode === "WAITING_OWNER") continue;

    const intent = detectIntent(message.text, message.interactiveId);
    if (intent === "HUMAN_HANDOFF") {
      await conversations.setControl(conversation.id, "HUMAN", "EVALUATING");
      await Promise.all([
        whatsapp.sendReply(message.from, {
          text:
            "Claro 👤 Ya avisé al asesor y pausé mis respuestas automáticas en este chat. " +
            "Puedes dejar aquí tu mensaje y te responderá una persona."
        }),
        env.NOTIFICATIONS.send({
          type: "ADVISOR_REQUEST",
          conversationId: conversation.id,
          whatsappId: message.from,
          lastMessage: message.text || "Seleccionó el botón Asesor humano"
        })
      ]);
      continue;
    }

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

    if (intent === "OTHER_QUESTION") {
      try {
        const assistant = new GeminiProductAssistant({
          apiKey: env.GEMINI_API_KEY,
          model: env.GEMINI_MODEL
        });
        const responseKey = await assistant.classify(message.text);
        await whatsapp.sendReply(
          message.from,
          buildAllowedVariableReply(responseKey, {
            ...product,
            specifications: env.PRODUCT_SPECIFICATIONS,
            delivery: env.PRODUCT_DELIVERY,
            warranty: env.PRODUCT_WARRANTY,
            stock: env.PRODUCT_STOCK,
            usage: env.PRODUCT_USAGE
          })
        );
      } catch (error) {
        console.error(
          JSON.stringify({
            message: "gemini_product_answer_failed",
            error: error instanceof Error ? error.message : "unknown_error"
          })
        );
        await whatsapp.sendReply(message.from, {
          text: "No pude verificar esa información en este momento. Puedo mostrarte el costo, las especificaciones disponibles o avisar a un asesor.",
          buttons: [
            { id: "show_price", title: "Consultar costo" },
            { id: "show_specs", title: "Especificaciones" },
            { id: "human_advisor", title: "Asesor humano" }
          ]
        });
      }
      continue;
    }

    await whatsapp.sendReply(message.from, buildReply(intent, product));
  }
}

