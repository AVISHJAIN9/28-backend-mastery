const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const seedEmitter = new EventEmitter();

let seedHistory = [];
let currentVersion = '1.0.0';
let seedRegistry = {};

const seedMetadata = {
  environment: 'development',
  current_version: '1.0.0',
  total_seeds_applied: 0,
  last_seed_time: null,
  applied_seeds: []
};

// In-memory collections
const collections = {
  development: { users: [], posts: [], migrations: [] },
  staging: { users: [], posts: [], migrations: [] },
  production: { users: [], posts: [], migrations: [] }
};

// Vulnerable endpoint
const listSeedsVulnerable = (req, res) => {
  const hardcodedSeeds = {
    seeds: ['hardcoded_users.js'],
    info: 'Only supports one hardcoded seed file'
  };
  res.json(hardcodedSeeds);
};

// Secure endpoint: List available seeds
const listSeedsSecure = (req, res) => {
  const seedDir = path.join(__dirname, 'seeds');
  const seeds = fs.existsSync(seedDir)
    ? fs.readdirSync(seedDir).filter(f => f.endsWith('.js') || f.endsWith('.json'))
    : [];
  
  res.json({
    success: true,
    environment: req.query.env || 'development',
    available_seeds: seeds,
    total_seeds: seeds.length,
    seed_directory: seedDir
  });
};

// Upload/register seed file
const registerSeedFile = (req, res) => {
  try {
    const { name, version, environment, collections: collectionsData, force } = req.body;
    
    const seedKey = `${environment}:${version}`;
    if (seedRegistry[seedKey] && !force) {
      return res.status(409).json({
        error: 'Seed already applied',
        version,
        message: 'Use force: true to override'
      });
    }
    
    // Register seed
    seedRegistry[seedKey] = {
      name,
      version,
      environment,
      collections: collectionsData,
      registered_at: new Date(),
      status: 'registered'
    };
    
    res.json({
      success: true,
      message: 'Seed file registered',
      seed: {
        name,
        version,
        environment,
        collections: Object.keys(collectionsData)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Run seed
const runSeed = (req, res) => {
  try {
    const { seed_file, environment, dry_run } = req.body;
    
    const seedKey = `${environment}:${seed_file}`;
    const seed = seedRegistry[seedKey];
    
    if (!seed) {
      return res.status(404).json({
        error: `Seed '${seed_file}' not found in ${environment}`,
        available_seeds: Object.keys(seedRegistry).filter(k => k.startsWith(environment))
      });
    }
    
    // Apply seed (or simulate if dry_run)
    if (!dry_run) {
      Object.entries(seed.collections).forEach(([collection, data]) => {
        if (collections[environment][collection]) {
          collections[environment][collection] = [...collections[environment][collection], ...data];
        }
      });
      
      // Log to migration history
      collections[environment].migrations = collections[environment].migrations || [];
      collections[environment].migrations.push({
        version: seed.version,
        applied_at: new Date(),
        status: 'applied'
      });
      
      // Update metadata
      seedMetadata.current_version = seed.version;
      seedMetadata.total_seeds_applied++;
      seedMetadata.last_seed_time = new Date();
      seedMetadata.applied_seeds.push(seed.version);
      
      seedEmitter.emit('seed-applied', { seed: seed_file, environment });
    }
    
    res.json({
      success: true,
      message: `Seed '${seed_file}' ${dry_run ? 'simulated' : 'applied'}`,
      seed: {
        name: seed.name,
        version: seed.version,
        environment,
        collections: Object.keys(seed.collections),
        dry_run,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get seed status
const getSeedStatus = (req, res) => {
  const environment = req.query.env || 'development';
  
  res.json({
    success: true,
    metadata: seedMetadata,
    environment,
    registered_seeds: Object.keys(seedRegistry).filter(k => k.startsWith(environment)).length,
    migrations: collections[environment].migrations || [],
    current_collections: Object.keys(collections[environment]).filter(c => c !== 'migrations')
  });
};

// Rollback seed
const rollbackSeed = (req, res) => {
  try {
    const { version, environment } = req.body;
    
    const migrations = collections[environment].migrations || [];
    const versionExists = migrations.some(m => m.version === version);
    
    if (!versionExists) {
      return res.status(404).json({
        error: `Version '${version}' not found in migration history`,
        available_versions: migrations.map(m => m.version)
      });
    }
    
    // Simulate rollback
    migrations.splice(migrations.findIndex(m => m.version === version), 1);
    
    seedHistory.push({
      timestamp: new Date(),
      action: 'rollback',
      version,
      environment,
      status: 'success'
    });
    
    res.json({
      success: true,
      message: `Rolled back to version ${version}`,
      version,
      environment,
      remaining_migrations: migrations.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get seed history
const getSeedHistory = (req, res) => {
  const { environment, limit, offset } = req.query;
  
  let filtered = seedHistory;
  if (environment) {
    filtered = filtered.filter(h => h.environment === environment);
  }
  
  const paginated = filtered
    .reverse()
    .slice(offset, offset + limit);
  
  res.json({
    success: true,
    history: paginated,
    total: filtered.length,
    limit,
    offset
  });
};

// Validate seed integrity
const validateSeedIntegrity = (req, res) => {
  try {
    const environment = req.query.env || 'development';
    
    const collections_data = collections[environment];
    const stats = {};
    
    Object.entries(collections_data).forEach(([name, data]) => {
      stats[name] = {
        count: Array.isArray(data) ? data.length : 0,
        has_nulls: Array.isArray(data) && data.some(d => Object.values(d).some(v => !v)),
        status: 'valid'
      };
    });
    
    res.json({
      success: true,
      environment,
      integrity: stats,
      overall_status: Object.values(stats).every(s => s.status === 'valid') ? 'valid' : 'invalid'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get migration status
const getMigrationStatus = (req, res) => {
  const environment = req.query.env || 'development';
  const collection = req.query.collection;
  
  const migrations = collections[environment].migrations || [];
  
  const status = {
    environment,
    total_migrations: migrations.length,
    versions_applied: migrations.map(m => m.version),
    last_migration: migrations[migrations.length - 1],
    collections: collection
      ? { [collection]: collections[environment][collection]?.length || 0 }
      : Object.keys(collections[environment])
        .filter(c => c !== 'migrations')
        .reduce((acc, c) => ({ ...acc, [c]: collections[environment][c]?.length || 0 }), {})
  };
  
  res.json({ success: true, ...status });
};

module.exports = {
  listSeedsVulnerable,
  listSeedsSecure,
  registerSeedFile,
  runSeed,
  getSeedStatus,
  rollbackSeed,
  getSeedHistory,
  validateSeedIntegrity,
  getMigrationStatus,
  seedEmitter,
  collections,
  seedHistory,
  seedMetadata
};
