/**
 * Audit Trail – Immutable Database Schema
 *
 * IMPORTANT: After creation, revoke UPDATE and DELETE privileges.
 * This ensures no row can ever be modified or removed.
 */

const MIGRATION_SQL = `
-- Immutable audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  sequence      BIGSERIAL PRIMARY KEY,          -- auto-incrementing row number
  event_type    TEXT NOT NULL,                  -- e.g. 'data.access', 'consent.granted'
  actor_id      TEXT NOT NULL,                  -- who performed the action
  actor_role    TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin' | 'system'
  target_id     TEXT,                           -- subject of the action (may be null)
  metadata      JSONB NOT NULL DEFAULT '{}',    -- additional context
  previous_hash TEXT NOT NULL,                  -- hash of the previous log entry
  entry_hash    TEXT NOT NULL UNIQUE,           -- SHA-256 hash of this entry + previous_hash
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_audit_actor      ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_target     ON audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);

-- CRITICAL: Revoke modification privileges to enforce immutability
-- Run as superuser after creating the table:
-- REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM PUBLIC;
-- REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM your_app_role;
-- GRANT INSERT, SELECT ON audit_log TO your_app_role;
-- GRANT USAGE ON SEQUENCE audit_log_sequence_seq TO your_app_role;
`;

module.exports = { MIGRATION_SQL };
