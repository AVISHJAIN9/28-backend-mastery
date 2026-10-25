import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 6411;

// Redis L2 setup
const redis = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  db: process.env.REDIS_DB || 0
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('✓ Redis connected'));

// L1: In-Memory Cache (Process-local)
const L1Cache = new Map();

// L2: Redis (handled via redis client)

// L3: Mock Database
const db = {
  users: {
    1: { id: 1, name: 'Alice Johnson', email: 'alice@example.com', age: 28 },
    2: { id: 2, name: 'Bob Smith', email: 'bob@example.com', age: 35 },
    3: { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', age: 42 },
  },
  products: {
    101: { id: 101, name: 'Laptop', price: 999.99, stock: 50 },
    102: { id: 102, name: 'Mouse', price: 29.99, stock: 200 },
    103: { id: 103, name: 'Keyboard', price: 79.99, stock: 150 },
  }
};

// Metrics tracking
const metrics = {
  L1: { hits: 0, misses: 0, latencies: [] },
  L2: { hits: 0, misses: 0, latencies: [] },
  L3: { hits: 0, latencies: [] }
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============== CACHE ACCESS FUNCTIONS ==============

// Simulated database access with delay
async function queryDatabase(key) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (key.startsWith('user:')) {
        const id = parseInt(key.split(':')[1]);
        resolve(db.users[id] || null);
      } else if (key.startsWith('product:')) {
        const id = parseInt(key.split(':')[1]);
        resolve(db.products[id] || null);
      } else {
        resolve(null);
      }
    }, 100); // 100ms delay to simulate DB
  });
}

// Multi-tier lookup: L1 → L2 → L3
async function getValueMultiTier(key) {
  let source = null;
  let latency = 0;
  const startTime = Date.now();

  // Try L1
  let value = L1Cache.get(key);
  if (value) {
    latency = Date.now() - startTime;
    metrics.L1.hits++;
    metrics.L1.latencies.push(latency);
    return { value, source: 'L1', latency };
  }
  metrics.L1.misses++;

  // Try L2
  value = await redis.get(key);
  if (value) {
    value = JSON.parse(value);
    // Populate L1 from L2
    L1Cache.set(key, value);
    latency = Date.now() - startTime;
    metrics.L2.hits++;
    metrics.L2.latencies.push(latency);
    return { value, source: 'L2', latency };
  }
  metrics.L2.misses++;

  // Try L3
  value = await queryDatabase(key);
  if (value) {
    // Populate L2 from L3
    await redis.set(key, JSON.stringify(value), { EX: 3600 });
    // Populate L1 from L3 (shorter TTL in L1)
    L1Cache.set(key, value);
    latency = Date.now() - startTime;
    metrics.L3.hits++;
    metrics.L3.latencies.push(latency);
    return { value, source: 'L3', latency };
  }

  return { value: null, source: 'miss', latency: Date.now() - startTime };
}

// Set value across all tiers (write-through)
async function setValueMultiTier(key, value) {
  // L3 first (source of truth)
  // In real app, this would be database.save()
  
  // L2 (Redis)
  await redis.set(key, JSON.stringify(value), { EX: 3600 });
  
  // L1 (In-Memory)
  L1Cache.set(key, value);
}

// Invalidate across all tiers
async function invalidateKey(key) {
  L1Cache.delete(key);
  await redis.del(key);
  // L3 stays (source of truth)
}

// Clear all caches
async function clearAllCaches() {
  L1Cache.clear();
  await redis.flushDb();
}

// ============== API ENDPOINTS ==============

// Fetch value with multi-tier lookup
app.get('/api/value/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await getValueMultiTier(key);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cache statistics
app.get('/api/stats', (req, res) => {
  const calculateHitRatio = (hits, misses) => {
    const total = hits + misses;
    return total === 0 ? '0%' : `${((hits / total) * 100).toFixed(1)}%`;
  };

  const avgLatency = (latencies) => {
    if (latencies.length === 0) return 0;
    return (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  };

  const L1Total = metrics.L1.hits + metrics.L1.misses;
  const L2Total = metrics.L2.hits + metrics.L2.misses;

  res.json({
    L1: {
      hits: metrics.L1.hits,
      misses: metrics.L1.misses,
      total: L1Total,
      hitRatio: calculateHitRatio(metrics.L1.hits, metrics.L1.misses),
      avgLatency: avgLatency(metrics.L1.latencies) + 'ms'
    },
    L2: {
      hits: metrics.L2.hits,
      misses: metrics.L2.misses,
      total: L2Total,
      hitRatio: calculateHitRatio(metrics.L2.hits, metrics.L2.misses),
      avgLatency: avgLatency(metrics.L2.latencies) + 'ms'
    },
    L3: {
      hits: metrics.L3.hits,
      avgLatency: avgLatency(metrics.L3.latencies) + 'ms'
    },
    overallHitRatio: calculateHitRatio(
      metrics.L1.hits + metrics.L2.hits,
      metrics.L3.hits
    )
  });
});

// Get cache contents
app.get('/api/cache/contents', async (req, res) => {
  try {
    const L1Contents = Array.from(L1Cache.entries()).map(([key, value]) => ({
      key,
      size: JSON.stringify(value).length
    }));

    const L2Keys = await redis.keys('*');
    const L2Contents = [];
    for (const key of L2Keys) {
      const value = await redis.get(key);
      L2Contents.push({
        key,
        size: value ? value.length : 0
      });
    }

    res.json({
      L1: {
        itemCount: L1Contents.length,
        items: L1Contents,
        totalSize: L1Contents.reduce((sum, item) => sum + item.size, 0)
      },
      L2: {
        itemCount: L2Contents.length,
        items: L2Contents,
        totalSize: L2Contents.reduce((sum, item) => sum + item.size, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invalidate key
app.post('/api/invalidate/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await invalidateKey(key);
    res.json({ message: `Invalidated ${key} across all tiers` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all caches
app.post('/api/cache/clear', async (req, res) => {
  try {
    await clearAllCaches();
    // Reset metrics
    metrics.L1 = { hits: 0, misses: 0, latencies: [] };
    metrics.L2 = { hits: 0, misses: 0, latencies: [] };
    metrics.L3 = { hits: 0, latencies: [] };
    res.json({ message: 'All caches cleared and metrics reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset metrics only
app.post('/api/metrics/reset', (req, res) => {
  metrics.L1 = { hits: 0, misses: 0, latencies: [] };
  metrics.L2 = { hits: 0, misses: 0, latencies: [] };
  metrics.L3 = { hits: 0, latencies: [] };
  res.json({ message: 'Metrics reset' });
});

// ============== START SERVER ==============

async function startServer() {
  try {
    await redis.connect();
    console.log('✓ Multi-tier cache system initialized');
    console.log('  L1: In-memory (process-local)');
    console.log('  L2: Redis (distributed)');
    console.log('  L3: Database (source of truth)');

    app.listen(HTTP_PORT, () => {
      console.log(`\n🚀 Multi-tier Server running on http://localhost:${HTTP_PORT}`);
      console.log(`📊 Dashboard: http://localhost:${HTTP_PORT}/index.html`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
