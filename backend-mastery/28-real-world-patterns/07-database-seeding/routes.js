const express = require('express');
const router = express.Router();

const {
  validateSeedFile,
  validateRunSeed,
  validateRollback,
  validateHistory,
  validateMigrationStatus
} = require('./middleware');

const {
  listSeedsVulnerable,
  listSeedsSecure,
  registerSeedFile,
  runSeed,
  getSeedStatus,
  rollbackSeed,
  getSeedHistory,
  validateSeedIntegrity,
  getMigrationStatus
} = require('./controller');

// Vulnerable endpoint
router.get('/api/vulnerable/seeds', listSeedsVulnerable);

// Secure endpoints
router.get('/api/secure/seeds', listSeedsSecure);
router.post('/api/secure/seeds/register', validateSeedFile, registerSeedFile);
router.post('/api/secure/seeds/run', validateRunSeed, runSeed);
router.get('/api/secure/seeds/status', getSeedStatus);
router.post('/api/secure/seeds/rollback', validateRollback, rollbackSeed);
router.get('/api/secure/seeds/history', validateHistory, getSeedHistory);
router.get('/api/secure/seeds/validate', validateSeedIntegrity);
router.get('/api/secure/migrations/status', validateMigrationStatus, getMigrationStatus);

// Health check
router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'database-seeding' });
});

module.exports = router;
