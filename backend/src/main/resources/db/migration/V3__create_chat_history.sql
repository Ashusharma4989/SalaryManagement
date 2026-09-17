SET search_path = public;

-- Chat history: stores chat messages as JSON per user
CREATE TABLE IF NOT EXISTS chat_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  messages TEXT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_chat_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uk_chat_history_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user ON chat_history(user_id);
