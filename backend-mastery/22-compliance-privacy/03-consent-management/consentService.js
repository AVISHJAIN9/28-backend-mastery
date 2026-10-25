/**
 * Consent Management Service
 * Handles storing, retrieving, and withdrawing user consents.
 */

const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Valid consent categories
const CONSENT_CATEGORIES = [
  "marketing_email",
  "analytics",
  "third_party_sharing",
  "personalisation",
  "research_profiling",
];

/**
 * Get current consents for a user.
 * Returns an object keyed by category with { granted, grantedAt, version }
 */
async function getUserConsents(userId) {
  const { rows } = await pool.query(
    `SELECT category, granted, granted_at, version, source
     FROM user_consents
     WHERE user_id = $1 AND is_current = true`,
    [userId]
  );
  const result = {};
  for (const cat of CONSENT_CATEGORIES) {
    result[cat] = { granted: false, grantedAt: null, version: null, source: null };
  }
  for (const row of rows) {
    result[row.category] = {
      granted: row.granted,
      grantedAt: row.granted_at,
      version: row.version,
      source: row.source,
    };
  }
  return result;
}

/**
 * Save/update consents for a user.
 * @param {string} userId
 * @param {object} consents - { marketing_email: true, analytics: false, ... }
 * @param {object} meta - { version, source, ipAddress }
 */
async function saveUserConsents(userId, consents, meta = {}) {
  const { version = "1.0", source = "preference_centre", ipAddress = null } = meta;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [category, granted] of Object.entries(consents)) {
      if (!CONSENT_CATEGORIES.includes(category)) continue;
      // Mark previous record as not current
      await client.query(
        `UPDATE user_consents SET is_current = false
         WHERE user_id=$1 AND category=$2 AND is_current=true`,
        [userId, category]
      );
      // Insert new record
      await client.query(
        `INSERT INTO user_consents
           (id, user_id, category, granted, granted_at, version, source, ip_address, is_current)
         VALUES ($1,$2,$3,$4,NOW(),$5,$6,$7,true)`,
        [uuidv4(), userId, category, granted, version, source, ipAddress]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Withdraw a specific consent category.
 */
async function withdrawConsent(userId, category) {
  if (!CONSENT_CATEGORIES.includes(category)) {
    throw new Error(`Unknown consent category: ${category}`);
  }
  await saveUserConsents(userId, { [category]: false }, { source: "withdrawal" });
}

/**
 * Get full consent history for a user (audit trail).
 */
async function getConsentHistory(userId) {
  const { rows } = await pool.query(
    `SELECT id, category, granted, granted_at, version, source, ip_address
     FROM user_consents
     WHERE user_id = $1
     ORDER BY granted_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Check if a user has granted a specific consent.
 */
async function hasConsent(userId, category) {
  const { rows } = await pool.query(
    `SELECT granted FROM user_consents
     WHERE user_id=$1 AND category=$2 AND is_current=true LIMIT 1`,
    [userId, category]
  );
  return rows[0]?.granted === true;
}

module.exports = {
  CONSENT_CATEGORIES,
  getUserConsents,
  saveUserConsents,
  withdrawConsent,
  getConsentHistory,
  hasConsent,
};
