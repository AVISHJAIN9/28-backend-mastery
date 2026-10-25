/**
 * Pseudonymisation Utilities
 * Replaces direct identifiers with reversible tokens stored in a secure mapping table.
 */

const crypto = require("crypto");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ─── Token-Based Pseudonymisation ────────────────────────────────────────────

/**
 * Generate a pseudonym token for a value.
 * Stores the mapping in a secure, access-controlled table.
 * @returns {string} pseudonym token
 */
async function pseudonymise(originalValue, fieldType = "generic") {
  const token = "PSE_" + crypto.randomBytes(12).toString("hex").toUpperCase();
  await pool.query(
    `INSERT INTO pseudonym_mappings (token, original_value, field_type, created_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (original_value, field_type) DO UPDATE SET token = pseudonym_mappings.token
     RETURNING token`,
    [token, String(originalValue), fieldType]
  );
  // Fetch actual token (in case of conflict, existing token is returned)
  const { rows } = await pool.query(
    "SELECT token FROM pseudonym_mappings WHERE original_value=$1 AND field_type=$2",
    [String(originalValue), fieldType]
  );
  return rows[0].token;
}

/**
 * Reverse a pseudonym token back to the original value.
 * Should only be callable by authorised services.
 */
async function depseudonymise(token) {
  const { rows } = await pool.query(
    "SELECT original_value, field_type FROM pseudonym_mappings WHERE token=$1",
    [token]
  );
  if (!rows[0]) throw new Error(`Token not found: ${token}`);
  return { value: rows[0].original_value, fieldType: rows[0].field_type };
}

/**
 * Pseudonymise specific fields in a record.
 */
async function pseudonymiseRecord(record, fields) {
  const result = { ...record };
  for (const field of fields) {
    if (result[field] != null) {
      result[field] = await pseudonymise(result[field], field);
    }
  }
  return result;
}

/**
 * Delete all pseudonym mappings for a user (call during erasure).
 */
async function deletePseudonymMappings(originalValues) {
  for (const value of originalValues) {
    await pool.query("DELETE FROM pseudonym_mappings WHERE original_value=$1", [String(value)]);
  }
}

// Migration SQL:
/*
CREATE TABLE IF NOT EXISTS pseudonym_mappings (
  token          TEXT PRIMARY KEY,
  original_value TEXT NOT NULL,
  field_type     TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(original_value, field_type)
);
-- IMPORTANT: Restrict access to this table strictly — it is the re-identification key.
-- REVOKE ALL ON pseudonym_mappings FROM PUBLIC;
-- GRANT SELECT, INSERT ON pseudonym_mappings TO pseudonym_service_role;
*/

module.exports = { pseudonymise, depseudonymise, pseudonymiseRecord, deletePseudonymMappings };
