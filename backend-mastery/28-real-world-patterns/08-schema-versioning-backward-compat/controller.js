// In-memory database with schema versioning
const database = {
  records: [],
  schema_version: 2
};

/**
 * Get record with schema conversion
 */
const getRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = database.records.find(r => r.id === parseInt(id));
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Convert old schema to current
    const converted = convertSchema(record, record.version, database.schema_version);
    
    res.json({
      data: converted,
      current_version: database.schema_version,
      record_version: record.version
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get record' });
  }
};

/**
 * Create record with current schema
 */
const createRecord = async (req, res) => {
  try {
    const { title, description, email } = req.body;

    const newRecord = {
      id: database.records.length + 1,
      title,
      description,
      email,
      version: database.schema_version,
      created_at: new Date().toISOString()
    };

    database.records.push(newRecord);

    res.status(201).json({
      message: 'Record created',
      data: newRecord,
      version: database.schema_version
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create record' });
  }
};

/**
 * Update record (dual-write for backward compat)
 */
const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, email } = req.body;

    const record = database.records.find(r => r.id === parseInt(id));
    if (!record) return res.status(404).json({ error: 'Not found' });

    // Write in both old and new schema
    Object.assign(record, { title, description, email, version: database.schema_version });

    res.json({
      message: 'Record updated',
      data: record,
      version: database.schema_version
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
};

/**
 * Convert schema between versions
 */
const convertSchema = (record, fromVersion, toVersion) => {
  if (fromVersion === toVersion) return record;
  
  if (fromVersion === 1 && toVersion === 2) {
    return {
      ...record,
      email: record.email || 'no-email@example.com',
      description: record.details || record.description || ''
    };
  }
  
  return record;
};

/**
 * Migrate schema
 */
const migrateSchema = async (req, res) => {
  try {
    const { target_version } = req.body;
    
    if (target_version === database.schema_version) {
      return res.json({ message: 'Already at target version' });
    }

    let migrated = 0;
    database.records.forEach(record => {
      const converted = convertSchema(record, record.version, target_version);
      Object.assign(record, converted, { version: target_version });
      migrated++;
    });

    database.schema_version = target_version;

    res.json({
      message: 'Schema migrated',
      migrated,
      new_version: database.schema_version
    });
  } catch (error) {
    res.status(500).json({ error: 'Migration failed' });
  }
};

module.exports = {
  getRecord,
  createRecord,
  updateRecord,
  migrateSchema
};

  normalized.__schemaVersion = targetVersion;
  return normalized;
};

// ============= CONTROLLER FUNCTIONS =============

/**
 * Get a record with automatic schema migration
 */
const getRecord = (req, res) => {
  try {
    const { id } = req.params;
    const { targetVersion = database.currentSchemaVersion } = req.query;

    const record = database.records[id];
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Migrate if necessary
    const recordVersion = record.__schemaVersion || 1;
    let response = record;

    if (parseInt(targetVersion) > recordVersion) {
      response = migrateRecord(record, recordVersion, parseInt(targetVersion));
      logger.info('Record migrated on retrieval', { id, fromVersion: recordVersion, toVersion: targetVersion });
    }

    res.json({
      success: true,
      data: normalizeRecord(response, parseInt(targetVersion))
    });
  } catch (err) {
    logger.error('Error getting record', { error: err.message });
    res.status(500).json({ error: 'Failed to get record' });
  }
};

/**
 * Create a record with current schema version
 */
const createRecord = (req, res) => {
  try {
    const body = req.body;
    const schemaVersion = body.__schema || database.currentSchemaVersion;

    const newRecord = {
      id: nextId++,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      avatar: body.avatar || null,
      __schemaVersion: schemaVersion,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    database.records[newRecord.id] = newRecord;
    logger.info('Record created', { id: newRecord.id, schemaVersion });

    res.status(201).json({
      success: true,
      data: normalizeRecord(newRecord, schemaVersion),
      message: ` Record created with schema v${schemaVersion}`
    });
  } catch (err) {
    logger.error('Error creating record', { error: err.message });
    res.status(500).json({ error: 'Failed to create record' });
  }
};

/**
 * Update a record, can accept both old and new schema fields
 */
const updateRecord = (req, res) => {
  try {
    const { id } = req.params;
    const record = database.records[id];

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const oldVersion = record.__schemaVersion || 1;

    // Update with provided fields (dual-write compatible)
    if (req.body.name) record.name = req.body.name;
    if (req.body.email) record.email = req.body.email;
    if ('phone' in req.body) record.phone = req.body.phone; // Allow null
    if ('avatar' in req.body) record.avatar = req.body.avatar; // Allow null

    record.updatedAt = new Date();

    logger.info('Record updated', { id, oldVersion });

    res.json({
      success: true,
      data: normalizeRecord(record, database.currentSchemaVersion),
      message: `Record updated, now at schema v${database.currentSchemaVersion}`
    });
  } catch (err) {
    logger.error('Error updating record', { error: err.message });
    res.status(500).json({ error: 'Failed to update record' });
  }
};

/**
 * Migrate all records to a new schema version
 */
const migrateSchema = (req, res) => {
  try {
    const { targetVersion } = req.body;

    if (!database.schemaVersions[targetVersion]) {
      return res.status(400).json({
        error: 'Invalid target schema version',
        availableVersions: Object.keys(database.schemaVersions).map(Number)
      });
    }

    if (targetVersion <= database.currentSchemaVersion) {
      return res.status(400).json({
        error: 'Can only migrate to higher schema versions',
        currentVersion: database.currentSchemaVersion
      });
    }

    let migratedCount = 0;
    Object.keys(database.records).forEach(key => {
      const record = database.records[key];
      const recordVersion = record.__schemaVersion || 1;

      if (recordVersion < targetVersion) {
        database.records[key] = migrateRecord(record, recordVersion, targetVersion);
        migratedCount++;
      }
    });

    // Update schema version
    const oldVersion = database.currentSchemaVersion;
    database.currentSchemaVersion = targetVersion;
    database.schemaVersions[targetVersion] = database.schemaVersions[targetVersion] || {
      fields: database.schemaVersions[oldVersion].fields,
      createdAt: new Date()
    };

    logger.warn('Schema migration completed', { from: oldVersion, to: targetVersion, recordsAffected: migratedCount });

    res.json({
      success: true,
      message: `Schema migrated from v${oldVersion} to v${targetVersion}`,
      recordsMigrated: migratedCount,
      newVersion: targetVersion
    });
  } catch (err) {
    logger.error('Error migrating schema', { error: err.message });
    res.status(500).json({ error: 'Failed to migrate schema' });
  }
};

/**
 * Get schema information
 */
const getSchemaInfo = (req, res) => {
  try {
    const allRecords = Object.values(database.records);
    const versionCounts = {};

    allRecords.forEach(record => {
      const version = record.__schemaVersion || 1;
      versionCounts[version] = (versionCounts[version] || 0) + 1;
    });

    res.json({
      success: true,
      currentSchemaVersion: database.currentSchemaVersion,
      schemaVersions: database.schemaVersions,
      recordsByVersion: versionCounts,
      totalRecords: allRecords.length
    });
  } catch (err) {
    logger.error('Error getting schema info', { error: err.message });
    res.status(500).json({ error: 'Failed to get schema info' });
  }
};

module.exports = {
  getRecord,
  createRecord,
  updateRecord,
  migrateSchema,
  getSchemaInfo
};
