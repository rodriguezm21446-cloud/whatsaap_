import { describe, expect, it } from "vitest";

import { detectIntent, needsGemini } from "../src/domain/intent.ts";

describe("detectIntent", () => {
  it("no gasta tokens de Gemini en intenciones comerciales comunes", () => {
    expect(needsGemini(detectIntent("Hola, vi el video, ¿cuánto vale?"))).toBe(false);
    expect(needsGemini(detectIntent("Quiero comprar"))).toBe(false);
  });

  it("reserva Gemini para preguntas no cubiertas por reglas locales", () => {
    expect(needsGemini(detectIntent("¿Hace mucho ruido durante la noche?"))).toBe(true);
  });

  it.each([
    "quiero comprar una",
    "Sí quiero una",
    "¿Cómo hago el pedido?",
    "mándame una",
    "¿qué datos necesitas?"
  ])("detecta intención de compra en: %s", (text) => {
    expect(detectIntent(text)).toBe("PURCHASE_INTENT");
  });

  it("no confunde interés inicial con compra", () => {
    expect(detectIntent("Me interesa la secadora portátil")).toBe("INTEREST");
  });

  it("acepta los identificadores de botones", () => {
    expect(detectIntent("", "show_specs")).toBe("SPECIFICATIONS");
    expect(detectIntent("", "confirm_checkout")).toBe("PURCHASE_INTENT");
    expect(detectIntent("", "other_question")).toBe("INTEREST");
  });
});

