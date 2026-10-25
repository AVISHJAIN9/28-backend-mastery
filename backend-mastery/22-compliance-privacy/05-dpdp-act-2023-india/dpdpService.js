/**
 * DPDP Act 2023 – Compliance Service
 * Handles Data Principal rights under India's Digital Personal Data Protection Act 2023.
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

// ─── Rights under DPDP Act 2023 ──────────────────────────────────────────────
// Section 11: Right to access information
// Section 12: Right to correction and erasure
// Section 13: Right to grievance redressal
// Section 14: Right to nominate

const REQUEST_TYPES = ["access", "correction", "erasure", "grievance", "nomination"];
const SLA_DAYS = { access: 30, correction: 30, erasure: 30, grievance: 7, nomination: 7 };

/**
 * Submit a Data Principal rights request.
 */
async function submitDPDPRequest(dataPrincipalId, type, payload = {}) {
  if (!REQUEST_TYPES.includes(type)) {
    throw new Error(`Invalid request type: ${type}. Must be one of: ${REQUEST_TYPES.join(", ")}`);
  }
  const id = uuidv4();
  const sla = SLA_DAYS[type];
  const dueBy = new Date();
  dueBy.setDate(dueBy.getDate() + sla);

  await pool.query(
    `INSERT INTO dpdp_requests (id, data_principal_id, type, payload, status, due_by, created_at)
     VALUES ($1, $2, $3, $4, 'pending', $5, NOW())`,
    [id, dataPrincipalId, type, JSON.stringify(payload), dueBy]
  );
  return { requestId: id, type, dueBy, slaDays: sla };
}

/**
 * Get all requests for a Data Principal.
 */
async function getDPDPRequests(dataPrincipalId) {
  const { rows } = await pool.query(
    "SELECT * FROM dpdp_requests WHERE data_principal_id=$1 ORDER BY created_at DESC",
    [dataPrincipalId]
  );
  return rows;
}

/**
 * Process a correction request — update fields in the users table.
 */
async function processCorrectionRequest(requestId, corrections) {
  const { rows } = await pool.query("SELECT * FROM dpdp_requests WHERE id=$1", [requestId]);
  const req = rows[0];
  if (!req) throw new Error("Request not found");
  if (req.type !== "correction") throw new Error("Not a correction request");

  const allowedFields = ["name", "email", "phone", "address", "date_of_birth"];
  const updates = Object.entries(corrections).filter(([k]) => allowedFields.includes(k));
  if (!updates.length) throw new Error("No valid fields to correct");

  const setClause = updates.map(([k], i) => `${k}=$${i + 2}`).join(", ");
  await pool.query(
    `UPDATE users SET ${setClause}, updated_at=NOW() WHERE id=$1`,
    [req.data_principal_id, ...updates.map(([, v]) => v)]
  );
  await pool.query(
    "UPDATE dpdp_requests SET status='completed', completed_at=NOW() WHERE id=$1",
    [requestId]
  );
  return { corrected: updates.map(([k]) => k) };
}

/**
 * Register a nominee for a Data Principal (Section 14).
 */
async function registerNominee(dataPrincipalId, nomineeDetails) {
  await pool.query(
    `INSERT INTO dpdp_nominees (id, data_principal_id, nominee_name, nominee_email, relationship, created_at)
     VALUES ($1,$2,$3,$4,$5,NOW())
     ON CONFLICT (data_principal_id) DO UPDATE SET
       nominee_name=EXCLUDED.nominee_name, nominee_email=EXCLUDED.nominee_email,
       relationship=EXCLUDED.relationship, updated_at=NOW()`,
    [uuidv4(), dataPrincipalId, nomineeDetails.name, nomineeDetails.email, nomineeDetails.relationship]
  );
}

/**
 * Check if a cross-border data transfer is permitted under DPDP (Section 16).
 * The Central Government will publish an approved countries list.
 */
const APPROVED_COUNTRIES = ["US", "UK", "AU", "SG", "JP", "CA", "NZ", "DE", "FR"];
function isTransferPermitted(countryCode) {
  return APPROVED_COUNTRIES.includes(countryCode.toUpperCase());
}

module.exports = {
  submitDPDPRequest, getDPDPRequests, processCorrectionRequest,
  registerNominee, isTransferPermitted, REQUEST_TYPES, SLA_DAYS,
};
