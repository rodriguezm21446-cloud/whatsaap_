export class EventRepository {
  constructor(private readonly db: D1Database) {}

  async recordInbound(
    conversationId: string,
    messageId: string,
    type: string
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        "INSERT OR IGNORE INTO conversation_events (id, conversation_id, message_id, direction, event_type, created_at) VALUES (?, ?, ?, 'IN', ?, ?)"
      )
      .bind(
        crypto.randomUUID(),
        conversationId,
        messageId,
        type,
        new Date().toISOString()
      )
      .run();
    return result.meta.changes === 1;
  }
}

