import type { Intent } from "./intent.ts";
import type { GeminiResponseKey } from "../ai/gemini.ts";

export interface ProductFacts {
  name: string;
  price: string;
  specificationsReady: boolean;
}

export interface BotReply {
  text: string;
  buttons?: Array<{ id: string; title: string }>;
}

const menuButtons = [
  { id: "show_price", title: "📦 Consultar costo" },
  { id: "show_specs", title: "❓ Especificaciones" },
  { id: "human_advisor", title: "👤 Asesor humano" }
];

const nextStepButtons = [
  { id: "continue_purchase", title: "Hacer pedido" },
  { id: "continue_questions", title: "Seguir consultando" },
  { id: "human_advisor", title: "Asesor humano" }
];

export function buildReply(intent: Intent, product: ProductFacts): BotReply {
  const priceReady = product.price !== "POR_CONFIGURAR";
  switch (intent) {
    case "GREETING":
    case "INTEREST":
      return {
        text: `¡Hola! 😊 Soy Robotín, tu asistente. Con gusto te ayudo con la ${product.name}.\n\n¿Qué deseas consultar?`,
        buttons: menuButtons
      };
    case "PRICE":
      return {
        text: priceReady
          ? `La ${product.name} cuesta $${product.price}. El pago es contra entrega: pagas cuando la recibes.`
          : "Prefiero confirmar el precio correcto antes de darte un valor equivocado.",
        buttons: nextStepButtons
      };
    case "SPECIFICATIONS":
      return product.specificationsReady
        ? {
            text: "Aquí irán únicamente las especificaciones verificadas del producto.",
            buttons: nextStepButtons
          }
        : {
            text: "Todavía estoy verificando la ficha técnica. Prefiero no inventarte ningún dato. Puedo avisarte cuando esté completa.",
            buttons: menuButtons
          };
    case "HOW_IT_WORKS":
      return {
        text: "Te explicaré cómo funciona usando únicamente la información y el video verificados del producto.",
        buttons: nextStepButtons
      };
    default:
      return {
        text: "Claro, dime qué deseas saber sobre la secadora portátil y con gusto te ayudo."
      };
  }
}

export function buildPreCheckoutReply(product: ProductFacts): BotReply {
  const price = product.price === "POR_CONFIGURAR" ? "por confirmar" : `$${product.price}`;
  return {
    text:
      `¡Perfecto! 😊 Antes de continuar:\n\n` +
      `• Producto: ${product.name}\n` +
      `• Valor: ${price}\n` +
      "• Pago: contra entrega\n\n" +
      "Para registrar el pedido te pediremos los datos necesarios para la entrega. ¿Deseas continuar?",
    buttons: [
      { id: "confirm_checkout", title: "Sí, continuar" },
      { id: "other_question", title: "Tengo una duda" },
      { id: "cancel_checkout", title: "Ahora no" }
    ]
  };
}

export interface AllowedProductVariables extends ProductFacts {
  specifications: string;
  delivery: string;
  warranty: string;
  stock: string;
  usage: string;
}

const isVerified = (value: string): boolean => value !== "NO_VERIFICADO";

export function buildAllowedVariableReply(
  responseKey: GeminiResponseKey,
  product: AllowedProductVariables
): BotReply {
  if (responseKey === "OFF_TOPIC") {
    return {
      text: "Puedo ayudarte únicamente con la secadora portátil 😊 ¿Qué deseas consultar?",
      buttons: menuButtons
    };
  }

  if (responseKey === "PRICE") return buildReply("PRICE", product);
  if (responseKey === "PAYMENT") {
    return {
      text: "El pago es contra entrega: pagas cuando recibes el producto.",
      buttons: nextStepButtons
    };
  }

  const values: Partial<Record<GeminiResponseKey, { label: string; value: string }>> = {
    SPECIFICATIONS: { label: "Las especificaciones verificadas son", value: product.specifications },
    DELIVERY: { label: "La información verificada de entrega es", value: product.delivery },
    WARRANTY: { label: "La garantía verificada es", value: product.warranty },
    STOCK: { label: "La disponibilidad verificada es", value: product.stock },
    USAGE: { label: "La forma de uso verificada es", value: product.usage }
  };
  const selected = values[responseKey];

  if (!selected || !isVerified(selected.value)) {
    return {
      text:
        responseKey === "UNKNOWN"
          ? "No logré identificar esa consulta. Puedo ayudarte con costo, especificaciones o comunicarte con un asesor."
          : "Ese dato todavía no está verificado. Prefiero no inventarte información.",
      buttons: [
        { id: "show_price", title: "Consultar costo" },
        { id: "show_specs", title: "Especificaciones" },
        { id: "human_advisor", title: "Asesor humano" }
      ]
    };
  }

  return {
    text: `${selected.label}: ${selected.value}`,
    buttons: nextStepButtons
  };
}

