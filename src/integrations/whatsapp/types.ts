export interface IncomingWhatsAppMessage {
  id: string;
  from: string;
  type: string;
  text: string;
  interactiveId?: string;
}

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined =>
  typeof value === "object" && value !== null ? (value as UnknownRecord) : undefined;

const firstRecord = (value: unknown): UnknownRecord | undefined =>
  Array.isArray(value) ? asRecord(value[0]) : undefined;

export function extractMessages(payload: unknown): IncomingWhatsAppMessage[] {
  const root = asRecord(payload);
  const entry = firstRecord(root?.entry);
  const change = firstRecord(entry?.changes);
  const value = asRecord(change?.value);
  const messages = Array.isArray(value?.messages) ? value.messages : [];

  return messages.flatMap((item): IncomingWhatsAppMessage[] => {
    const message = asRecord(item);
    if (!message || typeof message.id !== "string" || typeof message.from !== "string") return [];
    const type = typeof message.type === "string" ? message.type : "unknown";
    const textObject = asRecord(message.text);
    const interactive = asRecord(message.interactive);
    const buttonReply = asRecord(interactive?.button_reply);
    const listReply = asRecord(interactive?.list_reply);
    const button = asRecord(message.button);
    const interactiveId =
      (typeof buttonReply?.id === "string" ? buttonReply.id : undefined) ??
      (typeof listReply?.id === "string" ? listReply.id : undefined) ??
      (typeof button?.payload === "string" ? button.payload : undefined);
    const text =
      (typeof textObject?.body === "string" ? textObject.body : undefined) ??
      (typeof buttonReply?.title === "string" ? buttonReply.title : undefined) ??
      (typeof listReply?.title === "string" ? listReply.title : undefined) ??
      "";

    const extracted: IncomingWhatsAppMessage = {
      id: message.id,
      from: message.from,
      type,
      text
    };
    if (interactiveId !== undefined) extracted.interactiveId = interactiveId;
    return [extracted];
  });
}

