PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  whatsapp_id TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL CHECK (mode IN ('BOT', 'WAITING_OWNER', 'HUMAN')),
  state TEXT NOT NULL CHECK (
    state IN (
      'START', 'INTERESTED', 'EVALUATING', 'PURCHASE_INTENT', 'COLLECTING_DATA',
      'WAITING_LOCATION', 'WAITING_CONFIRMATION', 'ORDER_CONFIRMED', 'CANCELLED'
    )
  ),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_events (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  message_id TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('IN', 'OUT')),
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_conversation_created
  ON conversation_events(conversation_id, created_at);

