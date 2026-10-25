/**
 * Data Retention – Schema & Migration SQL
 */

const MIGRATION_SQL = `
-- Retention audit log: records every purge action taken
CREATE TABLE IF NOT EXISTS retention_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL,
  action      TEXT NOT NULL,   -- 'delete' | 'anonymise' | 'archive'
  records_affected INTEGER NOT NULL DEFAULT 0,
  run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status      TEXT NOT NULL DEFAULT 'ok',   -- 'ok' | 'error'
  error_msg   TEXT,
  run_by      TEXT DEFAULT 'purge_job'      -- 'purge_job' | 'admin:<id>'
);

CREATE INDEX IF NOT EXISTS idx_ral_category ON retention_audit_log(category);
CREATE INDEX IF NOT EXISTS idx_ral_run_at   ON retention_audit_log(run_at DESC);

-- Column additions needed in existing tables (add if not present):
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS anonymised_at TIMESTAMPTZ;
-- ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS anonymised_at TIMESTAMPTZ;
`;

module.exports = { MIGRATION_SQL };
