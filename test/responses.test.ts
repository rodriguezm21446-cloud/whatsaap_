import { describe, expect, it } from "vitest";

import {
  buildAllowedVariableReply,
  buildPreCheckoutReply,
  buildReply
} from "../src/domain/responses.ts";

const product = {
  name: "Secadora portátil",
  price: "49.99",
  specificationsReady: false
};

const allowedVariables = {
  ...product,
  specifications: "NO_VERIFICADO",
  delivery: "Entrega nacional de 2 a 5 días laborables.",
  warranty: "NO_VERIFICADO",
  stock: "NO_VERIFICADO",
  usage: "NO_VERIFICADO"
};

describe("respuestas de Robotín", () => {
  it("muestra asesor humano como última opción", () => {
    const reply = buildReply("INTEREST", product);
    expect(reply.buttons?.map((button) => button.id)).toEqual([
      "show_price",
      "show_specs",
      "human_advisor"
    ]);
  });

  it("menciona el pago contra entrega de forma clara", () => {
    const reply = buildReply("PRICE", product);
    expect(reply.text).toContain("pago es contra entrega");
    expect(reply.text).toContain("pagas cuando la recibes");
  });

  it("no inventa especificaciones", () => {
    const reply = buildReply("SPECIFICATIONS", product);
    expect(reply.text).toContain("Prefiero no inventarte ningún dato");
  });

  it("informa qué ocurrirá antes del checkout", () => {
    const reply = buildPreCheckoutReply(product);
    expect(reply.text).toContain("Antes de continuar");
    expect(reply.text).toContain("contra entrega");
    expect(reply.buttons?.map((button) => button.id)).toContain("confirm_checkout");
  });

  it("ofrece una salida sin presionar al cliente", () => {
    const reply = buildPreCheckoutReply(product);
    expect(reply.buttons?.map((button) => button.id)).toContain("cancel_checkout");
  });

  it("después del precio pregunta el siguiente paso y deja al asesor al final", () => {
    const reply = buildReply("PRICE", product);
    expect(reply.buttons?.map((button) => button.id)).toEqual([
      "continue_purchase",
      "continue_questions",
      "human_advisor"
    ]);
  });

  it("no inventa una variable que no está verificada", () => {
    const reply = buildAllowedVariableReply("SPECIFICATIONS", allowedVariables);
    expect(reply.text).toBe("Ese dato todavía no está verificado. Prefiero no inventarte información.");
  });

  it("responde con el valor exacto permitido por el código", () => {
    const reply = buildAllowedVariableReply("DELIVERY", allowedVariables);
    expect(reply.text).toContain(allowedVariables.delivery);
  });

  it("bloquea temas ajenos con una respuesta fija", () => {
    const reply = buildAllowedVariableReply("OFF_TOPIC", allowedVariables);
    expect(reply.text).toContain("únicamente con la secadora portátil");
  });
});

