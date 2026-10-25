/**
 * Immutable Audit Logger with Hash Chaining
 * Each entry's hash includes the previous entry's hash — forming a tamper-evident chain.
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

const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Compute SHA-256 hash for an audit entry.
 */
function computeHash(entry, previousHash) {
  const payload = JSON.stringify({
    previousHash,
    eventType: entry.eventType,
    actorId: entry.actorId,
    targetId: entry.targetId,
    metadata: entry.metadata,
    createdAt: entry.createdAt,
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Get the hash of the most recent log entry (for chain linking).
 */
async function getLastHash() {
  const { rows } = await pool.query(
    "SELECT entry_hash FROM audit_log ORDER BY sequence DESC LIMIT 1"
  );
  return rows[0]?.entry_hash || GENESIS_HASH;
}

/**
 * Write an audit log entry.
 * @param {object} entry
 * @param {string} entry.eventType   - e.g. 'data.access', 'consent.granted'
 * @param {string} entry.actorId     - who performed the action (user/admin ID)
 * @param {string} [entry.targetId]  - subject of the action (e.g. target user ID)
 * @param {object} [entry.metadata]  - additional context (IP, fields affected, etc.)
 * @param {string} [entry.actorRole] - 'user' | 'admin' | 'system'
 */
async function log(entry) {
  const createdAt = new Date().toISOString();
  const fullEntry = { ...entry, createdAt };

  const previousHash = await getLastHash();
  const entryHash = computeHash(fullEntry, previousHash);

  await pool.query(
    `INSERT INTO audit_log
       (event_type, actor_id, actor_role, target_id, metadata, previous_hash, entry_hash, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      entry.eventType,
      entry.actorId,
      entry.actorRole || "user",
      entry.targetId || null,
      JSON.stringify(entry.metadata || {}),
      previousHash,
      entryHash,
      createdAt,
    ]
  );

  return { entryHash, createdAt };
}

// ─── Convenience Helpers ──────────────────────────────────────────────────────

const audit = {
  dataAccess: (actorId, targetId, fields, ip) =>
    log({ eventType: "data.access", actorId, targetId, metadata: { fields, ip } }),

  dataExport: (actorId, targetId, format, ip) =>
    log({ eventType: "data.export", actorId, targetId, metadata: { format, ip } }),

  consentGranted: (actorId, category, version) =>
    log({ eventType: "consent.granted", actorId, targetId: actorId, metadata: { category, version } }),

  consentWithdrawn: (actorId, category) =>
    log({ eventType: "consent.withdrawn", actorId, targetId: actorId, metadata: { category } }),

  erasureRequested: (actorId, targetId, reason) =>
    log({ eventType: "erasure.requested", actorId, targetId, metadata: { reason } }),

  erasureCompleted: (actorId, targetId) =>
    log({ eventType: "erasure.completed", actorId: "system", targetId, metadata: { requestedBy: actorId } }),

  authLogin: (actorId, ip, success) =>
    log({ eventType: success ? "auth.login" : "auth.failed", actorId, metadata: { ip } }),

  adminAction: (actorId, action, targetId, details) =>
    log({ eventType: "admin.action", actorId, actorRole: "admin", targetId, metadata: { action, details } }),

  breachDetected: (actorId, scope, severity) =>
    log({ eventType: "breach.detected", actorId: "system", metadata: { scope, severity }, actorRole: "system" }),
};

module.exports = { log, audit, computeHash, GENESIS_HASH };
