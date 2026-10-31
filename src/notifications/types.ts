export type NotificationJob =
  | {
      type: "ADVISOR_REQUEST";
      conversationId: string;
      whatsappId: string;
      lastMessage: string;
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
      whatsappIdMasked: string;
      message: string;
    };

