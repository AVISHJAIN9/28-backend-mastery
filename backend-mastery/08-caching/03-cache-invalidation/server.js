import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from 'redis';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.HTTP_PORT || 6403;

// Redis client
const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redis.connect().catch(err => logger.error('Redis connection failed:', err));

// Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Simulated database
const mockDatabase = {
  1: { id: 1, name: 'Alice Johnson', email: 'alice@test.com', role: 'admin', salary: 95000, version: 1 },
  2: { id: 2, name: 'Bob Smith', email: 'bob@test.com', role: 'user', salary: 75000, version: 1 },
  3: { id: 3, name: 'Charlie Brown', email: 'charlie@test.com', role: 'user', salary: 70000, version: 1 },
  4: { id: 4, name: 'Diana Wilson', email: 'diana@test.com', role: 'manager', salary: 85000, version: 1 },
  5: { id: 5, name: 'Eve Davis', email: 'eve@test.com', role: 'user', salary: 72000, version: 1 }
};

// Track invalidations
const invalidationMetrics = {
  invalidations: 0,
  totalInvalidationTime: 0,
  lastInvalidatedAt: null,
  invalidationHistory: []
};

// Simulate database latency
const simulateDatabaseQuery = () => new Promise(resolve => setTimeout(resolve, 100));

// ============================================
// Endpoint 1: Cache-aside with manual invalidation
// ============================================
app.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  const cacheKey = `user:${userId}`;

  try {
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(`Cache HIT for user:${userId}`);
      return res.json(JSON.parse(cached));
    }

    logger.info(`Cache MISS for user:${userId}`);

    // Simulate database query
    await simulateDatabaseQuery();
    const user = mockDatabase[userId];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update cache
    await redis.setEx(cacheKey, 3600, JSON.stringify(user));

    res.json(user);
  } catch (error) {
    logger.error(`Error fetching user ${userId}:`, error);
    // Fallback to database
    res.json(mockDatabase[userId] || { error: 'User not found' });
  }
});

