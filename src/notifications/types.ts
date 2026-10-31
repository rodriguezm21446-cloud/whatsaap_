export type NotificationJob =
  | {
      type: "CHAT_CONTROL";
      conversationId: string;
      whatsappId: string;
    }
  | {
      type: "OWNER_DECISION";
      conversationId: string;
      whatsappIdMasked: string;
      lastMessage: string;
      productName: string;
      productPrice: string;
    }
  | {
      type: "HUMAN_MESSAGE";
      conversationId: string;
      whatsappId: string;
      message: string;
    };

