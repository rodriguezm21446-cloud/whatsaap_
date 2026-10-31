export const intents = [
  "GREETING",
  "INTEREST",
  "PRICE",
  "SPECIFICATIONS",
  "HOW_IT_WORKS",
  "PURCHASE_INTENT",
  "HUMAN_HANDOFF",
  "OTHER_QUESTION",
  "UNKNOWN"
] as const;

export type Intent = (typeof intents)[number];

const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const containsAny = (text: string, phrases: readonly string[]): boolean =>
  phrases.some((phrase) => text.includes(phrase));

export function detectIntent(rawText: string, interactiveId?: string): Intent {
  const id = interactiveId?.toLowerCase();
  if (id === "continue_purchase" || id === "confirm_checkout") return "PURCHASE_INTENT";
  if (id === "show_price") return "PRICE";
  if (id === "show_specs") return "SPECIFICATIONS";
  if (id === "show_how_it_works") return "HOW_IT_WORKS";
  if (id === "human_advisor") return "HUMAN_HANDOFF";
  if (id === "show_menu" || id === "continue_questions") return "INTEREST";

  const text = normalize(rawText);
  if (!text) return "UNKNOWN";

  if (
    containsAny(text, [
      "quiero comprar",
      "quiero una",
      "quiero pedir",
      "como hago el pedido",
      "como la pido",
      "que datos necesitas",
      "mandame una",
      "enviame una",
      "si quiero una",
      "seguir con la compra"
    ])
  ) {
    return "PURCHASE_INTENT";
  }

  if (
    containsAny(text, [
      "hablar con un asesor",
      "hablar con asesor",
      "hablar con una persona",
      "asesor humano",
      "atencion humana"
    ])
  ) {
    return "HUMAN_HANDOFF";
  }

  if (containsAny(text, ["precio", "cuanto cuesta", "cuanto vale", "que valor", "en cuanto sale"])) {
    return "PRICE";
  }
  if (containsAny(text, ["especificaciones", "caracteristicas", "capacidad", "potencia", "voltaje", "medidas"])) {
    return "SPECIFICATIONS";
  }
  if (containsAny(text, ["como funciona", "como se usa", "funcionamiento"])) {
    return "HOW_IT_WORKS";
  }
  if (containsAny(text, ["me interesa", "informacion", "secadora portatil", "quiero saber"])) {
    return "INTEREST";
  }
  if (containsAny(text, ["hola", "buenas", "buen dia", "buenas tardes", "buenas noches"])) {
    return "GREETING";
  }
  return "OTHER_QUESTION";
}

