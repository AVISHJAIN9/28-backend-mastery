const express = require('express');
const router = express.Router();
const {
  checkFlagVulnerable,
  checkFlagSecure,
  createFlag,
  updateFlag,
  getAllFlags,
  getFlag,
  deleteFlag,
  getAuditLog,
  clearAllData
} = require('./controller');
const {
  validateEvaluateFlag,
  validateCreateFlag,
  validateUpdateFlag,
  validateQuery,
  validateId,
  errorHandler
} = require('./middleware');

/**
 * Feature Flag Evaluation Endpoints
 */

// VULNERABLE: Check flag with hardcoded values
router.post('/api/vulnerable/flag-check', validateEvaluateFlag, checkFlagVulnerable);

// SECURE: Check flag with database-backed rules
router.post('/api/secure/flag-check', validateEvaluateFlag, checkFlagSecure);

/**
 * Feature Flag Management Endpoints
 */

// Create new flag
router.post('/api/secure/flags', validateCreateFlag, createFlag);

// Update flag
router.put('/api/secure/flags/:id', validateId, validateUpdateFlag, updateFlag);

// Get all flags
router.get('/api/secure/flags', validateQuery, getAllFlags);

// Get single flag
router.get('/api/secure/flags/:id', validateId, getFlag);

// Delete flag
router.delete('/api/secure/flags/:id', validateId, deleteFlag);

/**
 * Audit and Maintenance
 */

// Get audit log
router.get('/api/secure/audit-log', validateQuery, getAuditLog);

// Clear all data (testing only)
router.post('/api/test/clear', clearAllData);

// Error handler
router.use(errorHandler);

module.exports = router;