// ============================================
// Endpoint 2: Update user with manual invalidation
// ============================================
app.post('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  const { name, email, role, salary } = req.body;
  const cacheKey = `user:${userId}`;

  try {
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    // Update database
    const user = mockDatabase[userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = {
      ...user,
      name,
      email,
      role: role || user.role,
      salary: salary !== undefined ? salary : user.salary,
      version: user.version + 1
    };

    mockDatabase[userId] = updated;

    // Log invalidation
    invalidationMetrics.invalidations++;
    invalidationMetrics.lastInvalidatedAt = new Date();
    invalidationMetrics.invalidationHistory.push({
      key: cacheKey,
      timestamp: Date.now(),
      type: 'update'
    });

    // ==== INVALIDATION STEP: Delete old cache ====
    await redis.del(cacheKey);

    // Optionally: warm cache with updated data
    await redis.setEx(cacheKey, 3600, JSON.stringify(updated));

    logger.info(`User ${userId} updated and cache invalidated`);
    res.json({ success: true, user: updated });
  } catch (error) {
    logger.error(`Error updating user ${userId}:`, error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ============================================
// Endpoint 3: Manual cache invalidation (admin)
// ============================================
app.delete('/api/cache/:key', async (req, res) => {
  const key = req.params.key;

  try {
    const deleted = await redis.del(key);

    invalidationMetrics.invalidations++;
    invalidationMetrics.lastInvalidatedAt = new Date();
    invalidationMetrics.invalidationHistory.push({
      key,
      timestamp: Date.now(),
      type: 'manual'
    });

    logger.info(`Cache key '${key}' invalidated`);
    res.json({ success: true, keysDeleted: deleted });
  } catch (error) {
    logger.error(`Error deleting cache key ${key}:`, error);
    res.status(500).json({ error: 'Invalidation failed' });
  }
});

// ============================================
// Endpoint 4: Batch invalidation (pattern)
// ============================================
app.delete('/api/cache/pattern/:pattern', async (req, res) => {
  const pattern = req.params.pattern;

  try {
    let cursor = 0;
    let totalDeleted = 0;
    const keysToDelete = [];

    // SCAN through keys matching pattern
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern);
      cursor = parseInt(newCursor);
      keysToDelete.push(...keys);
    } while (cursor !== 0);

    // Delete all matching keys
    if (keysToDelete.length > 0) {
      for (const key of keysToDelete) {
        await redis.del(key);
      }
      totalDeleted = keysToDelete.length;
    }

    invalidationMetrics.invalidations += totalDeleted;
    invalidationMetrics.lastInvalidatedAt = new Date();

    logger.info(`Batch invalidated ${totalDeleted} keys matching pattern '${pattern}'`);
    res.json({ success: true, keysDeleted: totalDeleted, pattern });
  } catch (error) {
    logger.error(`Error batch invalidating pattern ${pattern}:`, error);
    res.status(500).json({ error: 'Batch invalidation failed' });
  }
});

// ============================================
// Endpoint 5: Cascade invalidation (related keys)
// ============================================
app.post('/api/user/:id/cascade-invalidate', async (req, res) => {
  const userId = req.params.id;

  try {
    const keysToDelete = [
      `user:${userId}`,
      `user:${userId}:profile`,
      `user:${userId}:permissions`,
      `user:${userId}:settings`,
      `user:${userId}:preferences`
    ];

    let deletedCount = 0;
    for (const key of keysToDelete) {
      const deleted = await redis.del(key);
      if (deleted) deletedCount++;
    }

    invalidationMetrics.invalidations += keysToDelete.length;
    invalidationMetrics.lastInvalidatedAt = new Date();

    logger.info(`Cascade invalidated ${deletedCount} keys for user ${userId}`);
    res.json({ success: true, keysInvalidated: keysToDelete, deletedCount });
  } catch (error) {
    logger.error(`Error cascade invalidating for user ${userId}:`, error);
    res.status(500).json({ error: 'Cascade invalidation failed' });
  }
});

// ============================================
// Endpoint 6: TTL-based invalidation
// ============================================
app.post('/api/user/:id/ttl-only', async (req, res) => {
  const userId = req.params.id;
  const { name, email } = req.body;
  const cacheKey = `user:${userId}`;

  try {
    // Update database
    const user = mockDatabase[userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = { ...user, name: name || user.name, email: email || user.email };
    mockDatabase[userId] = updated;

    // NO CACHE INVALIDATION - rely on TTL to expire old data
    // This demonstrates the problem: cache serves stale data for full TTL duration

    logger.info(`User ${userId} updated, cache relies on TTL (naive approach)`);
    res.json({
      success: true,
      user: updated,
      warning: 'Cache NOT invalidated - stale data will be served for 1 hour'
    });
  } catch (error) {
    logger.error(`Error in TTL-only update:`, error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ============================================
// Endpoint 7: Peek at cache
// ============================================
app.get('/api/cache/:key', async (req, res) => {
  const key = req.params.key;

  try {
    const value = await redis.get(key);
    const ttl = await redis.ttl(key);

    if (!value) {
      return res.json({ keyExists: false, key, ttl: -2 });
    }

    res.json({
      keyExists: true,
      key,
      value: JSON.parse(value),
      ttl: ttl > 0 ? ttl : 'no TTL',
      cachedAt: new Date(parseInt(JSON.parse(value)?.cached_at || 0))
    });
  } catch (error) {
    logger.error(`Error peeking at cache ${key}:`, error);
    res.status(500).json({ error: 'Peek failed' });
  }
});

// ============================================
// Endpoint 8: Direct database (bypass cache)
// ============================================
app.get('/api/database/user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    await simulateDatabaseQuery();
    const user = mockDatabase[userId];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user,
      source: 'database',
      note: 'Bypassed cache completely'
    });
  } catch (error) {
    logger.error(`Error fetching from database:`, error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// ============================================
// Endpoint 9: Invalidation metrics
// ============================================
app.get('/api/metrics', (req, res) => {
  res.json({
    invalidations: {
      total: invalidationMetrics.invalidations,
      lastAt: invalidationMetrics.lastInvalidatedAt,
      recentHistory: invalidationMetrics.invalidationHistory.slice(-10)
    },
    metrics: {
      invalidationStrategy: 'Event-based with TTL fallback',
      cacheDuration: '1 hour (3600 seconds)',
      databaseLatency: '100ms (simulated)'
    }
  });
});

// ============================================
// Endpoint 10: Reset metrics
// ============================================
app.post('/api/metrics/reset', (req, res) => {
  invalidationMetrics.invalidations = 0;
  invalidationMetrics.invalidationHistory = [];
  invalidationMetrics.lastInvalidatedAt = null;
  logger.info('Metrics reset');
  res.json({ success: true, message: 'All metrics reset' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cache-invalidation' });
});

// Start server
app.listen(port, () => {
  logger.info(`Cache Invalidation server running on port ${port}`);
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📊 Metrics available at http://localhost:${port}/api/metrics`);
});
