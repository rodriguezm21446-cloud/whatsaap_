import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { GeminiProductAssistant } from "../src/ai/gemini.ts";
import { detectIntent } from "../src/domain/intent.ts";
import {
  buildAllowedVariableReply,
  buildPreCheckoutReply,
  buildReply
} from "../src/domain/responses.ts";

const product = {
  name: "Secadora de ropa portátil con bolsa",
  price: process.env.ROBOTIN_TEST_PRICE ?? "POR_CONFIGURAR",
  specificationsReady: true,
  specifications:
    "Secadora portátil con bolsa de aire caliente; diseño ligero y plegable. Unidad principal de 27 cm de ancho y 19,5 cm de alto según la imagen."
};

const allowedVariables = {
  ...product,
  features:
    "Secado con bolsa de aire caliente, diseño ligero y plegable para transportarla y guardarla con facilidad.",
  size:
    "La unidad principal mide 27 cm de ancho y 19,5 cm de alto. La referencia de 10,5 cm requiere confirmación.",
  specifications: product.specifications,
  useCases:
    "Ideal para departamentos pequeños, dormitorios, viajes, campamentos o donde no hay secadora convencional.",
  delivery: process.env.ROBOTIN_TEST_DELIVERY ?? "NO_VERIFICADO",
  warranty: process.env.ROBOTIN_TEST_WARRANTY ?? "NO_VERIFICADO",
  stock: process.env.ROBOTIN_TEST_STOCK ?? "NO_VERIFICADO",
  usage:
    "Seca con aire caliente prendas previamente lavadas y húmedas dentro de la bolsa; falta confirmar la carga máxima en el manual."
};

const gemini = process.env.GEMINI_API_KEY
  ? new GeminiProductAssistant({
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemini-3.5-flash-lite"
    })
  : null;

const choices = new Map([
  ["1", "show_price"],
  ["2", "show_specs"],
  ["3", "continue_purchase"]
]);

const showReply = (reply) => {
  output.write(`\nRobotín: ${reply.text}\n`);
  if (reply.buttons?.length) {
    reply.buttons.forEach((button, index) => output.write(`  ${index + 1}. ${button.title}\n`));
  }
};

const terminal = createInterface({ input, output });
let awaitingConfirmation = false;

output.write("\nPrueba privada de Robotín. No se envía ni se guarda información.\n");
output.write("Escribe como cliente. Usa 1, 2 o 3 para los botones y 'salir' para terminar.\n");
output.write("\nCliente: ");

try {
  for await (const rawMessage of terminal) {
    const message = rawMessage.trim();
    if (message.toLowerCase() === "salir") break;

    if (awaitingConfirmation && ["si", "sí", "confirmar"].includes(message.toLowerCase())) {
      output.write(
        "\nRobotín: ¡Excelente! Estoy preparando el registro de tu pedido. Dame un momentito 😊\n"
      );
      output.write("[SIMULACIÓN TELEGRAM] La dueña recibiría Continuar Robotín / Tomar el mando.\n");
      awaitingConfirmation = false;
      output.write("\nCliente: ");
      continue;
    }

    const interactiveId = choices.get(message);
    const intent = detectIntent(message, interactiveId);
    if (interactiveId === "continue_purchase" || intent === "PURCHASE_INTENT") {
      showReply(buildPreCheckoutReply(product));
      output.write("Para simular el botón 'Sí, continuar', escribe: si\n");
      awaitingConfirmation = true;
      output.write("\nCliente: ");
      continue;
    }

    if (!interactiveId && gemini) {
      try {
        const classification = await gemini.classify(message);
        showReply(buildAllowedVariableReply(classification, allowedVariables));
      } catch {
        output.write("\nRobotín: No pude verificar esa consulta ahora. Puedes usar las opciones del menú.\n");
      }
    } else {
      showReply(buildReply(intent, product));
    }
    output.write("\nCliente: ");
  }
} finally {
  terminal.close();
}
