import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from 'redis';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.HTTP_PORT || 6404;

// Keep track of all active subscribers
const subscribers = new Map();
const instanceId = `server-${Math.random().toString(36).slice(2, 8)}`;

// Redis clients
const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redis.connect().catch(err => logger.error('Redis connection failed:', err));

// Subscriber for listening to Pub/Sub events
const subscriber = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

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

// Mock database
const mockDatabase = {
  1: { id: 1, name: 'Alice Johnson', email: 'alice@test.com', role: 'admin', status: 'active', version: 1 },
  2: { id: 2, name: 'Bob Smith', email: 'bob@test.com', role: 'user', status: 'active', version: 1 },
  3: { id: 3, name: 'Charlie Brown', email: 'charlie@test.com', role: 'user', status: 'inactive', version: 1 },
  4: { id: 4, name: 'Diana Wilson', email: 'diana@test.com', role: 'manager', status: 'active', version: 1 },
  5: { id: 5, name: 'Eve Davis', email: 'eve@test.com', role: 'user', status: 'active', version: 1 }
};

// Local cache on this instance
const localCache = new Map();

// Track metrics
const metrics = {
  published: 0,
  received: 0,
  invalidations: 0,
  messageLog: []
};

// Simulate database latency
const simulateDatabaseQuery = () => new Promise(resolve => setTimeout(resolve, 100));

// ============================================
// Setup Pub/Sub Subscriber
// ============================================
subscriber.connect().then(() => {
  subscriber.subscribe('cache:invalidation', 'cache:cascade', 'cache:batch', 'health:heartbeat');
  
  subscriber.on('message', (channel, message) => {
    try {
      const event = JSON.parse(message);
      
      metrics.received++;
      metrics.messageLog.push({
        channel,
        event: event.type || event.action,
        timestamp: Date.now(),
        keys: event.keys?.length || 1
      });
      
      if (channel === 'cache:invalidation') {
        // Single key invalidation
        const { key, type } = event;
        localCache.delete(key);
        metrics.invalidations++;
        logger.info(`[${instanceId}] Invalidated ${key} (type: ${type})`);
      } else if (channel === 'cache:cascade') {
        // Multiple related keys
        const { userId, cascadeKeys } = event;
        for (const key of cascadeKeys) {
          localCache.delete(key);
        }
        metrics.invalidations += cascadeKeys.length;
        logger.info(`[${instanceId}] Cascade invalidated ${cascadeKeys.length} keys for user ${userId}`);
      } else if (channel === 'cache:batch') {
        // Batch invalidation
        const { keys } = event;
        for (const key of keys) {
          localCache.delete(key);
        }
        metrics.invalidations += keys.length;
        logger.info(`[${instanceId}] Batch invalidated ${keys.length} keys`);
      } else if (channel === 'health:heartbeat') {
        logger.debug(`[${instanceId}] Received heartbeat from ${event.instance}`);
      }
    } catch (error) {
      logger.error('Error handling Pub/Sub message:', error);
    }
  });

  logger.info(`[${instanceId}] Pub/Sub subscriber connected and listening to channels`);
});

