/**
 * Data Anonymisation Utilities
 * Techniques: suppression, generalisation, noise addition, k-anonymity helpers.
 */

const crypto = require("crypto");

// ─── Suppression ─────────────────────────────────────────────────────────────

/** Remove a field entirely */
const suppress = (obj, ...fields) => {
  const result = { ...obj };
  fields.forEach((f) => delete result[f]);
  return result;
};

// ─── Generalisation ──────────────────────────────────────────────────────────

/** Generalise age to bracket: 25 → "20-29" */
function generaliseAge(age, bucketSize = 10) {
  const lower = Math.floor(age / bucketSize) * bucketSize;
  return `${lower}-${lower + bucketSize - 1}`;
}

/** Generalise postcode to first N characters: "560001" → "560" */
function generalisePostcode(postcode, chars = 3) {
  return String(postcode).slice(0, chars) + "***";
}

/** Generalise date to year only: "1990-05-15" → "1990" */
function generaliseDate(dateStr) {
  return new Date(dateStr).getFullYear().toString();
}

/** Round a numeric value to reduce precision */
function generaliseNumeric(value, precision = 100) {
  return Math.round(Number(value) / precision) * precision;
}

// ─── Noise Addition ──────────────────────────────────────────────────────────

/** Add random noise to a numeric value (±noiseRange%) */
function addNoise(value, noisePercent = 10) {
  const noise = (Math.random() * 2 - 1) * (noisePercent / 100) * Number(value);
  return Math.round(Number(value) + noise);
}

// ─── One-Way Hashing ─────────────────────────────────────────────────────────

/** Hash a value with HMAC-SHA256 (irreversible) */
function hashField(value, salt = process.env.ANONYMISATION_SALT || "default-salt") {
  return crypto.createHmac("sha256", salt).update(String(value)).digest("hex");
}

// ─── Full Record Anonymisation ───────────────────────────────────────────────

/**
 * Anonymise a user record for analytics/research use.
 * Removes direct identifiers, generalises quasi-identifiers.
 */
function anonymiseUserRecord(user) {
  return {
    // Suppress direct identifiers
    id: hashField(user.id),         // one-way hash instead of real ID
    // Generalise quasi-identifiers
    ageGroup: user.dateOfBirth ? generaliseAge(new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()) : null,
    postcodeArea: user.postcode ? generalisePostcode(user.postcode) : null,
    // Retain non-identifying attributes
    gender: user.gender || null,
    country: user.country || null,
    accountCreatedYear: user.createdAt ? generaliseDate(user.createdAt) : null,
    // Suppress all PII
    // name, email, phone, address, ssn, aadhaar, pan — all removed
  };
}

/**
 * Anonymise an array of records for dataset export.
 */
function anonymiseDataset(records, anonymiseFn = anonymiseUserRecord) {
  return records.map(anonymiseFn);
}

module.exports = {
  suppress, generaliseAge, generalisePostcode, generaliseDate,
  generaliseNumeric, addNoise, hashField,
  anonymiseUserRecord, anonymiseDataset,
};
