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
  name: "Secadora portátil",
  price: process.env.ROBOTIN_TEST_PRICE ?? "POR_CONFIGURAR",
  specificationsReady: false
};

const allowedVariables = {
  ...product,
  specifications: process.env.ROBOTIN_TEST_SPECIFICATIONS ?? "NO_VERIFICADO",
  delivery: process.env.ROBOTIN_TEST_DELIVERY ?? "NO_VERIFICADO",
  warranty: process.env.ROBOTIN_TEST_WARRANTY ?? "NO_VERIFICADO",
  stock: process.env.ROBOTIN_TEST_STOCK ?? "NO_VERIFICADO",
  usage: process.env.ROBOTIN_TEST_USAGE ?? "NO_VERIFICADO"
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
  ["3", "human_advisor"]
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
    if (intent === "HUMAN_HANDOFF") {
      output.write("\nRobotín: Claro 👤 Ya avisé al asesor y pausé mis respuestas automáticas en este chat.\n");
      output.write("[SIMULACIÓN TELEGRAM] Llegaría el número del cliente y la solicitud de atención.\n");
      output.write("\nCliente: ");
      continue;
    }
    if (interactiveId === "continue_purchase" || intent === "PURCHASE_INTENT") {
      showReply(buildPreCheckoutReply(product));
      output.write("Para simular el botón 'Sí, continuar', escribe: si\n");
      awaitingConfirmation = true;
      output.write("\nCliente: ");
      continue;
    }

    if (intent === "OTHER_QUESTION" && gemini) {
      try {
        const responseKey = await gemini.classify(message);
        showReply(buildAllowedVariableReply(responseKey, allowedVariables));
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
