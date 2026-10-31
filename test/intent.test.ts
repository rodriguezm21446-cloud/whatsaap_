import { describe, expect, it } from "vitest";

import { detectIntent } from "../src/domain/intent.ts";

describe("detectIntent", () => {
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
    expect(detectIntent("", "human_advisor")).toBe("HUMAN_HANDOFF");
  });

  it("detecta cuando el cliente pide una persona", () => {
    expect(detectIntent("Quiero hablar con un asesor")).toBe("HUMAN_HANDOFF");
  });
});

