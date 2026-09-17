-- V6__sessions_table.sql
-- Database-backed session management
-- Replaces JWT-based auth with opaque session IDs stored server-side.

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  ip_address TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
