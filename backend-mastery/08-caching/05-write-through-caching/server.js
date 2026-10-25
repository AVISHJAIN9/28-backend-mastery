import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from 'redis';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.HTTP_PORT || 6405;

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

// Simulated database (in-memory)
const mockDatabase = {};

// Metrics tracking
const metrics = {
  writes: { sync: 0, async: 0, failed: 0 },
  reads: { cacheHit: 0, cacheMiss: 0 },
  latencies: { cacheWrite: [], dbWrite: [], totalWrite: [] },
  writeLog: []
};

// Write queue for async writes
const writeQueue = [];
let queueProcessing = false;

// Simulate latencies
const CACHE_LATENCY = 1;  // ms
const DB_LATENCY = 100;   // ms

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// Endpoint 1: Synchronous Write-Through
// ============================================
app.post('/api/write/sync', async (req, res) => {
  const { key, value } = req.body;

  if (!key || !value) {
    return res.status(400).json({ error: 'Key and value required' });
  }

  const startTime = Date.now();

  try {
    // Step 1: Write to cache
    const cacheStart = Date.now();
    await redis.set(key, JSON.stringify(value));
    const cacheLatency = Date.now() - cacheStart;

    // Step 2: Write to database
    const dbStart = Date.now();
    mockDatabase[key] = { value, timestamp: Date.now(), version: 1 };
    await delay(DB_LATENCY);  // Simulate DB latency
    const dbLatency = Date.now() - dbStart;

    const totalLatency = Date.now() - startTime;

    // Track metrics
    metrics.writes.sync++;
    metrics.latencies.cacheWrite.push(cacheLatency);
    metrics.latencies.dbWrite.push(dbLatency);
    metrics.latencies.totalWrite.push(totalLatency);
    metrics.writeLog.push({
      strategy: 'sync',
      key,
      cacheLatency,
      dbLatency,
      totalLatency,
      timestamp: Date.now()
    });

    logger.info(`Write-Through SYNC: ${key} (cache: ${cacheLatency}ms, db: ${dbLatency}ms)`);

    res.json({
      success: true,
      key,
      value,
      cacheLatency,
      dbLatency,
      totalLatency,
      strategy: 'synchronous-write-through'
    });
  } catch (error) {
    metrics.writes.failed++;
    logger.error(`Write-Through SYNC failed for ${key}:`, error);

    // Rollback cache on failure
    await redis.del(key);

    res.status(500).json({
      error: 'Write-through failed',
      message: error.message
    });
  }
});

// ============================================
// Endpoint 2: Asynchronous Write-Through
// ============================================
app.post('/api/write/async', async (req, res) => {
  const { key, value } = req.body;

  if (!key || !value) {
    return res.status(400).json({ error: 'Key and value required' });
  }

  const startTime = Date.now();

  try {
    // Step 1: Write to cache (synchronous, fast)
    const cacheStart = Date.now();
    await redis.set(key, JSON.stringify(value));
    const cacheLatency = Date.now() - cacheStart;

    // Step 2: Queue database write (asynchronous)
    writeQueue.push({
      key,
      value,
      queuedAt: Date.now()
    });

    // Process queue in background
    if (!queueProcessing) {
      processWriteQueue();
    }

    const totalLatency = Date.now() - startTime;

    metrics.writes.async++;
    metrics.latencies.cacheWrite.push(cacheLatency);
    metrics.latencies.totalWrite.push(totalLatency);

    logger.info(`Write-Through ASYNC: ${key} (cache: ${cacheLatency}ms, queued for DB)`);

    res.json({
      success: true,
      key,
      value,
      cacheLatency,
      totalLatency,
      queuedForDatabase: true,
      strategy: 'asynchronous-write-through',
      note: 'Data written to cache, DB write queued'
    });
  } catch (error) {
    metrics.writes.failed++;
    logger.error(`Write-Through ASYNC failed for ${key}:`, error);

    // Rollback cache on error
    await redis.del(key);

    res.status(500).json({
      error: 'Write-through cache failed',
      message: error.message
    });
  }
});

// ============================================
// Background: Process write queue
// ============================================
async function processWriteQueue() {
  queueProcessing = true;

  while (writeQueue.length > 0) {
    const task = writeQueue.shift();

    try {
      // Simulate DB write
      await delay(DB_LATENCY);
      mockDatabase[task.key] = {
        value: task.value,
        timestamp: Date.now(),
        version: 1
      };

      logger.info(`Async write processed: ${task.key}`);
    } catch (error) {
      logger.error(`Async DB write failed for ${task.key}:`, error);

      // Revert cache
      await redis.del(task.key);

      // Re-queue for retry
      writeQueue.push(task);
    }
  }

  queueProcessing = false;
}

// ============================================
// Endpoint 3: Read (with caching)
// ============================================
app.get('/api/read/:key', async (req, res) => {
  const { key } = req.params;
  const startTime = Date.now();

  try {
    // Check cache first
    const cached = await redis.get(key);
    const cacheLatency = Date.now() - startTime;

    if (cached) {
      metrics.reads.cacheHit++;
      return res.json({
        success: true,
        key,
        value: JSON.parse(cached),
        source: 'cache',
        latency: cacheLatency,
        note: 'CACHE HIT'
      });
    }

    // Cache miss - read from DB
    metrics.reads.cacheMiss++;

    if (!mockDatabase[key]) {
      return res.status(404).json({ error: 'Key not found' });
    }

    const value = mockDatabase[key].value;

    // Populate cache
    await redis.set(key, JSON.stringify(value));

    const totalLatency = Date.now() - startTime;

    res.json({
      success: true,
      key,
      value,
      source: 'database',
      latency: totalLatency,
      note: 'CACHE MISS - populated from DB'
    });
  } catch (error) {
    logger.error(`Read failed for ${key}:`, error);
    res.status(500).json({ error: 'Read failed', message: error.message });
  }
});

