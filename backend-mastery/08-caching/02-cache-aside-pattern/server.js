import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import dotenv from 'dotenv';
import redis from 'redis';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 6402;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(helmet());
app.use(express.json());

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Redis client
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
(async () => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (err) {
    logger.error('Redis connection failed', { error: err.message });
  }
})();

// Mock database of users
const mockDatabase = {
  1: { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin', createdAt: '2024-01-01' },
  2: { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user', createdAt: '2024-01-02' },
  3: { id: 3, name: 'Charlie', email: 'charlie@test.com', role: 'user', createdAt: '2024-01-03' },
  4: { id: 4, name: 'Diana', email: 'diana@test.com', role: 'moderator', createdAt: '2024-01-04' },
  5: { id: 5, name: 'Eve', email: 'eve@test.com', role: 'user', createdAt: '2024-01-05' }
};

// Simulated database lookup time (100ms latency)
const simulateDatabaseQuery = async () => {
  return new Promise(resolve => setTimeout(resolve, 100));
};

// Metrics tracking
const metrics = {
  cacheHits: 0,
  cacheMisses: 0,
  databaseQueries: 0,
  cacheErrors: 0,
  totalRequests: 0
};

// ==================== API Endpoints ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/user/:id - Cache-Aside Pattern (Basic)
app.get('/api/user/:id', async (req, res) => {
  const startTime = Date.now();
  metrics.totalRequests++;

  try {
    const userId = parseInt(req.params.id);
    const cacheKey = `user:${userId}`;

    // 1. Check cache
    let source = 'database';
    let user = null;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        user = JSON.parse(cached);
        source = 'cache';
        metrics.cacheHits++;
      } else {
        metrics.cacheMisses++;
      }
    } catch (cacheError) {
      logger.warn('Cache read error', { error: cacheError.message });
      metrics.cacheErrors++;
    }

    // 2. On miss, fetch from database
    if (!user) {
      await simulateDatabaseQuery();
      user = mockDatabase[userId] || null;
      metrics.databaseQueries++;

      // 3. Update cache with TTL
      if (user) {
        try {
          await redisClient.setEx(cacheKey, 3600, JSON.stringify(user));
        } catch (cacheError) {
          logger.warn('Cache write error', { error: cacheError.message });
        }
      }
    }

    const latency = Date.now() - startTime;

    res.json({
      user,
      source,
      latency: `${latency}ms`,
      found: !!user,
      cacheKey
    });
  } catch (error) {
    logger.error('User lookup error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/user/:id/with-stampede - Demonstrate stampede handling
app.get('/api/user/:id/with-stampede', async (req, res) => {
  const startTime = Date.now();

  try {
    const userId = parseInt(req.params.id);
    const cacheKey = `user:${userId}`;
    const lockKey = `lock:${cacheKey}`;

    // 1. Check cache
    let cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        user: JSON.parse(cached),
        source: 'cache',
        latency: `${Date.now() - startTime}ms`,
        method: 'stampede-prevention'
      });
    }

    // 2. Try to acquire lock (prevent stampede)
    const lockAcquired = await redisClient.set(lockKey, '1', {
      EX: 5,
      NX: true
    });

    if (lockAcquired) {
      // We have the lock - fetch from database
      await simulateDatabaseQuery();
      const user = mockDatabase[userId];

      if (user) {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(user));
      }

      res.json({
        user,
        source: 'database-with-lock',
        latency: `${Date.now() - startTime}ms`,
        lockAcquired: true
      });
    } else {
      // Another request is fetching - wait briefly
      await new Promise(r => setTimeout(r, 50));

      cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({
          user: JSON.parse(cached),
          source: 'cache-after-wait',
          latency: `${Date.now() - startTime}ms`,
          lockWaited: true
        });
      }

      // Timeout - fall back to database directly
      const user = mockDatabase[userId];
      res.json({
        user,
        source: 'database-timeout',
        latency: `${Date.now() - startTime}ms`,
        fallback: true
      });
    }
  } catch (error) {
    logger.error('Stampede handler error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/user/:id - Update user (with invalidation)
app.post('/api/user/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const cacheKey = `user:${userId}`;

    if (!mockDatabase[userId]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update database
    const updatedUser = { ...mockDatabase[userId], ...req.body };
    mockDatabase[userId] = updatedUser;

    // Invalidate cache (critical!)
    await redisClient.del(cacheKey);

    res.json({
      success: true,
      user: updatedUser,
      cacheInvalidated: true
    });
  } catch (error) {
    logger.error('User update error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// DELETE /api/cache/:key - Manual cache eviction
app.delete('/api/cache/:key', async (req, res) => {
  try {
    const cacheKey = req.params.key;
    const deleted = await redisClient.del(cacheKey);

    res.json({
      success: true,
      key: cacheKey,
      deleted: deleted === 1
    });
  } catch (error) {
    logger.error('Cache deletion error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/cache/:key - Peek at cache
app.get('/api/cache/:key', async (req, res) => {
  try {
    const cacheKey = req.params.key;
    const value = await redisClient.get(cacheKey);
    const ttl = await redisClient.ttl(cacheKey);

    res.json({
      key: cacheKey,
      value: value ? JSON.parse(value) : null,
      ttl: ttl === -1 ? 'never' : ttl === -2 ? 'not-exists' : ttl,
      exists: value !== null
    });
  } catch (error) {
    logger.error('Cache peek error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/database/user/:id - Direct database fetch (bypass cache)
app.get('/api/database/user/:id', async (req, res) => {
  const startTime = Date.now();

  try {
    const userId = parseInt(req.params.id);

    // Simulate database latency
    await simulateDatabaseQuery();

    const user = mockDatabase[userId] || null;
    metrics.databaseQueries++;

    res.json({
      user,
      source: 'database-direct',
      latency: `${Date.now() - startTime}ms`,
      simulated: true
    });
  } catch (error) {
    logger.error('Database query error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/metrics - Cache performance metrics
app.get('/api/metrics', (req, res) => {
  const totalRequests = metrics.cacheHits + metrics.cacheMisses;
  const hitRatio = totalRequests === 0 ? 0 : (metrics.cacheHits / totalRequests * 100).toFixed(2);

  res.json({
    metrics: {
      cacheHits: metrics.cacheHits,
      cacheMisses: metrics.cacheMisses,
      totalRequests,
      hitRatio: `${hitRatio}%`,
      databaseQueries: metrics.databaseQueries,
      cacheErrors: metrics.cacheErrors
    },
    avgDatabaseLatency: '~100ms (simulated)',
    hitRatioTarget: '>80%'
  });
});

// POST /api/metrics/reset - Reset metrics
app.post('/api/metrics/reset', (req, res) => {
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.databaseQueries = 0;
  metrics.cacheErrors = 0;
  metrics.totalRequests = 0;

  res.json({ success: true, message: 'Metrics reset' });
});

// GET /api/demo/simulate-stampede - Simulate stampede scenario
app.get('/api/demo/simulate-stampede', async (req, res) => {
  try {
    const userId = 99;
    const cacheKey = `stampede:test:${userId}`;

    // Clear any existing cache
    await redisClient.del(cacheKey);

    res.json({
      message: 'Stampede test setup',
      cacheKey,
      instruction: 'Make 5+ simultaneous requests to /api/user/99/with-stampede',
      expectedBehavior: 'Only first request hits database, others wait for cache'
    });
  } catch (error) {
    logger.error('Stampede demo error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Start server
app.listen(HTTP_PORT, () => {
  logger.info(`Cache-Aside API running on http://localhost:${HTTP_PORT}`);
  logger.info(`Test: curl http://localhost:${HTTP_PORT}/api/health`);
  logger.info(`User: curl http://localhost:${HTTP_PORT}/api/user/1`);
});
