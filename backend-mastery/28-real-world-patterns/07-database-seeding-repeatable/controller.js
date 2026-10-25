// In-memory database with seeding version
const database = {
  users: [],
  seed_version: 0,
  seeding_log: []
};

/**
 * Idempotent seeding - only insert if not exists
 */
const seedData = async (req, res) => {
  try {
    const { seed_id = 'v1', records = [] } = req.body || {};

    // Check if already seeded with this version
    if (database.seed_version >= parseInt(seed_id.replace('v', ''))) {
      return res.json({
        message: 'Already seeded with this version',
        seed_version: database.seed_version,
        skipped: true
      });
    }

    // Perform seeding
    let inserted = 0;
    records.forEach((record) => {
      if (!database.users.find(u => u.email === record.email)) {
        database.users.push({
          id: database.users.length + 1,
          ...record,
          created_at: new Date().toISOString()
        });
        inserted++;
      }
    });

    database.seed_version = parseInt(seed_id.replace('v', ''));
    database.seeding_log.push({
      seed_id,
      inserted,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Seeding completed',
      seed_version: database.seed_version,
      inserted,
      total_users: database.users.length,
      seeding_log: database.seeding_log
    });
  } catch (error) {
    res.status(500).json({ error: 'Seeding failed' });
  }
};

/**
 * Upsert records - insert or update
 */
