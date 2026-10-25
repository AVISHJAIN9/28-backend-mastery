/**
 * Audit Log Chain Verifier
 * Scans the full audit log and checks each entry's hash against the chain.
 * Reports any entries where the hash has been tampered with.
 */

const { Pool } = require("pg");
const { computeHash, GENESIS_HASH } = require("./auditLogger");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

/**
 * Verify the full audit log chain integrity.
 * @returns {{ valid: boolean, totalEntries: number, violations: object[] }}
 */
async function verifyChain() {
  const { rows } = await pool.query(
    `SELECT sequence, event_type, actor_id, actor_role, target_id,
            metadata, previous_hash, entry_hash, created_at
     FROM audit_log ORDER BY sequence ASC`
  );

  const violations = [];
  let expectedPreviousHash = GENESIS_HASH;

  for (const row of rows) {
    // Recompute hash for this entry
    const recomputed = computeHash(
      {
        eventType: row.event_type,
        actorId: row.actor_id,
        targetId: row.target_id,
        metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      },
      expectedPreviousHash
    );

    if (recomputed !== row.entry_hash) {
      violations.push({
        sequence: row.sequence,
        storedHash: row.entry_hash,
        recomputedHash: recomputed,
        previousHash: row.previous_hash,
        eventType: row.event_type,
        createdAt: row.created_at,
        issue: row.previous_hash !== expectedPreviousHash ? "CHAIN_BROKEN" : "HASH_MISMATCH",
      });
    }

    expectedPreviousHash = row.entry_hash;
  }

  return {
    valid: violations.length === 0,
    totalEntries: rows.length,
    violations,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Verify just a single entry by its sequence number.
 */
async function verifyEntry(sequence) {
  const { rows } = await pool.query(
    "SELECT * FROM audit_log WHERE sequence IN ($1, $1 - 1) ORDER BY sequence ASC",
    [sequence]
  );
  if (!rows.length) throw new Error(`Sequence ${sequence} not found`);
  const entry = rows.find((r) => r.sequence === sequence);
  const prev = rows.find((r) => r.sequence === sequence - 1);
  const prevHash = prev?.entry_hash || GENESIS_HASH;

  const recomputed = computeHash(
    {
      eventType: entry.event_type,
      actorId: entry.actor_id,
      targetId: entry.target_id,
      metadata: typeof entry.metadata === "string" ? JSON.parse(entry.metadata) : entry.metadata,
      createdAt: entry.created_at instanceof Date ? entry.created_at.toISOString() : entry.created_at,
    },
    prevHash
  );

  return {
    sequence,
    valid: recomputed === entry.entry_hash,
    storedHash: entry.entry_hash,
    recomputedHash: recomputed,
  };
}

module.exports = { verifyChain, verifyEntry };
