import { GeminiProductAssistant } from "../ai/gemini.ts";
import { detectIntent, needsGemini } from "../domain/intent.ts";
import {
  buildAllowedVariableReply,
  buildPreCheckoutReply,
  buildReply,
  type AllowedProductVariables,
  type ProductFacts
} from "../domain/responses.ts";
import { WhatsAppClient } from "../integrations/whatsapp/client.ts";
import { extractMessages } from "../integrations/whatsapp/types.ts";

export async function handleWhatsAppMetaTestPayload(payload: unknown, env: Env): Promise<void> {
  const whatsapp = new WhatsAppClient({
    accessToken: env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    graphApiVersion: env.META_GRAPH_API_VERSION
  });
  const product: ProductFacts = {
    businessName: env.BUSINESS_NAME,
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
      await whatsapp.sendReply(message.from, {
        text: "¡Perfecto! 😊 Registré que deseas continuar. En esta prueba todavía no se solicitan ni guardan datos personales."
      });
      continue;
    }

    if (!message.interactiveId && needsGemini(intent)) {
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
          text: "Ahora mismo puedo ayudarte con el costo, las características o el proceso de compra.",
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