const upsertRecords = async (req, res) => {
  try {
    const { records = [] } = req.body || {};

    let upserted = 0;
    records.forEach((record) => {
      const existing = database.users.find(u => u.email === record.email);
      if (existing) {
        Object.assign(existing, record, { updated_at: new Date().toISOString() });
      } else {
        database.users.push({
          id: database.users.length + 1,
          ...record,
          created_at: new Date().toISOString()
        });
      }
      upserted++;
    });

    res.json({
      message: 'Upsert completed',
      upserted,
      total_users: database.users.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Upsert failed' });
  }
};

/**
 * Get seeded records
 */
const getSeededRecords = async (req, res) => {
  try {
    res.json({
      users: database.users,
      total: database.users.length,
      seed_version: database.seed_version
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get records' });
  }
};

/**
 * Get seed version
 */
const getSeededVersion = async (req, res) => {
  try {
    res.json({
      seed_version: database.seed_version,
      last_seed: database.seeding_log[database.seeding_log.length - 1] || null,
      total_logs: database.seeding_log.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get version' });
  }
};

module.exports = {
  seedData,
  upsertRecords,
  getSeededRecords,
  getSeededVersion
};
  products: {},
  orders: {}
};

const seedMetadata = {
  seedVersion: 1,
  lastSeeded: null,
  seedHistory: [],
  seededIds: new Map() // Track what's been seeded (idempotency key -> inserted id)
};

let nextUserId = 1;
let nextProductId = 1;
let nextOrderId = 1;

// ============= SEED DATA =============

const defaultSeedData = {
  users: [
    { idempotencyKey: 'user-001', name: 'Alice Johnson', email: 'alice@test.com', role: 'admin', seedVersion: 1 },
    { idempotencyKey: 'user-002', name: 'Bob Smith', email: 'bob@test.com', role: 'user', seedVersion: 1 },
    { idempotencyKey: 'user-003', name: 'Carol White', email: 'carol@test.com', role: 'user', seedVersion: 1 }
  ],
  products: [
    { idempotencyKey: 'product-001', name: 'Laptop', price: 999.99, stock: 50, seedVersion: 1 },
    { idempotencyKey: 'product-002', name: 'Mouse', price: 29.99, stock: 200, seedVersion: 1 },
    { idempotencyKey: 'product-003', name: 'Keyboard', price: 79.99, stock: 150, seedVersion: 1 }
  ]
};

// ============= CONTROLLER FUNCTIONS =============

/**
 * Seed data idempotently - prevents duplicate insertions
 * Uses idempotency keys to ensure same seed data isn't inserted twice
 */
const seedData = (req, res) => {
  try {
    const { seedVersion = 1, force = false } = req.body;

    // Check if already seeded at this version
    if (seedMetadata.seedVersion >= seedVersion && !force) {
      logger.warn('Seed data already exists at this version', { version: seedVersion });
      return res.status(400).json({
        error: 'Seed data already exists at this version',
        message: 'Use force: true to re-seed',
        currentVersion: seedMetadata.seedVersion
      });
    }

    let insertedCount = 0;
    let skippedCount = 0;

    // Seed users idempotently
    defaultSeedData.users.forEach(userData => {
      if (seedMetadata.seededIds.has(userData.idempotencyKey) && !force) {
        skippedCount++;
        logger.debug('Skipping already seeded user', { key: userData.idempotencyKey });
        return;
      }

      const userId = nextUserId++;
      database.users[userId] = {
        id: userId,
        ...userData,
        createdAt: new Date(),
        seededAt: new Date()
      };
      seedMetadata.seededIds.set(userData.idempotencyKey, userId);
      insertedCount++;
    });

    // Seed products idempotently
    defaultSeedData.products.forEach(productData => {
      if (seedMetadata.seededIds.has(productData.idempotencyKey) && !force) {
        skippedCount++;
        logger.debug('Skipping already seeded product', { key: productData.idempotencyKey });
        return;
      }

      const productId = nextProductId++;
      database.products[productId] = {
        id: productId,
        ...productData,
        createdAt: new Date(),
        seededAt: new Date()
      };
      seedMetadata.seededIds.set(productData.idempotencyKey, productId);
      insertedCount++;
    });

    // Update seed metadata
    seedMetadata.seedVersion = seedVersion;
    seedMetadata.lastSeeded = new Date();
    seedMetadata.seedHistory.push({
      version: seedVersion,
      timestamp: new Date(),
      inserted: insertedCount,
      skipped: skippedCount
    });

    logger.info('Seed data completed', { inserted: insertedCount, skipped: skippedCount, version: seedVersion });

    res.json({
      success: true,
      message: 'Data seeded successfully',
      seedVersion,
      inserted: insertedCount,
      skipped: skippedCount,
      lastSeeded: seedMetadata.lastSeeded
    });
  } catch (err) {
    logger.error('Error seeding data', { error: err.message });
    res.status(500).json({ error: 'Failed to seed data' });
  }
};

/**
 * Upsert records - insert if not exists, update if exists
 * Idempotent operation that can be safely retried
 */
const upsertRecords = (req, res) => {
  try {
    const { records, type = 'users' } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records must be a non-empty array' });
    }

    const validTypes = ['users', 'products'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Type must be one of: ${validTypes.join(', ')}` });
    }

    let upsertedCount = 0;
    const results = [];

    records.forEach(record => {
      if (!record.idempotencyKey) {
        throw new Error('Each record must have an idempotencyKey');
      }

      let id;
      if (seedMetadata.seededIds.has(record.idempotencyKey)) {
        // Update existing
        id = seedMetadata.seededIds.get(record.idempotencyKey);
        database[type][id] = {
          ...database[type][id],
          ...record,
          updatedAt: new Date()
        };
        results.push({ action: 'updated', id, key: record.idempotencyKey });
      } else {
        // Insert new
        if (type === 'users') id = nextUserId++;
        else if (type === 'products') id = nextProductId++;

        database[type][id] = {
          id,
          ...record,
          createdAt: new Date(),
          seededAt: new Date()
        };
        seedMetadata.seededIds.set(record.idempotencyKey, id);
        results.push({ action: 'inserted', id, key: record.idempotencyKey });
      }
      upsertedCount++;
    });

    logger.info('Records upserted', { type, count: upsertedCount });

    res.json({
      success: true,
      message: `${upsertedCount} records upserted`,
      type,
      upserted: upsertedCount,
      results
    });
  } catch (err) {
    logger.error('Error upserting records', { error: err.message });
    res.status(500).json({ error: 'Failed to upsert records' });
  }
};

/**
 * Get all seeded records
 */
const getSeededRecords = (req, res) => {
  try {
    const { type = 'users' } = req.query;

    const validTypes = ['users', 'products', 'all'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Type must be one of: ${validTypes.join(', ')}` });
    }

    let records = [];
    if (type === 'all') {
      records = {
        users: Object.values(database.users),
        products: Object.values(database.products)
      };
    } else {
      records = Object.values(database[type]);
    }

    logger.info('Retrieved seeded records', { type });

    res.json({
      success: true,
      type,
      count: Array.isArray(records) ? records.length : Object.keys(records).length,
      data: records
    });
  } catch (err) {
    logger.error('Error retrieving seeded records', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve records' });
  }
};

/**
 * Get current seed version and metadata
 */
const getSeededVersion = (req, res) => {
  try {
    const seedInfo = {
      currentVersion: seedMetadata.seedVersion,
      lastSeeded: seedMetadata.lastSeeded,
      totalSeededItems: seedMetadata.seededIds.size,
      seedHistory: seedMetadata.seedHistory,
      stats: {
        users: Object.keys(database.users).length,
        products: Object.keys(database.products).length,
        orders: Object.keys(database.orders).length
      }
    };

    logger.info('Retrieved seed version info', { version: seedMetadata.seedVersion });

    res.json({
      success: true,
      seedInfo
    });
  } catch (err) {
    logger.error('Error retrieving seed version', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve seed version' });
  }
};

/**
 * Reset all seeds (admin operation)
 */
const resetSeeds = (req, res) => {
  try {
    const { confirm = false } = req.body;

    if (!confirm) {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Send { confirm: true } to proceed'
      });
    }

    // Clear everything
    Object.keys(database).forEach(key => {
      database[key] = {};
    });
    seedMetadata.seededIds.clear();
    seedMetadata.seedVersion = 0;
    seedMetadata.lastSeeded = null;
    seedMetadata.seedHistory = [];

    logger.warn('All seeds reset', { timestamp: new Date() });

    res.json({
      success: true,
      message: 'All seeds reset successfully',
      data: seedMetadata
    });
  } catch (err) {
    logger.error('Error resetting seeds', { error: err.message });
    res.status(500).json({ error: 'Failed to reset seeds' });
  }
};

module.exports = {
  seedData,
  upsertRecords,
  getSeededRecords,
  getSeededVersion,
  resetSeeds
};
