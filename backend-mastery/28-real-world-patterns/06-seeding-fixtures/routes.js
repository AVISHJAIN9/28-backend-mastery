const express = require('express');
const router = express.Router();

const {
  validateSeedConfig,
  validateRunSeeder,
  validateFixtureData,
  validateValidateSeed,
  validateSeedStatusQuery,
  validateBatchSeed
} = require('./middleware');

const {
  seedVulnerable,
  seedSecure,
  runSeeder,
  loadFixture,
  validateSeed,
  getSeedStatus,
  batchSeed,
  cleanEnvironment
} = require('./controller');

// Vulnerable endpoint: Hardcoded seed data
router.get('/api/vulnerable/seed', seedVulnerable);

// Secure endpoint: Generate seed data dynamically
router.post('/api/secure/seed', validateSeedConfig, seedSecure);

// Run specific seeder
router.post('/api/secure/seed/run', validateRunSeeder, runSeeder);

// Load fixture data
router.post('/api/secure/seed/fixture', validateFixtureData, loadFixture);

// Validate seed data
router.post('/api/secure/seed/validate', validateValidateSeed, validateSeed);

// Get seeding status
router.get('/api/secure/seed/status', validateSeedStatusQuery, getSeedStatus);

// Run batch seeding
router.post('/api/secure/seed/batch', validateBatchSeed, batchSeed);

// Clean environment
router.delete('/api/secure/seed/clean', cleanEnvironment);

// Health check
router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'seeding-fixtures' });
});

module.exports = router;
