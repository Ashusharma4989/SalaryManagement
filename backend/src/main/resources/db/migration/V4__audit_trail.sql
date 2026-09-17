SET search_path = public;

-- Audit log: tracks all CRUD operations on key entities
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id BIGINT,
  action TEXT NOT NULL,
  username TEXT,
  old_values TEXT,
  new_values TEXT,
  details TEXT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_username ON audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Grants for audit_log table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE audit_log TO {DB_USERNAME};
GRANT USAGE, SELECT ON SEQUENCE audit_log_id_seq TO {DB_USERNAME};
