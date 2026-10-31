export const conversationModes = ["BOT", "WAITING_OWNER", "HUMAN"] as const;
export type ConversationMode = (typeof conversationModes)[number];

export const conversationStates = [
  "START",
  "INTERESTED",
  "EVALUATING",
  "PURCHASE_INTENT",
  "COLLECTING_DATA",
  "WAITING_LOCATION",
  "WAITING_CONFIRMATION",
  "ORDER_CONFIRMED",
  "CANCELLED"
] as const;

export type ConversationState = (typeof conversationStates)[number];

export interface Conversation {
  id: string;
  whatsappId: string;
  mode: ConversationMode;
  state: ConversationState;
  version: number;
  createdAt: string;
  updatedAt: string;
}

