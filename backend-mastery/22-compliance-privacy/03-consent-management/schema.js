/**
 * Consent Management – Database Schema
 *
 * Run this SQL to create the required tables.
 */

const MIGRATION_SQL = `
-- Consent records (one row per consent event, full history retained)
CREATE TABLE IF NOT EXISTS user_consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  category     TEXT NOT NULL,
  granted      BOOLEAN NOT NULL,
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version      TEXT NOT NULL DEFAULT '1.0',  -- consent notice version
  source       TEXT NOT NULL DEFAULT 'preference_centre',
                -- e.g. 'signup_form', 'preference_centre', 'api', 'withdrawal'
  ip_address   INET,
  user_agent   TEXT,
  is_current   BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_uc_user_id     ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_uc_user_cat    ON user_consents(user_id, category);
CREATE INDEX IF NOT EXISTS idx_uc_current     ON user_consents(user_id, category, is_current);
CREATE INDEX IF NOT EXISTS idx_uc_category    ON user_consents(category, granted);

-- View: current consents only
CREATE OR REPLACE VIEW current_user_consents AS
  SELECT * FROM user_consents WHERE is_current = true;
`;

module.exports = { MIGRATION_SQL };
