const { faker } = require('@faker-js/faker');

// Mock database
const database = {
  users: [],
  posts: [],
  comments: [],
  seeding_history: []
};

// Fixture templates
const fixtures = {
  users: [
    { name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', status: 'active' },
    { name: 'Bob Smith', email: 'bob@example.com', role: 'user', status: 'active' },
    { name: 'Charlie Brown', email: 'charlie@example.com', role: 'user', status: 'inactive' }
  ],
  posts: [
    { title: 'Getting Started with Node.js', content: 'Node.js is a runtime...', status: 'published' },
    { title: 'Express.js Best Practices', content: 'When building APIs...', status: 'published' },
    { title: 'Database Design Patterns', content: 'Database patterns are...', status: 'draft' }
  ],
  comments: [
    { text: 'Great article!', status: 'approved' },
    { text: 'Thanks for sharing', status: 'approved' },
    { text: 'This is spam', status: 'rejected' }
  ]
};

// Seed statistics
let seedStats = {
  total_fixtures_loaded: 0,
  total_random_records_generated: 0,
  total_seeding_operations: 0,
  environment: process.env.NODE_ENV || 'development',
  last_seed_time: null
};

// ==================== Seeding Functions ====================

/**
 * Load fixtures into database
 */
const loadFixtures = async (req, res) => {
  try {
    const { collection = 'all', count = 3 } = req.body || {};

    database.users = [];
    database.posts = [];
    database.comments = [];

    if (collection === 'all' || collection === 'users') {
      database.users = fixtures.users.map((user, i) => ({
        id: i + 1,
        ...user,
        created_at: new Date().toISOString()
      }));
      seedStats.total_fixtures_loaded += database.users.length;
    }

    if (collection === 'all' || collection === 'posts') {
      database.posts = fixtures.posts.map((post, i) => ({
        id: i + 1,
        user_id: Math.ceil(Math.random() * 3),
        ...post,
        created_at: new Date().toISOString()
      }));
      seedStats.total_fixtures_loaded += database.posts.length;
    }

    if (collection === 'all' || collection === 'comments') {
      database.comments = fixtures.comments.map((comment, i) => ({
        id: i + 1,
        post_id: Math.ceil(Math.random() * 3),
        user_id: Math.ceil(Math.random() * 3),
        ...comment,
        created_at: new Date().toISOString()
      }));
      seedStats.total_fixtures_loaded += database.comments.length;
    }

    seedStats.last_seed_time = new Date().toISOString();
    seedStats.total_seeding_operations++;

    database.seeding_history.push({
      operation: 'load_fixtures',
      collection,
      count: seedStats.total_fixtures_loaded,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Fixtures loaded successfully',
      data: {
        users: database.users.length,
        posts: database.posts.length,
        comments: database.comments.length
      },
      stats: seedStats
    });
  } catch (error) {
    console.error('Load fixtures error:', error);
    res.status(500).json({ error: 'Failed to load fixtures' });
  }
};

/**
 * Generate random data
 */
const generateRandomData = async (req, res) => {
  try {
    const { collection = 'users', count = 10 } = req.body || {};

    const generated = [];

    if (collection === 'users' || collection === 'all') {
      for (let i = 0; i < count; i++) {
        generated.push({
          id: database.users.length + i + 1,
          name: faker.person.fullName(),
          email: faker.internet.email(),
          role: Math.random() > 0.8 ? 'admin' : 'user',
          status: Math.random() > 0.2 ? 'active' : 'inactive',
          created_at: new Date().toISOString()
        });
      }
      if (collection === 'users' || collection === 'all') {
        database.users.push(...generated);
      }
    }

    if (collection === 'posts' || collection === 'all') {
      const postsGenerated = [];
      for (let i = 0; i < count; i++) {
        postsGenerated.push({
          id: database.posts.length + i + 1,
          user_id: Math.ceil(Math.random() * database.users.length) || 1,
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(2),
          status: Math.random() > 0.5 ? 'published' : 'draft',
          created_at: new Date().toISOString()
        });
      }
      database.posts.push(...postsGenerated);
    }

    seedStats.total_random_records_generated += count;
    seedStats.last_seed_time = new Date().toISOString();
    seedStats.total_seeding_operations++;

    database.seeding_history.push({
      operation: 'generate_random',
      collection,
      count,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Random data generated successfully',
      data: generated,
      total_generated: count,
      stats: seedStats
    });
  } catch (error) {
    console.error('Generate random error:', error);
    res.status(500).json({ error: 'Failed to generate random data' });
  }
};

/**
 * Get current database state
 */
const getDatabaseState = async (req, res) => {
  try {
    const { collection = 'all' } = req.query;

    let data = {};
    if (collection === 'all' || collection === 'users') {
      data.users = database.users;
    }
    if (collection === 'all' || collection === 'posts') {
      data.posts = database.posts;
    }
    if (collection === 'all' || collection === 'comments') {
      data.comments = database.comments;
    }

    res.json({
      data,
      stats: seedStats
    });
  } catch (error) {
    console.error('Get database state error:', error);
    res.status(500).json({ error: 'Failed to get database state' });
  }
};

/**
 * Reset database
 */
const resetDatabase = async (req, res) => {
  try {
    database.users = [];
    database.posts = [];
    database.comments = [];
    database.seeding_history = [];

    seedStats = {
      total_fixtures_loaded: 0,
      total_random_records_generated: 0,
      total_seeding_operations: 0,
      environment: process.env.NODE_ENV || 'development',
      last_seed_time: null
    };

    res.json({
      message: 'Database reset successfully',
      stats: seedStats
    });
  } catch (error) {
    console.error('Reset database error:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
};

/**
 * Get seeding history and statistics
 */
const getStats = async (req, res) => {
  try {
    res.json({
      stats: seedStats,
      history: database.seeding_history,
      current_state: {
        users: database.users.length,
        posts: database.posts.length,
        comments: database.comments.length
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

module.exports = {
  loadFixtures,
  generateRandomData,
  getDatabaseState,
  resetDatabase,
  getStats
};
