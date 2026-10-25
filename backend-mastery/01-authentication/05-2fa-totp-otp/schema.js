const Joi = require('joi');

/**
 * User Registration Schema
 * Validates: email, password (min 8 chars), name
 */
exports.registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  name: Joi.string().min(2).max(100).required()
}).unknown(false);

/**
 * Login Schema
 * Validates: email, password (plain text before hash check)
 */
exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
}).unknown(false);

/**
 * 2FA Setup Schema
 * No parameters required (uses authenticated user)
 */
exports.setupMFASchema = Joi.object({}).unknown(false);

/**
 * 2FA Verification Schema
 * Validates: TOTP token (6 digits), session token
 */
exports.verifyMFASchema = Joi.object({
  token: Joi.string().pattern(/^\d{6}$/).required(),
  sessionToken: Joi.string().uuid().required()
}).unknown(false);

/**
 * Backup Code Verification Schema
 * Validates: One of the backup codes (used as fallback to TOTP)
 */
exports.verifyBackupCodeSchema = Joi.object({
  code: Joi.string().length(8).pattern(/^[A-Z0-9-]+$/).required(),
  sessionToken: Joi.string().uuid().required()
}).unknown(false);

/**
 * 2FA Disable Schema
 * Validates: Password (for confirmation before disabling 2FA)
 */
exports.disableMFASchema = Joi.object({
  password: Joi.string().required()
}).unknown(false);

/**
 * Generate Backup Codes Schema
 * Validates: Current TOTP token (for security)
 */
exports.generateBackupCodesSchema = Joi.object({
  token: Joi.string().pattern(/^\d{6}$/).required()
}).unknown(false);

