import type { Conversation, ConversationMode, ConversationState } from "../domain/conversation.ts";

interface ConversationRow {
  id: string;
  whatsapp_id: string;
  mode: ConversationMode;
  state: ConversationState;
  version: number;
  created_at: string;
  updated_at: string;
}

const mapRow = (row: ConversationRow): Conversation => ({
  id: row.id,
  whatsappId: row.whatsapp_id,
  mode: row.mode,
  state: row.state,
  version: row.version,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export interface ConversationLookup {
  conversation: Conversation;
  created: boolean;
}

export class ConversationRepository {
  constructor(private readonly db: D1Database) {}

  async getOrCreate(whatsappId: string): Promise<ConversationLookup> {
    const existing = await this.db
      .prepare("SELECT * FROM conversations WHERE whatsapp_id = ? LIMIT 1")
      .bind(whatsappId)
      .first<ConversationRow>();
    if (existing) return { conversation: mapRow(existing), created: false };

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db
      .prepare(
        "INSERT INTO conversations (id, whatsapp_id, mode, state, version, created_at, updated_at) VALUES (?, ?, 'BOT', 'START', 1, ?, ?)"
      )
      .bind(id, whatsappId, now, now)
      .run();
    return {
      conversation: {
        id,
        whatsappId,
        mode: "BOT",
        state: "START",
        version: 1,
        createdAt: now,
        updatedAt: now
      },
      created: true
    };
  }

  async setControl(
    id: string,
    mode: ConversationMode,
    state: ConversationState
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        "UPDATE conversations SET mode = ?, state = ?, version = version + 1, updated_at = ? WHERE id = ?"
      )
      .bind(mode, state, new Date().toISOString(), id)
      .run();
    return result.meta.changes === 1;
  }
}