// ============================================
// Endpoint 4: Comparison (read from cache vs DB)
// ============================================
app.post('/api/compare/latency', async (req, res) => {
  const { key, value } = req.body;

  try {
    // Store data
    mockDatabase[key] = { value, timestamp: Date.now() };
    await redis.set(key, JSON.stringify(value));

    // Read from cache 100 times
    const cacheStart = Date.now();
    for (let i = 0; i < 100; i++) {
      await redis.get(key);
    }
    const cacheTime = Date.now() - cacheStart;

    // Read from "database" 100 times
    const dbStart = Date.now();
    for (let i = 0; i < 100; i++) {
      const _ = mockDatabase[key];
      await delay(1);  // Minimal DB latency
    }
    const dbTime = Date.now() - dbStart;

    res.json({
      success: true,
      test: '100 reads each',
      cache: { totalTime: cacheTime, avgLatency: (cacheTime / 100).toFixed(2) + 'ms' },
      database: { totalTime: dbTime, avgLatency: (dbTime / 100).toFixed(2) + 'ms' },
      speedup: ((dbTime / cacheTime).toFixed(1) + 'x faster'),
      note: 'Cache ~1000x faster than DB!'
    });
  } catch (error) {
    logger.error('Latency comparison failed:', error);
    res.status(500).json({ error: 'Comparison failed' });
  }
});

// ============================================
// Endpoint 5: Failure scenario (cache fails)
// ============================================
app.post('/api/failure/cache-fail', async (req, res) => {
  const { key, value } = req.body;

  try {
    logger.warn(`Simulating cache failure for ${key}`);

    // Pretend cache write failed
    // (In real scenario, this would catch a Redis exception)

    // Database still gets written
    mockDatabase[key] = { value, timestamp: Date.now() };
    await delay(DB_LATENCY);

    res.json({
      success: false,
      scenario: 'cache-failure',
      note: 'Cache write failed, but DB was updated',
      consequence: 'Next read will hit DB (cache miss), then repopulate cache',
      key,
      value
    });
  } catch (error) {
    res.status(500).json({ error: 'Scenario failed' });
  }
});

// ============================================
// Endpoint 6: Failure scenario (DB fails)
// ============================================
app.post('/api/failure/db-fail', async (req, res) => {
  const { key, value } = req.body;

  try {
    // Cache succeeds
    await redis.set(key, JSON.stringify(value));

    // DB fails (simulated)
    logger.warn(`Simulating DB failure for ${key}`);

    // Rollback cache
    await redis.del(key);

    res.json({
      success: false,
      scenario: 'database-failure',
      note: 'DB write failed, cache was reverted',
      consequence: 'Data not persisted. Client must retry.',
      key
    });
  } catch (error) {
    res.status(500).json({ error: 'Scenario failed' });
  }
});

// ============================================
// Endpoint 7: Queue status
// ============================================
app.get('/api/queue/status', (req, res) => {
  res.json({
    queueSize: writeQueue.length,
    isProcessing: queueProcessing,
    pendingWrites: writeQueue.slice(0, 10)
  });
});

// ============================================
// Endpoint 8: Metrics
// ============================================
app.get('/api/metrics', (req, res) => {
  const avgCacheLatency = metrics.latencies.cacheWrite.length > 0
    ? (metrics.latencies.cacheWrite.reduce((a, b) => a + b, 0) / metrics.latencies.cacheWrite.length).toFixed(2)
    : 0;

  const avgDbLatency = metrics.latencies.dbWrite.length > 0
    ? (metrics.latencies.dbWrite.reduce((a, b) => a + b, 0) / metrics.latencies.dbWrite.length).toFixed(2)
    : 0;

  const avgTotalLatency = metrics.latencies.totalWrite.length > 0
    ? (metrics.latencies.totalWrite.reduce((a, b) => a + b, 0) / metrics.latencies.totalWrite.length).toFixed(2)
    : 0;

  const hitRate = metrics.reads.cacheHit + metrics.reads.cacheMiss > 0
    ? ((metrics.reads.cacheHit / (metrics.reads.cacheHit + metrics.reads.cacheMiss)) * 100).toFixed(1)
    : 0;

  res.json({
    writes: metrics.writes,
    reads: {
      cacheHit: metrics.reads.cacheHit,
      cacheMiss: metrics.reads.cacheMiss,
      hitRate: hitRate + '%'
    },
    latencies: {
      avgCacheLatency: avgCacheLatency + 'ms',
      avgDbLatency: avgDbLatency + 'ms',
      avgTotalWriteLatency: avgTotalLatency + 'ms'
    },
    recentWrites: metrics.writeLog.slice(-10)
  });
});

// ============================================
// Endpoint 9: Clear data
// ============================================
app.post('/api/clear', async (req, res) => {
  for (const key of Object.keys(mockDatabase)) {
    delete mockDatabase[key];
  }
  await redis.flushDb();

  res.json({ success: true, message: 'All data cleared' });
});

// ============================================
// Endpoint 10: Reset metrics
// ============================================
app.post('/api/metrics/reset', (req, res) => {
  metrics.writes = { sync: 0, async: 0, failed: 0 };
  metrics.reads = { cacheHit: 0, cacheMiss: 0 };
  metrics.latencies = { cacheWrite: [], dbWrite: [], totalWrite: [] };
  metrics.writeLog = [];

  res.json({ success: true, message: 'Metrics reset' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'write-through-caching' });
});

// Start server
app.listen(port, () => {
  logger.info(`Write-Through Caching server running on port ${port}`);
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📊 Metrics available at http://localhost:${port}/api/metrics`);
});
