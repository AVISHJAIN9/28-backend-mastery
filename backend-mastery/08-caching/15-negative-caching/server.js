import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 6415;

const redis = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('✓ Redis connected'));

app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock database
const db = {
  users: {
    1: { id: 1, name: 'Alice' },
    2: { id: 2, name: 'Bob' },
    5: { id: 5, name: 'Charlie' }
  }
};

// Metrics
const metrics = {
  cacheLookups: 0,
  cacheHits: 0,
  cacheMisses: 0,
  dbQueries: 0,
  negativeCacheHits: 0
};

// Get user with negative caching
app.get('/api/user/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  const cacheKey = `user:${userId}`;
  
  metrics.cacheLookups++;
  
  try {
    // Try cache first
    const cached = await redis.get(cacheKey);
    
    if (cached !== null) {
      if (cached === 'NULL_SENTINEL') {
        metrics.negativeCacheHits++;
        metrics.cacheHits++;
        return res.json({
          user: null,
          source: 'negative-cache',
          cacheAge: await redis.ttl(cacheKey)
        });
      }
      
      metrics.cacheHits++;
      return res.json({
        user: JSON.parse(cached),
        source: 'cache',
        cacheAge: await redis.ttl(cacheKey)
      });
    }
    
    metrics.cacheMisses++;
    metrics.dbQueries++;
    
    // Query database
    const user = db.users[userId] || null;
    
    if (user) {
      // Cache hit
      await redis.set(cacheKey, JSON.stringify(user), { EX: 3600 });
      res.json({ user, source: 'database (positive)' });
    } else {
      // NEGATIVE CACHE: cache the null
      await redis.set(cacheKey, 'NULL_SENTINEL', { EX: 300 }); // 5 min
      res.json({ user: null, source: 'database (negative)' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get metrics
app.get('/api/metrics', (req, res) => {
  const hitRate = metrics.cacheLookups === 0 ? '0%' : 
    `${((metrics.cacheHits / metrics.cacheLookups) * 100).toFixed(1)}%`;
  
  res.json({
    ...metrics,
    hitRate,
    savedQueries: metrics.cacheMisses - metrics.dbQueries,
    efficiency: {
      description: `Prevented ${metrics.negativeCacheHits} repeated queries with negative caching`,
      dbSavings: `${((metrics.negativeCacheHits / Math.max(1, metrics.cacheLookups)) * 100).toFixed(1)}% of lookups`
    }
  });
});

// Clear cache
app.post('/api/cache/clear', async (req, res) => {
  await redis.flushDb();
  metrics.cacheLookups = 0;
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.dbQueries = 0;
  metrics.negativeCacheHits = 0;
  res.json({ message: 'Cache cleared and metrics reset' });
});

// Remove specific cache entry (simulate invalidation)
app.post('/api/invalidate/:key', async (req, res) => {
  const key = req.params.key;
  await redis.del(key);
  res.json({ message: `Invalidated ${key}` });
});

app.listen(HTTP_PORT, () => {
  console.log(`🚀 Negative Caching Server on http://localhost:${HTTP_PORT}`);
});
