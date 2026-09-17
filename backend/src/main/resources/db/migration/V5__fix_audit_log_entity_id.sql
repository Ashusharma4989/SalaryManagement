SET search_path = public;

-- Fix: entity_id should be nullable for non-entity events (e.g., LOGIN)
ALTER TABLE audit_log ALTER COLUMN entity_id DROP NOT NULL;
