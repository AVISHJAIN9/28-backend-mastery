/**
 * Field-Level Encryption for Sensitive PII
 * Uses AES-256-GCM via Node.js crypto module.
 */

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256-bit
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const key = process.env.PII_ENCRYPTION_KEY;
  if (!key || Buffer.from(key, "hex").length !== KEY_LENGTH) {
    throw new Error("PII_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext string.
 * Returns: base64-encoded string of IV + AuthTag + Ciphertext
 */
function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypt a previously encrypted string.
 */
function decrypt(encryptedBase64) {
  const key = getKey();
  const buf = Buffer.from(encryptedBase64, "base64");
  const iv = buf.slice(0, IV_LENGTH);
  const authTag = buf.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.slice(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/**
 * Encrypt specific fields in an object.
 * @param {object} obj - The source object
 * @param {string[]} fields - Field names to encrypt
 */
function encryptFields(obj, fields) {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] != null) {
      result[field] = encrypt(String(result[field]));
    }
  }
  return result;
}

/**
 * Decrypt specific fields in an object.
 */
function decryptFields(obj, fields) {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] != null) {
      result[field] = decrypt(result[field]);
    }
  }
  return result;
}

/**
 * Generate a new random encryption key (run once to generate key for .env).
 */
function generateKey() {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}

module.exports = { encrypt, decrypt, encryptFields, decryptFields, generateKey };
