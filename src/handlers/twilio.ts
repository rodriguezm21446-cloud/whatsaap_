import { GeminiProductAssistant } from "../ai/gemini.ts";
import { detectIntent, needsGemini } from "../domain/intent.ts";
import {
  buildAllowedVariableReply,
  buildPreCheckoutReply,
  buildReply,
  type AllowedProductVariables,
  type BotReply,
  type ProductFacts
} from "../domain/responses.ts";

const sandboxCommands: Record<string, string> = {
  costo: "show_price",
  precio: "show_price",
  detalles: "show_specs",
  especificaciones: "show_specs",
  comprar: "continue_purchase",
  confirmar: "confirm_checkout",
  duda: "other_question",
  cancelar: "cancel_checkout",
  menu: "show_menu",
  "menú": "show_menu"
};

const normalizeCommand = (text: string): string => text.trim().toLocaleLowerCase("es");

export async function handleTwilioSandboxMessage(
  params: URLSearchParams,
  env: Env
): Promise<BotReply> {
  const text = params.get("Body")?.trim() ?? "";
  const interactiveId = sandboxCommands[normalizeCommand(text)];
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

  if (interactiveId === "cancel_checkout") {
    return {
      text: "No hay problema 😊 Si después deseas continuar o tienes otra pregunta, aquí estaré para ayudarte."
    };
  }

  const intent = detectIntent(text, interactiveId);
  if (
    interactiveId === "continue_purchase" ||
    (intent === "PURCHASE_INTENT" && interactiveId !== "confirm_checkout")
  ) {
    return buildPreCheckoutReply(product);
  }

  if (interactiveId === "confirm_checkout") {
    return {
      text:
        "¡Excelente! Esta es una prueba del flujo de compra. Todavía no guardaré datos personales ni enviaré el pedido."
    };
  }

  if (!interactiveId && needsGemini(intent)) {
    try {
      const assistant = new GeminiProductAssistant({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL
      });
      const classification = await assistant.classify(text);
      return buildAllowedVariableReply(classification, allowedProduct);
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "twilio_gemini_classification_failed",
          error: error instanceof Error ? error.message : "unknown_error"
        })
      );
      return buildReply(intent, product);
    }
  }

  return buildReply(intent, product);
}
