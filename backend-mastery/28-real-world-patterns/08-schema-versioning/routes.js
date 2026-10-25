const express = require('express');
const router = express.Router();

const {
  getSchemaVulnerable,
  getSchemaSecure,
  createSchemaVersion,
  alignData,
  rollbackSchema,
  checkCompatibility,
  getMigrationHistory
} = require('./controller');

const {
  validateCreateSchemaVersion,
  validateAlignData,
  validateRollbackSchema,
  validateGetSchema,
  validateCheckCompatibility,
  validateMigrationHistory
} = require('./middleware');

// Vulnerable endpoint (educational)
router.get('/api/vulnerable/schema', getSchemaVulnerable);

// Secure endpoints
router.get('/api/secure/schema', validateGetSchema, getSchemaSecure);

router.post('/api/secure/schema/create',
  validateCreateSchemaVersion,
  createSchemaVersion
);

router.post('/api/secure/schema/align-data',
  validateAlignData,
  alignData
);

router.post('/api/secure/schema/rollback',
  validateRollbackSchema,
  rollbackSchema
);

router.get('/api/secure/schema/check-compatibility',
  validateCheckCompatibility,
  checkCompatibility
);

router.get('/api/secure/schema/migration-history',
  validateMigrationHistory,
  getMigrationHistory
);

router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'schema-versioning' });
});

module.exports = router;