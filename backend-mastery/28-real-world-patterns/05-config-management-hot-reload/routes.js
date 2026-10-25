const express = require('express');
const router = express.Router();
const {
  getConfigVulnerable,
  getConfigSecure,
  updateConfig,
  validateConfig,
  getConfigHistory,
  getEnvironmentConfig,
  listEnvironments,
  subscribeToConfigChanges,
  getConfigDiff,
  clearConfigHistory
} = require('./controller');
const {
  validateGetConfig,
  validateUpdateConfig,
  validateConfigValidation,
  validateQuery,
  validateId,
  errorHandler
} = require('./middleware');

/**
 * Configuration Retrieval Endpoints
 */

// VULNERABLE: Get hardcoded config
router.get('/api/vulnerable/config', getConfigVulnerable);

// SECURE: Get dynamic config with hot-reload
router.get('/api/secure/config', validateGetConfig, getConfigSecure);

/**
 * Configuration Management Endpoints
 */

// Update configuration (hot-reload)
router.put('/api/secure/config', validateUpdateConfig, updateConfig);

// Validate config value
router.post('/api/secure/config/validate', validateConfigValidation, validateConfig);

/**
 * Configuration History & Comparison
 */

// Get config history with changes
router.get('/api/secure/config/history', validateQuery, getConfigHistory);

// Get diff between environments
router.get('/api/secure/config/diff', getConfigDiff);

// Get specific environment config
router.get('/api/secure/environments/:id', validateId, getEnvironmentConfig);

// List all environments
router.get('/api/secure/environments', listEnvironments);

/**
 * Real-Time Updates (Server-Sent Events)
 */

// Subscribe to config changes
router.get('/api/secure/config/subscribe', subscribeToConfigChanges);

/**
 * Maintenance
 */

// Clear config history
router.post('/api/test/clear-history', clearConfigHistory);

// Error handler
router.use(errorHandler);

module.exports = router;
