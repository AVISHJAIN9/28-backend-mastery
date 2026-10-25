/**
 * PII-aware DB schema helpers
 * Annotates which fields are PII and handles auto encrypt/decrypt.
 */

const { Pool } = require("pg");
const { encryptFields, decryptFields } = require("./encryption");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Fields to encrypt before storing
const ENCRYPTED_FIELDS = ["ssn", "aadhaar", "pan", "credit_card", "passport_number"];

// Migration SQL:
/*
CREATE TABLE IF NOT EXISTS users_pii (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  email TEXT,            -- stored encrypted
  phone TEXT,            -- stored encrypted
  name TEXT,             -- stored encrypted
  date_of_birth DATE,
  ssn TEXT,              -- stored encrypted
  aadhaar TEXT,          -- stored encrypted
  pan TEXT,              -- stored encrypted
  address JSONB,         -- stored encrypted as JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
*/

async function savePII(userId, piiData) {
  const encrypted = encryptFields(piiData, ENCRYPTED_FIELDS);
  await pool.query(
    `INSERT INTO users_pii (user_id, email, phone, name, date_of_birth, ssn, aadhaar, pan)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (user_id) DO UPDATE SET
       email=EXCLUDED.email, phone=EXCLUDED.phone, name=EXCLUDED.name,
       ssn=EXCLUDED.ssn, aadhaar=EXCLUDED.aadhaar, pan=EXCLUDED.pan,
       updated_at=NOW()`,
    [userId, encrypted.email, encrypted.phone, encrypted.name,
     piiData.date_of_birth, encrypted.ssn, encrypted.aadhaar, encrypted.pan]
  );
}

async function getPII(userId) {
  const { rows } = await pool.query("SELECT * FROM users_pii WHERE user_id=$1 LIMIT 1", [userId]);
  if (!rows[0]) return null;
  return decryptFields(rows[0], ENCRYPTED_FIELDS);
}

async function deletePII(userId) {
  await pool.query("DELETE FROM users_pii WHERE user_id=$1", [userId]);
}

module.exports = { savePII, getPII, deletePII };
