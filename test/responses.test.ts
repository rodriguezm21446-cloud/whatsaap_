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
  features: "Diseño ligero y plegable.",
  size: "27 cm de ancho y 19,5 cm de alto.",
  specifications: "NO_VERIFICADO",
  useCases: "Departamentos pequeños y viajes.",
  delivery: "Entrega nacional de 2 a 5 días laborables.",
  warranty: "NO_VERIFICADO",
  stock: "NO_VERIFICADO",
  usage: "NO_VERIFICADO"
};

describe("respuestas de Robotín", () => {
  it("no muestra asesor humano al cliente", () => {
    const reply = buildReply("INTEREST", product);
    expect(reply.buttons?.map((button) => button.id)).toEqual([
      "show_price",
      "show_specs",
      "continue_purchase"
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

  it("después del precio mantiene la conversación dentro de la venta", () => {
    const reply = buildReply("PRICE", product);
    expect(reply.buttons?.map((button) => button.id)).toEqual([
      "continue_purchase",
      "show_specs",
      "show_menu"
    ]);
  });

  it("no inventa una variable que no está verificada", () => {
    const reply = buildAllowedVariableReply(
      { response_key: "SPECIFICATIONS", opener: "NEUTRAL" },
      allowedVariables
    );
    expect(reply.text).toBe("Ese dato todavía no está verificado. Prefiero no inventarte información.");
  });

  it("responde con el valor exacto permitido por el código", () => {
    const reply = buildAllowedVariableReply(
      { response_key: "DELIVERY", opener: "NEUTRAL" },
      allowedVariables
    );
    expect(reply.text).toContain(allowedVariables.delivery);
  });

  it("bloquea temas ajenos con una respuesta fija", () => {
    const reply = buildAllowedVariableReply(
      { response_key: "OFF_TOPIC", opener: "NEUTRAL" },
      allowedVariables
    );
    expect(reply.text).toContain("únicamente con la secadora portátil");
  });

  it("humaniza una consulta mixta sin permitir texto libre de Gemini", () => {
    const reply = buildAllowedVariableReply(
      { response_key: "PRICE", opener: "LIKED_VIDEO" },
      allowedVariables
    );
    expect(reply.text).toContain("Qué bueno que te gustó el video");
    expect(reply.text).toContain("$49.99");
  });

  it("aclara que secar no significa lavar ni desinfectar", () => {
    const reply = buildAllowedVariableReply(
      { response_key: "HYGIENE", opener: "NEUTRAL" },
      allowedVariables
    );
    expect(reply.text).toContain("seca prendas previamente lavadas");
    expect(reply.text).toContain("No está verificado");
  });
});