// ============================================
// Endpoint 1: Get user from cache (with local caching)
// ============================================
app.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  const cacheKey = `user:${userId}`;

  try {
    // Check local cache first
    if (localCache.has(cacheKey)) {
      return res.json({
        user: localCache.get(cacheKey),
        source: 'local-cache',
        instance: instanceId
      });
    }

    // Check Redis cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      const user = JSON.parse(cached);
      localCache.set(cacheKey, user);
      return res.json({
        user,
        source: 'redis-cache',
        instance: instanceId
      });
    }

    // Cache miss - fetch from database
    await simulateDatabaseQuery();
    const user = mockDatabase[userId];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store in Redis and local cache
    await redis.setEx(cacheKey, 3600, JSON.stringify(user));
    localCache.set(cacheKey, user);

    res.json({
      user,
      source: 'database',
      instance: instanceId
    });
  } catch (error) {
    logger.error(`Error fetching user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============================================
// Endpoint 2: Update user (publish invalidation)
// ============================================
app.post('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  const { name, email, role, status } = req.body;

  try {
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    const user = mockDatabase[userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update database
    const updated = {
      ...user,
      name,
      email,
      role: role || user.role,
      status: status || user.status,
      version: user.version + 1
    };
    mockDatabase[userId] = updated;

    // Clear local cache
    localCache.delete(`user:${userId}`);

    // Publish invalidation event to all instances
    const event = {
      type: 'user_updated',
      key: `user:${userId}`,
      userId,
      changedFields: { name, email, role, status },
      timestamp: Date.now(),
      publishedBy: instanceId
    };

    await redis.publish('cache:invalidation', JSON.stringify(event));
    metrics.published++;

    logger.info(`Published user:${userId} invalidation event`);

    res.json({
      success: true,
      user: updated,
      message: 'User updated and invalidation published to all instances',
      instance: instanceId
    });
  } catch (error) {
    logger.error(`Error updating user ${userId}:`, error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ============================================
// Endpoint 3: Cascade invalidation
// ============================================
app.post('/api/user/:id/cascade', async (req, res) => {
  const userId = req.params.id;

  try {
    const cascadeKeys = [
      `user:${userId}`,
      `user:${userId}:profile`,
      `user:${userId}:permissions`,
      `user:${userId}:roles`,
      `user:${userId}:settings`
    ];

    // Clear local cache
    for (const key of cascadeKeys) {
      localCache.delete(key);
    }

    // Publish cascade event
    const event = { userId, cascadeKeys, timestamp: Date.now() };
    await redis.publish('cache:cascade', JSON.stringify(event));
    metrics.published++;

    res.json({
      success: true,
      keysInvalidated: cascadeKeys.length,
      keys: cascadeKeys,
      instance: instanceId
    });
  } catch (error) {
    logger.error(`Error cascade invalidating user ${userId}:`, error);
    res.status(500).json({ error: 'Cascade failed' });
  }
});

// ============================================
// Endpoint 4: Batch invalidation
// ============================================
app.post('/api/cache/batch-invalidate', async (req, res) => {
  const { keys } = req.body;

  if (!Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ error: 'Keys array required' });
  }

  try {
    // Clear local cache
    for (const key of keys) {
      localCache.delete(key);
    }

    // Publish batch event
    const event = { keys, timestamp: Date.now() };
    await redis.publish('cache:batch', JSON.stringify(event));
    metrics.published++;

    res.json({
      success: true,
      keysInvalidated: keys.length,
      instance: instanceId
    });
  } catch (error) {
    logger.error('Error batch invalidating:', error);
    res.status(500).json({ error: 'Batch invalidation failed' });
  }
});

// ============================================
// Endpoint 5: Multi-instance invalidation (for testing)
// ============================================
app.post('/api/user/:id/multi-publish', async (req, res) => {
  const userId = req.params.id;

  try {
    // Simulate updating on this instance
    const user = mockDatabase[userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update simulated
    mockDatabase[userId].version++;
    localCache.delete(`user:${userId}`);

    // Publish to MULTIPLE channels to reach different subscriber groups
    const channels = [
      'cache:invalidation',
      'cache:cascade',
      'cache:batch'
    ];

    for (const channel of channels) {
      await redis.publish(channel, JSON.stringify({
        type: 'user_updated',
        key: `user:${userId}`,
        userId,
        timestamp: Date.now(),
        publisher: instanceId
      }));
    }

    metrics.published += channels.length;

    res.json({
      success: true,
      channelsPublished: channels.length,
      message: 'Published to multiple channels for guaranteed delivery'
    });
  } catch (error) {
    logger.error(`Error in multi-publish:`, error);
    res.status(500).json({ error: 'Multi-publish failed' });
  }
});

// ============================================
// Endpoint 6: Healthcheck (publish heartbeat)
// ============================================
app.post('/api/health/heartbeat', async (req, res) => {
  try {
    const heartbeat = {
      instance: instanceId,
      timestamp: Date.now(),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      uptime: process.uptime(),
      cacheSize: localCache.size
    };

    await redis.publish('health:heartbeat', JSON.stringify(heartbeat));

    res.json(heartbeat);
  } catch (error) {
    logger.error('Error publishing heartbeat:', error);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

// ============================================
// Endpoint 7: Get metrics
// ============================================
app.get('/api/metrics', (req, res) => {
  res.json({
    instance: instanceId,
    metrics: {
      published: metrics.published,
      received: metrics.received,
      invalidations: metrics.invalidations,
      localCacheSize: localCache.size
    },
    recentMessages: metrics.messageLog.slice(-20),
    timestamp: new Date()
  });
});

// ============================================
// Endpoint 8: Get local cache state
// ============================================
app.get('/api/cache/state', (req, res) => {
  const state = {};
  for (const [key, value] of localCache.entries()) {
    state[key] = value;
  }

  res.json({
    instance: instanceId,
    cacheSize: localCache.size,
    keys: Array.from(localCache.keys()),
    values: state
  });
});

// ============================================
// Endpoint 9: Clear local cache
// ============================================
app.post('/api/cache/clear', (req, res) => {
  const previousSize = localCache.size;
  localCache.clear();

  res.json({
    success: true,
    previousSize,
    currentSize: localCache.size,
    instance: instanceId
  });
});

// ============================================
// Endpoint 10: Reset metrics
// ============================================
app.post('/api/metrics/reset', (req, res) => {
  metrics.published = 0;
  metrics.received = 0;
  metrics.invalidations = 0;
  metrics.messageLog = [];

  res.json({ success: true, message: 'Metrics reset' });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'pubsub-pattern',
    instance: instanceId,
    uptime: process.uptime()
  });
});

// Start server
app.listen(port, () => {
  logger.info(`[${instanceId}] Pub/Sub Pattern server running on port ${port}`);
  console.log(`🚀 Server ${instanceId} running at http://localhost:${port}`);
  console.log(`📊 Metrics available at http://localhost:${port}/api/metrics`);
  console.log(`💾 Cache state available at http://localhost:${port}/api/cache/state`);
});
