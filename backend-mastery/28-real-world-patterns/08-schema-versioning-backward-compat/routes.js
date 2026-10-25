const express = require('express');
const router = express.Router();
const {
  validateCreateRecord,
  validateUpdateRecord,
  validateMigrateSchema,
  validateId,
  validateQuery
} = require('./middleware');
const {
  getRecord,
  createRecord,
  updateRecord,
  migrateSchema,
  getSchemaInfo
} = require('./controller');

// ============= RECORD ENDPOINTS =============

// Get a record (with automatic migration)
router.get('/records/:id', validateId, validateQuery, getRecord);

// Create a record
router.post('/records', validateCreateRecord, createRecord);

// Update a record
router.patch('/records/:id', validateId, validateUpdateRecord, updateRecord);

// ============= SCHEMA ENDPOINTS =============

// Get schema information
router.get('/schema', getSchemaInfo);

// Migrate to new schema version
router.post('/schema/migrate', validateMigrateSchema, migrateSchema);

module.exports = router;
