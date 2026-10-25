const { logger } = require('./middleware');
const { EventEmitter } = require('events');

const schemaEmitter = new EventEmitter();

// In-memory schema registry
const schemaRegistry = {};

// Collection schemas storage
const collectionSchemas = {
  users: {},
  posts: {},
  comments: {},
  tags: {}
};

// Migration history
const migrationHistory = {};

// Schema version adapters (converters)
const adapters = {};

// Vulnerable: Hardcoded schema
const getSchemaVulnerable = (req, res) => {
  res.json({
    users: {
      id: 'integer',
      name: 'string',
      email: 'string',
      password: 'string',  // VULNERABLE: exposed in API
      secret_key: 'string'  // VULNERABLE: sensitive data
    }
  });
};

// Secure: Get current schema for collection
const getSchemaSecure = (req, res) => {
  const { collection_name, version } = req.validated;
  
  if (!collectionSchemas[collection_name]) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  
  const schema = version 
    ? collectionSchemas[collection_name][version]
    : collectionSchemas[collection_name].current;
  
  if (!schema) {
    return res.status(404).json({ error: 'Schema version not found' });
  }
  
  return res.json({
    success: true,
    collection_name,
    version: schema.version || version,
    schema: schema.fields || schema,
    migration_type: schema.migration_type,
    created_at: schema.created_at
  });
};

// Create new schema version
const createSchemaVersion = (req, res) => {
  const {\n    version,\n    collection_name,\n    schema,\n    migration_type,\n    changes,\n    description,\n    zero_downtime\n  } = req.validated;
  
  // Check if collection exists
  if (!collectionSchemas[collection_name]) {
    collectionSchemas[collection_name] = {};
  }
  
  // Check for duplicate version
  if (collectionSchemas[collection_name][version]) {
    return res.status(409).json({ error: 'Schema version already exists' });
  }
  
  // Get previous version
  const previousVersion = Object.keys(collectionSchemas[collection_name])
    .filter(v => v !== 'current')
    .sort((a, b) => b.localeCompare(a))[0];
  
  // Create schema version entry
  const schemaVersion = {
    version,
    collection_name,
    fields: schema,
    migration_type,
    changes,
    description,
    zero_downtime,
    created_at: new Date(),
    previous_version: previousVersion,
    status: 'created',
    rollback_supported: migration_type !== 'breaking' || zero_downtime
  };
  
  // Store schema
  collectionSchemas[collection_name][version] = schemaVersion;
  collectionSchemas[collection_name].current = schemaVersion;
  
  // Register in schema registry
  const registryKey = `${collection_name}:${version}`;
  schemaRegistry[registryKey] = schemaVersion;
  
  // Log migration
  if (!migrationHistory[collection_name]) {
    migrationHistory[collection_name] = [];
  }
  migrationHistory[collection_name].push({
    timestamp: schemaVersion.created_at,
    version,
    migration_type,
    status: 'created',
    zero_downtime
  });
  
  logger.info('Schema version created', { version, collection_name, migration_type });
  schemaEmitter.emit('schema:created', { version, collection_name });
  
  return res.json({
    success: true,
    message: `Schema version ${version} created`,
    schema: schemaVersion
  });
};

// Align data to new schema
const alignData = (req, res) => {
  const { from_version, to_version, collection_name, batch_size, dry_run } = req.validated;
  
  if (!collectionSchemas[collection_name]) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  
  const toSchema = collectionSchemas[collection_name][to_version];
  if (!toSchema) {
    return res.status(404).json({ error: 'Target schema version not found' });
  }
  
  // In a real implementation, this would transform data
  // For now, we simulate batch processing
  const alignmentResult = {
    from_version,
    to_version,
    collection_name,
    batch_size,
    dry_run,
    total_records: Math.floor(Math.random() * 10000) + 1000,
    processed_batches: Math.ceil((Math.floor(Math.random() * 10000) + 1000) / batch_size),
    alignment_start: new Date(),
    status: dry_run ? 'simulated' : 'aligned'
  };
  
  if (!dry_run) {
    logger.info('Data alignment started', { collection_name, to_version });
    
    // Update migration history
    migrationHistory[collection_name].push({
      timestamp: new Date(),
      version: to_version,
      action: 'data_aligned',
      status: 'success'
    });
    
    schemaEmitter.emit('data:aligned', { collection_name, to_version });
  }
  
  return res.json({
    success: true,
    message: `Data ${dry_run ? 'would be' : null} aligned to schema ${to_version}`,
    alignment: alignmentResult
  });
};

// Rollback schema to previous version
const rollbackSchema = (req, res) => {
  const { collection_name, to_version, verify_before_rollback } = req.validated;
  
  if (!collectionSchemas[collection_name]) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  
  const targetSchema = collectionSchemas[collection_name][to_version];
  if (!targetSchema) {
    return res.status(404).json({ error: 'Target schema version not found' });
  }
  
  // Check if rollback is supported
  if (!targetSchema.rollback_supported) {
    return res.status(400).json({ error: 'Rollback not supported for this schema' });
  }
  
  // Set as current
  collectionSchemas[collection_name].current = targetSchema;
  
  logger.info('Schema rolled back', { collection_name, to_version });
  migrationHistory[collection_name].push({
    timestamp: new Date(),
    version: to_version,
    action: 'schema_rollback',
    status: 'success'
  });
  
  schemaEmitter.emit('schema:rollback', { collection_name, to_version });
  
  return res.json({
    success: true,
    message: `Rolled back to schema version ${to_version}`,
    current_version: to_version,
    collection_name
  });
};

// Check compatibility between schema versions
const checkCompatibility = (req, res) => {
  const { from_version, to_version, collection_name } = req.validated;
  
  if (!collectionSchemas[collection_name]) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  
  const fromSchema = collectionSchemas[collection_name][from_version];
  const toSchema = collectionSchemas[collection_name][to_version];
  
  if (!fromSchema) {
    return res.status(404).json({ error: 'Source schema version not found' });
  }
  if (!toSchema) {
    return res.status(404).json({ error: 'Target schema version not found' });
  }
  
  // Determine compatibility
  const fromMigrationType = fromSchema.migration_type;
  const toMigrationType = toSchema.migration_type;
  
  const isCompatible = ![
    fromMigrationType === 'breaking',
    toMigrationType === 'breaking'
  ].includes(true);
  
  return res.json({
    success: true,
    compatible: isCompatible,
    from_version,
    to_version,
    from_migration_type: fromMigrationType,
    to_migration_type: toMigrationType,
    message: isCompatible 
      ? 'Schemas are compatible' 
      : 'Breaking changes detected: data alignment required'
  });
};

// Get migration history
const getMigrationHistory = (req, res) => {
  const { collection_name, limit } = req.validated;
  
  if (!migrationHistory[collection_name]) {
    return res.status(404).json({ error: 'No migration history found' });
  }
  
  const history = migrationHistory[collection_name]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
  
  return res.json({
    success: true,
    collection_name,
    total_migrations: migrationHistory[collection_name].length,
    history
  });
};

module.exports = {
  getSchemaVulnerable,
  getSchemaSecure,
  createSchemaVersion,
  alignData,
  rollbackSchema,
  checkCompatibility,
  getMigrationHistory,
  schemaEmitter
};