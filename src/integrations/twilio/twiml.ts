import type { BotReply } from "../../domain/responses.ts";

const commandByButtonId: Record<string, string> = {
  show_price: "COSTO",
  show_specs: "DETALLES",
  show_menu: "MENÚ",
  continue_purchase: "COMPRAR",
  confirm_checkout: "CONFIRMAR",
  other_question: "DUDA",
  cancel_checkout: "CANCELAR"
};

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export function replyToSandboxText(reply: BotReply): string {
  if (!reply.buttons?.length) return reply.text;
  const commands = reply.buttons
    .map((button) => commandByButtonId[button.id])
    .filter((command): command is string => Boolean(command));
  return commands.length
    ? `${reply.text}\n\nResponde: ${commands.join(" | ")}`
    : reply.text;
}

export function toTwiml(reply: BotReply | null): string {
  const message = reply ? `<Message>${escapeXml(replyToSandboxText(reply))}</Message>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${message}</Response>`;
}
