const express = require('express');
const router = express.Router();
const {
  validateSeedData,
  validateUpsertRecords,
  validateQuery
} = require('./middleware');
const {
  seedData,
  upsertRecords,
  getSeededRecords,
  getSeededVersion,
  resetSeeds
} = require('./controller');

// ============= SEEDING ENDPOINTS =============

// Seed data idempotently
router.post('/seed', validateSeedData, seedData);

// Upsert records (insert or update)
router.post('/upsert', validateUpsertRecords, upsertRecords);

// Get seeded records
router.get('/records', validateQuery, getSeededRecords);

// Get seed version and metadata
router.get('/version', getSeededVersion);

// Reset all seeds (admin)
router.post('/reset', resetSeeds);

module.exports = router;
