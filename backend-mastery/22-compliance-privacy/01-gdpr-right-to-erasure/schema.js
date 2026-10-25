/**
 * Schema & DB helpers for GDPR Erasure Requests
 * Using a simple pg (node-postgres) pattern; swap with your ORM as needed.
 */

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ─── Migration SQL ────────────────────────────────────────────────────────────
// Run once to create the table:
/*
CREATE TABLE IF NOT EXISTS erasure_requests (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | completed | rejected
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
*/

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findUserById(userId) {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [userId]);
  return rows[0] || null;
}

async function findPendingErasureRequest(userId) {
  const { rows } = await pool.query(
    "SELECT * FROM erasure_requests WHERE user_id = $1 AND status = 'pending' LIMIT 1",
    [userId]
  );
  return rows[0] || null;
}

async function findErasureRequestById(id) {
  const { rows } = await pool.query("SELECT * FROM erasure_requests WHERE id = $1 LIMIT 1", [id]);
  return rows[0] || null;
}

async function createErasureRequest({ id, userId, reason, status, scheduledAt, createdAt }) {
  await pool.query(
    `INSERT INTO erasure_requests (id, user_id, reason, status, scheduled_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, reason, status, scheduledAt, createdAt]
  );
}

async function updateErasureRequest(id, updates) {
  const fields = Object.keys(updates)
    .map((k, i) => `${toSnake(k)} = $${i + 2}`)
    .join(", ");
  await pool.query(`UPDATE erasure_requests SET ${fields} WHERE id = $1`, [id, ...Object.values(updates)]);
}

async function anonymiseUserData(userId) {
  // Overwrite PII fields with anonymised values
  await pool.query(
    `UPDATE users SET
       name = 'Anonymised User',
       email = CONCAT('anon_', id, '@deleted.invalid'),
       phone = NULL,
       address = NULL,
       date_of_birth = NULL,
       deleted_at = NOW()
     WHERE id = $1`,
    [userId]
  );
}

async function deleteUserRelatedData(userId) {
  // Cascade delete or anonymise related tables
  await pool.query("DELETE FROM user_sessions WHERE user_id = $1", [userId]);
  await pool.query("DELETE FROM user_preferences WHERE user_id = $1", [userId]);
  await pool.query("DELETE FROM user_consents WHERE user_id = $1", [userId]);
  // Add more tables as needed
}

function toSnake(str) {
  return str.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`);
}

module.exports = {
  findUserById,
  findPendingErasureRequest,
  findErasureRequestById,
  createErasureRequest,
  updateErasureRequest,
  anonymiseUserData,
  deleteUserRelatedData,
};
