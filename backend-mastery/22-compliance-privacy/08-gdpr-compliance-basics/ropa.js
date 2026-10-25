/**
 * Record of Processing Activities (ROPA) Builder – GDPR Article 30
 * Every organisation that processes personal data must maintain a ROPA.
 */

const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const pool = new Pool({
  host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});

/**
 * Add a processing activity to the ROPA.
 */
async function addROPAEntry(activity) {
  const {
    name, purpose, lawfulBasis, dataCategories, dataSubjectCategories,
    recipients, retentionPeriod, crossBorderTransfers = [], technicalMeasures,
    dpiaRequired = false, dpiaCompleted = false,
  } = activity;

  const id = uuidv4();
  await pool.query(
    `INSERT INTO ropa_entries
       (id, name, purpose, lawful_basis, data_categories, data_subject_categories,
        recipients, retention_period, cross_border_transfers, technical_measures,
        dpia_required, dpia_completed, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())`,
    [id, name, purpose, lawfulBasis, dataCategories, dataSubjectCategories,
     recipients, retentionPeriod, JSON.stringify(crossBorderTransfers),
     technicalMeasures, dpiaRequired, dpiaCompleted]
  );
  return id;
}

/**
 * Get all ROPA entries.
 */
async function getROPA() {
  const { rows } = await pool.query("SELECT * FROM ropa_entries ORDER BY name ASC");
  return rows;
}

/**
 * Export ROPA as a structured object for documentation.
 */
async function exportROPA() {
  const entries = await getROPA();
  return {
    organisation: process.env.ORG_NAME || "Your Organisation",
    dpo: process.env.DPO_EMAIL || "dpo@example.com",
    exportedAt: new Date().toISOString(),
    entries: entries.map(e => ({
      id: e.id,
      processingActivity: e.name,
      purpose: e.purpose,
      lawfulBasis: e.lawful_basis,
      dataCategories: e.data_categories,
      dataSubjectCategories: e.data_subject_categories,
      recipients: e.recipients,
      retentionPeriod: e.retention_period,
      crossBorderTransfers: e.cross_border_transfers,
      technicalMeasures: e.technical_measures,
      dpiaRequired: e.dpia_required,
      dpiaCompleted: e.dpia_completed,
    })),
  };
}

// Sample ROPA entries for bootstrapping:
const SAMPLE_ROPA_ENTRIES = [
  {
    name: "User Account Management",
    purpose: "Create and manage user accounts to deliver the service",
    lawfulBasis: "contract",
    dataCategories: ["name", "email", "password_hash"],
    dataSubjectCategories: ["Registered users"],
    recipients: ["Internal engineering team"],
    retentionPeriod: "Duration of account + 2 years",
    technicalMeasures: "Encryption at rest, TLS in transit, RBAC",
    dpiaRequired: false,
  },
  {
    name: "Marketing Email Campaigns",
    purpose: "Send promotional emails to users who have opted in",
    lawfulBasis: "consent",
    dataCategories: ["email", "name", "marketing preferences"],
    dataSubjectCategories: ["Users who have given marketing consent"],
    recipients: ["Email service provider (processor)"],
    retentionPeriod: "Until consent withdrawn + 2 years",
    technicalMeasures: "Consent records, unsubscribe mechanism",
    dpiaRequired: false,
  },
  {
    name: "Product Analytics",
    purpose: "Understand how users use the product to improve it",
    lawfulBasis: "legitimate_interests",
    dataCategories: ["pseudonymised user ID", "page views", "feature usage"],
    dataSubjectCategories: ["All registered users"],
    recipients: ["Analytics platform (processor)"],
    retentionPeriod: "2 years",
    technicalMeasures: "Pseudonymisation, aggregation",
    dpiaRequired: false,
  },
];

module.exports = { addROPAEntry, getROPA, exportROPA, SAMPLE_ROPA_ENTRIES };
