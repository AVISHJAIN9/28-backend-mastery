const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validateSeedRequest } = require('./middleware');

// ==================== Seed Operations ====================

/**
 * POST /api/seed/fixtures
 * Load predefined fixtures into database
 */
router.post('/seed/fixtures', validateSeedRequest, controller.loadFixtures);

/**
 * POST /api/seed/generate
 * Generate random data
 */
router.post('/seed/generate', validateSeedRequest, controller.generateRandomData);

/**
 * GET /api/database/state
 * Get current database state
 */
router.get('/database/state', controller.getDatabaseState);

/**
 * POST /api/database/reset
 * Reset the entire database
 */
router.post('/database/reset', controller.resetDatabase);

/**
 * GET /api/seed/stats
 * Get seeding statistics and history
 */
router.get('/seed/stats', controller.getStats);

module.exports = router;
