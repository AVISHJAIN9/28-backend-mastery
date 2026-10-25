/**
 * Data Purge Job
 * Run this on a schedule (e.g. daily cron) to enforce retention policies.
 *
 * Usage: node purgeJob.js
 * Or schedule: 0 2 * * * node /path/to/purgeJob.js
 */

require("dotenv").config();
const { Pool } = require("pg");
const { RETENTION_POLICIES } = require("./retentionPolicy");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const PURGE_HANDLERS = {
  session_data: async (client) => {
    const cutoff = daysAgo(30);
    const { rowCount } = await client.query("DELETE FROM sessions WHERE created_at < $1", [cutoff]);
    return { deleted: rowCount };
  },

  application_logs: async (client) => {
    const cutoff = daysAgo(90);
    const { rowCount } = await client.query("DELETE FROM application_logs WHERE created_at < $1", [cutoff]);
    return { deleted: rowCount };
  },

  marketing_data: async (client) => {
    const cutoff = daysAgo(365 * 2);
    const { rowCount } = await client.query("DELETE FROM marketing_profiles WHERE collected_at < $1", [cutoff]);
    return { deleted: rowCount };
  },

  user_accounts: async (client) => {
    const cutoff = daysAgo(365 * 2);
    const { rowCount } = await client.query(
      `UPDATE users SET
         name='Anonymised User', email=CONCAT('anon_',id,'@deleted.invalid'),
         phone=NULL, address=NULL, anonymised_at=NOW()
       WHERE closed_at < $1 AND anonymised_at IS NULL`,
      [cutoff]
    );
    return { anonymised: rowCount };
  },

  support_tickets: async (client) => {
    const cutoff = daysAgo(365 * 3);
    const { rowCount } = await client.query(
      `UPDATE support_tickets SET
         requester_name='Anonymised', requester_email='anon@deleted.invalid',
         description='[Content removed per retention policy]', anonymised_at=NOW()
       WHERE closed_at < $1 AND anonymised_at IS NULL`,
      [cutoff]
    );
    return { anonymised: rowCount };
  },
};

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function runPurgeJob() {
  console.log(`[RETENTION-JOB] Starting at ${new Date().toISOString()}`);
  const client = await pool.connect();
  const results = {};

  try {
    for (const [category, handler] of Object.entries(PURGE_HANDLERS)) {
      try {
        const result = await handler(client);
        results[category] = { status: "ok", ...result };
        console.log(`[RETENTION-JOB] ${category}:`, result);
      } catch (err) {
        results[category] = { status: "error", message: err.message };
        console.error(`[RETENTION-JOB] ${category} failed:`, err.message);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`[RETENTION-JOB] Complete. Results:`, JSON.stringify(results, null, 2));
  return results;
}

runPurgeJob().catch((err) => { console.error(err); process.exit(1); });
