/**
 * GDPR Breach Notification Workflow (Articles 33 & 34)
 * - Notify the supervisory authority within 72 hours
 * - Notify affected data subjects without undue delay (if high risk)
 */

const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const pool = new Pool({
  host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});

const RISK_LEVELS = ["low", "medium", "high", "critical"];

/**
 * Record a data breach incident.
 */
async function recordBreach(breach) {
  const {
    description, dataCategories, estimatedSubjectsAffected,
    riskLevel, discovered_by, rootCause = null,
  } = breach;

  if (!RISK_LEVELS.includes(riskLevel)) throw new Error(`Invalid riskLevel: ${riskLevel}`);

  const id = uuidv4();
  const discoveredAt = new Date();
  const notifyAuthorityBy = new Date(discoveredAt.getTime() + 72 * 60 * 60 * 1000); // 72 hours

  await pool.query(
    `INSERT INTO breach_incidents
       (id, description, data_categories, estimated_subjects, risk_level,
        discovered_by, root_cause, discovered_at, notify_authority_by, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open')`,
    [id, description, dataCategories, estimatedSubjectsAffected,
     riskLevel, discovered_by, rootCause, discoveredAt, notifyAuthorityBy]
  );

  return { breachId: id, discoveredAt, notifyAuthorityBy, riskLevel };
}

/**
 * Mark authority as notified (Article 33).
 */
async function markAuthorityNotified(breachId, notificationDetails) {
  await pool.query(
    `UPDATE breach_incidents SET
       authority_notified_at = NOW(),
       authority_notification = $2,
       status = CASE WHEN status = 'open' THEN 'authority_notified' ELSE status END
     WHERE id = $1`,
    [breachId, JSON.stringify(notificationDetails)]
  );
}

/**
 * Mark data subjects as notified (Article 34 — required for high-risk breaches).
 */
async function markSubjectsNotified(breachId, method, count) {
  await pool.query(
    `UPDATE breach_incidents SET
       subjects_notified_at = NOW(),
       subjects_notification_method = $2,
       subjects_notified_count = $3,
       status = 'closed'
     WHERE id = $1`,
    [breachId, method, count]
  );
}

/**
 * Check if a breach requires notification to data subjects (Art. 34).
 * Required when the breach is likely to result in HIGH RISK to individuals.
 */
function requiresSubjectNotification(riskLevel) {
  return riskLevel === "high" || riskLevel === "critical";
}

/**
 * Generate an Article 33 notification template for the supervisory authority.
 */
function generateAuthorityNotification(breach) {
  return {
    to: "ICO / Data Protection Board",
    subject: `Personal Data Breach Notification – ${breach.id}`,
    sections: {
      "1_nature_of_breach": breach.description,
      "2_categories_and_approximate_number_of_subjects": `Categories: ${breach.dataCategories?.join(", ")}. Estimated subjects: ${breach.estimatedSubjectsAffected}`,
      "3_dpo_contact": `DPO: ${process.env.DPO_EMAIL || "dpo@example.com"}`,
      "4_likely_consequences": `Risk level assessed as: ${breach.riskLevel}`,
      "5_measures_taken": "Under investigation — remediation measures in progress.",
    },
    notifiedAt: new Date().toISOString(),
  };
}

module.exports = {
  recordBreach, markAuthorityNotified, markSubjectsNotified,
  requiresSubjectNotification, generateAuthorityNotification,
};
