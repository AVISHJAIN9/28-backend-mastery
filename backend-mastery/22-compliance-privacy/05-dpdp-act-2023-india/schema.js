/**
 * DPDP Act 2023 – Database Schema
 */

const MIGRATION_SQL = `
-- Data Principal rights requests
CREATE TABLE IF NOT EXISTS dpdp_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_principal_id    TEXT NOT NULL,
  type                 TEXT NOT NULL,   -- access | correction | erasure | grievance | nomination
  payload              JSONB DEFAULT '{}',
  status               TEXT NOT NULL DEFAULT 'pending',  -- pending | in_progress | completed | rejected
  due_by               TIMESTAMPTZ NOT NULL,
  completed_at         TIMESTAMPTZ,
  rejection_reason     TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dpdp_principal ON dpdp_requests(data_principal_id);
CREATE INDEX IF NOT EXISTS idx_dpdp_status    ON dpdp_requests(status);
CREATE INDEX IF NOT EXISTS idx_dpdp_due_by    ON dpdp_requests(due_by);

-- Nominee registrations (Section 14)
CREATE TABLE IF NOT EXISTS dpdp_nominees (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_principal_id    TEXT NOT NULL UNIQUE,
  nominee_name         TEXT NOT NULL,
  nominee_email        TEXT NOT NULL,
  relationship         TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ
);

-- Consent notices served (for audit)
CREATE TABLE IF NOT EXISTS dpdp_consent_notices (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_principal_id    TEXT NOT NULL,
  version              TEXT NOT NULL,
  language_code        TEXT NOT NULL DEFAULT 'en',
  served_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted             BOOLEAN,
  accepted_at          TIMESTAMPTZ,
  ip_address           INET
);

CREATE INDEX IF NOT EXISTS idx_dcn_principal ON dpdp_consent_notices(data_principal_id);
`;

module.exports = { MIGRATION_SQL };
