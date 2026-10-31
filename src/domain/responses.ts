import type { Intent } from "./intent.ts";
import type { GeminiClassification, GeminiResponseKey } from "../ai/gemini.ts";

export interface ProductFacts {
  businessName: string;
  name: string;
  price: string;
  specificationsReady: boolean;
  specifications?: string;
}

export interface BotReply {
  text: string;
  buttons?: Array<{ id: string; title: string }>;
}

const menuButtons = [
  { id: "show_price", title: "📦 Consultar costo" },
  { id: "show_specs", title: "❓ Ver detalles" },
  { id: "continue_purchase", title: "🛒 Hacer pedido" }
];

const nextStepButtons = [
  { id: "continue_purchase", title: "Hacer pedido" },
  { id: "show_specs", title: "Ver detalles" },
  { id: "show_menu", title: "Menú" }
];

const openerText = (opener: GeminiClassification["opener"]): string => {
  if (opener === "LIKED_VIDEO") return "¡Qué bueno que te gustó el video! 😊 ";
  if (opener === "POSITIVE_INTEREST") return "¡Qué bueno que te interesó! 😊 ";
  if (opener === "GREETING") return "¡Hola! 😊 ";
  return "";
};

export function buildReply(intent: Intent, product: ProductFacts): BotReply {
  const priceReady = product.price !== "POR_CONFIGURAR";
  switch (intent) {
    case "GREETING":
    case "INTEREST":
      return {
        text: `¡Hola! 😊 Soy Robotín, asistente de ${product.businessName}. Con gusto te ayudo con la ${product.name}.\n\n¿Qué deseas consultar?`,
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
            text: product.specifications ?? "Las especificaciones verificadas están disponibles.",
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
  features: string;
  size: string;
  specifications: string;
  useCases: string;
  delivery: string;
  warranty: string;
  stock: string;
  usage: string;
}

const isVerified = (value: string): boolean => value !== "NO_VERIFICADO";

export function buildAllowedVariableReply(
  classification: GeminiClassification,
  product: AllowedProductVariables
): BotReply {
  const { response_key: responseKey, opener } = classification;
  const prefix = openerText(opener);

  if (responseKey === "OFF_TOPIC") {
    return {
      text: `${prefix}Puedo ayudarte únicamente con la secadora portátil. ¿Qué deseas consultar?`,
      buttons: menuButtons
    };
  }

  if (responseKey === "MENU") {
    return {
      text: `${prefix}Soy Robotín, asistente de ${product.businessName} para la ${product.name}. ¿Qué deseas consultar?`,
      buttons: menuButtons
    };
  }

  if (responseKey === "PRICE") {
    const priceReady = product.price !== "POR_CONFIGURAR";
    return {
      text: priceReady
        ? `${prefix}La ${product.name} cuesta $${product.price}. El pago es contra entrega: pagas cuando la recibes.`
        : `${prefix}Estoy confirmando el precio para no darte un valor equivocado.`,
      buttons: nextStepButtons
    };
  }
  if (responseKey === "PAYMENT") {
    return {
      text: `${prefix}El pago es contra entrega: pagas cuando recibes el producto.`,
      buttons: nextStepButtons
    };
  }

  if (responseKey === "HYGIENE") {
    return {
      text:
        `${prefix}Este producto seca prendas previamente lavadas. ` +
        "No está verificado que lave, desinfecte ni realice limpieza profunda.",
      buttons: nextStepButtons
    };
  }

  const values: Partial<Record<GeminiResponseKey, { label: string; value: string }>> = {
    FEATURES: { label: "Sus características verificadas son", value: product.features },
    SIZE: { label: "Las medidas verificadas son", value: product.size },
    SPECIFICATIONS: { label: "Las especificaciones verificadas son", value: product.specifications },
    USE_CASES: { label: "Los usos recomendados son", value: product.useCases },
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
          ? `${prefix}No logré identificar esa consulta. Puedo ayudarte con costo, detalles o el pedido.`
          : `${prefix}Ese dato todavía no está verificado. Prefiero no inventarte información.`,
      buttons: menuButtons
    };
  }

  return {
    text: `${prefix}${selected.label}: ${selected.value}`,
    buttons: nextStepButtons
  };
}

