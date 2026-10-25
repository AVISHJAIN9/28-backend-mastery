const { faker } = require('@faker-js/faker');
const { EventEmitter } = require('events');

// Seeding events
const seedEmitter = new EventEmitter();

// In-memory storage for seed data
let seedLog = [];
let seedStatistics = {
  total_records_seeded: 0,
  total_seeders_run: 0,
  total_fixtures_loaded: 0,
  last_seed_time: null,
  environments: {
    development: { records: 0, seeders: 0 },
    staging: { records: 0, seeders: 0 },
    production: { records: 0, seeders: 0 }
  }
};

// Mock collections storage
const collections = {
  development: {
    users: [],
    posts: [],
    comments: [],
    tags: []
  },
  staging: {
    users: [],
    posts: [],
    comments: [],
    tags: []
  },
  production: {
    users: [],
    posts: [],
    comments: [],
    tags: []
  }
};

// Vulnerable endpoint: Hardcoded seed data
const seedVulnerable = (req, res) => {
  const hardcodedData = {
    users: [
      { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' }
    ],
    issue: 'Only 1 user, all hardcoded, can\'t customize'
  };
  
  res.json(hardcodedData);
};

// Secure endpoint: Generate seed data dynamically
const seedSecure = (req, res) => {
  try {
    const { environment, count, includeRelations, clean_before_seed, locale } = req.body;
    
    // Set faker locale
    faker.setLocale(locale || 'en_US');
    
    // Clean if requested
    if (clean_before_seed && collections[environment]) {
      Object.keys(collections[environment]).forEach(key => {
        collections[environment][key] = [];
      });
    }
    
    // Generate users
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push({
        id: i + 1,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        avatar: faker.image.avatar(),
        created_at: faker.date.past(),
        is_active: faker.datatype.boolean(0.8)
      });
    }
    
    // Generate posts if relations enabled
    const posts = [];
    if (includeRelations) {
      for (let i = 0; i < Math.floor(count * 0.5); i++) {
        posts.push({
          id: i + 1,
          user_id: faker.number.int({ min: 1, max: count }),
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraph(),
          published: faker.datatype.boolean(0.7),
          created_at: faker.date.past()
        });
      }
    }
    
    // Generate comments if relations enabled
    const comments = [];
    if (includeRelations && posts.length > 0) {
      for (let i = 0; i < Math.floor(count * 0.3); i++) {
        comments.push({
          id: i + 1,
          post_id: faker.number.int({ min: 1, max: posts.length }),
          user_id: faker.number.int({ min: 1, max: count }),
          content: faker.lorem.sentence(),
          created_at: faker.date.past()
        });
      }
    }
    
    // Store in memory
    collections[environment].users = users;
    collections[environment].posts = posts;
    collections[environment].comments = comments;
    
    // Update statistics
    const totalRecords = users.length + posts.length + comments.length;
    seedStatistics.total_records_seeded += totalRecords;
    seedStatistics.total_seeders_run++;
    seedStatistics.last_seed_time = new Date();
    seedStatistics.environments[environment].records += totalRecords;
    seedStatistics.environments[environment].seeders++;
    
    // Log seeding event
    seedLog.push({
      timestamp: new Date(),
      environment,
      count,
      total_records: totalRecords,
      status: 'success'
    });
    
    // Emit event
    seedEmitter.emit('seed-completed', {
      environment,
      count,
      total_records: totalRecords,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: 'Seed data generated successfully',
      data: {
        environment,
        users_generated: users.length,
        posts_generated: posts.length,
        comments_generated: comments.length,
        total_records: totalRecords,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Run specific seeder
const runSeeder = (req, res) => {
  try {
    const { seeder_name, count, batch_size } = req.body;
    const environment = req.query.env || 'development';
    
    const seederMap = {
      users: () => generateUsers(environment, count, batch_size),
      posts: () => generatePosts(environment, count, batch_size),
      comments: () => generateComments(environment, count, batch_size),
      tags: () => generateTags(environment, count, batch_size)
    };
    
    if (!seederMap[seeder_name]) {
      return res.status(404).json({
        error: `Seeder '${seeder_name}' not found`,
        available: Object.keys(seederMap)
      });
    }
    
    const result = seederMap[seeder_name]();
    
    res.json({
      success: true,
      seeder: seeder_name,
      environment,
      records_created: result.count,
      batches: result.batches,
      duration_ms: result.duration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Load fixture data
const loadFixture = (req, res) => {
  try {
    const { name, description, data, collection } = req.body;
    const environment = req.query.env || 'development';
    
    if (!collections[environment][collection]) {
      return res.status(404).json({
        error: `Collection '${collection}' not found`
      });
    }
    
    // Replace collection with fixture data
    collections[environment][collection] = data;
    
    // Update statistics
    seedStatistics.total_fixtures_loaded++;
    
    // Log fixture load
    seedLog.push({
      timestamp: new Date(),
      type: 'fixture',
      name,
      environment,
      records: data.length,
      status: 'success'
    });
    
    res.json({
      success: true,
      message: `Fixture '${name}' loaded successfully`,
      fixture: name,
      environment,
      records_loaded: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Validate seed data
const validateSeed = (req, res) => {
  try {
    const { seeder_name, sample_size } = req.body;
    const environment = req.query.env || 'development';
    
    if (!collections[environment][seeder_name]) {
      return res.status(404).json({
        error: `Collection '${seeder_name}' not found`
      });
    }
    
    const collection = collections[environment][seeder_name];
    const samples = collection.slice(0, Math.min(sample_size, collection.length));
    
    const validation = {
      total_records: collection.length,
      sample_size: samples.length,
      has_duplicates: false,
      has_nulls: 0,
      status: 'valid'
    };
    
    // Check for duplicates
    const ids = new Set();
    for (const record of collection) {
      if (ids.has(record.id)) {
        validation.has_duplicates = true;
        validation.status = 'invalid';
        break;
      }
      ids.add(record.id);
    }
    
    // Check for nulls
    for (const record of samples) {
      Object.values(record).forEach(val => {
        if (val === null || val === undefined) validation.has_nulls++;
      });
    }
    
    res.json({
      success: true,
      seeder: seeder_name,
      validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get seeding status
const getSeedStatus = (req, res) => {
  const { environment, limit, offset } = req.query;
  
  let filteredLogs = seedLog;
  if (environment) {
    filteredLogs = filteredLogs.filter(log => log.environment === environment);
  }
  
  const paginatedLogs = filteredLogs
    .reverse()
    .slice(offset, offset + limit);
  
  res.json({
    statistics: seedStatistics,
    recent_seeds: paginatedLogs,
    total_log_entries: filteredLogs.length
  });
};

// Run batch seeding
const batchSeed = (req, res) => {
  try {
    const { operations, parallel, dry_run } = req.body;
    const environment = req.query.env || 'development';
    
    let totalRecords = 0;
    const results = [];
    
    for (const op of operations) {
      const count = op.count;
      const batchSize = op.batch_size || 100;
      totalRecords += count;
      
      results.push({
        seeder: op.seeder,
        count: op.count,
        batch_size: batchSize,
        status: dry_run ? 'simulated' : 'completed'
      });
      
      if (!dry_run) {
        // Actually run seeder
        collections[environment][op.seeder] = generateMockData(count);
      }
    }
    
    res.json({
      success: true,
      environment,
      dry_run,
      operations_count: operations.length,
      total_records: totalRecords,
      results,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Clean all data from environment
const cleanEnvironment = (req, res) => {
  try {
    const environment = req.query.env || 'development';
    
    if (!collections[environment]) {
      return res.status(404).json({
        error: `Environment '${environment}' not found`
      });
    }
    
    const recordsDeleted = Object.values(collections[environment])
      .reduce((sum, arr) => sum + arr.length, 0);
    
    Object.keys(collections[environment]).forEach(key => {
      collections[environment][key] = [];
    });
    
    seedLog.push({
      timestamp: new Date(),
      type: 'cleanup',
      environment,
      records_deleted: recordsDeleted,
      status: 'success'
    });
    
    res.json({
      success: true,
      message: `Cleaned ${recordsDeleted} records from ${environment}`,
      records_deleted: recordsDeleted,
      environment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper functions
const generateUsers = (env, count, batchSize) => {
  const users = [];
  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    users.push({
      id: i + 1,
      name: faker.person.fullName(),
      email: faker.internet.email()
    });
  }
  
  collections[env].users = users;
  return {
    count: users.length,
    batches: Math.ceil(count / batchSize),
    duration: Date.now() - startTime
  };
};

const generatePosts = (env, count, batchSize) => {
  const posts = [];
  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    posts.push({
      id: i + 1,
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph()
    });
  }
  
  collections[env].posts = posts;
  return {
    count: posts.length,
    batches: Math.ceil(count / batchSize),
    duration: Date.now() - startTime
  };
};

const generateComments = (env, count, batchSize) => {
  const comments = [];
  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    comments.push({
      id: i + 1,
      content: faker.lorem.sentence()
    });
  }
  
  collections[env].comments = comments;
  return {
    count: comments.length,
    batches: Math.ceil(count / batchSize),
    duration: Date.now() - startTime
  };
};

const generateTags = (env, count, batchSize) => {
  const tags = [];
  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    tags.push({
      id: i + 1,
      name: faker.word.noun()
    });
  }
  
  collections[env].tags = tags;
  return {
    count: tags.length,
    batches: Math.ceil(count / batchSize),
    duration: Date.now() - startTime
  };
};

const generateMockData = (count) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({ id: i + 1, name: `Record ${i + 1}` });
  }
  return data;
};

module.exports = {
  seedVulnerable,
  seedSecure,
  runSeeder,
  loadFixture,
  validateSeed,
  getSeedStatus,
  batchSeed,
  cleanEnvironment,
  seedEmitter,
  collections,
  seedLog,
  seedStatistics
};
