import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 6415;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis setup
const redisClient = redis.createClient({ url: REDIS_URL });
await redisClient.connect();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Simulated Expensive Query ====================

// Simulate database query
async function expensiveQuery(delay = 2000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 1,
        name: 'Product XYZ',
        price: 99.99,
        stock: 150,
        timestamp: new Date().toISOString()
      });
    }, delay);
  });
}

// ==================== Strategy 1: XFetch (Probabilistic Early Expiration) ====================

async function getDataXFetch(key, ttl = 60) {
  try {
    const cached = await redisClient.get(key);
    
    if (!cached) {
      // Cache miss - first load
      const data = await expensiveQuery();
      await redisClient.setEx(key, ttl, JSON.stringify(data));
      await redisClient.setEx(`${key}:time`, ttl, Date.now().toString());
      return {
        source: 'DB (fresh)',
        data,
        cacheAge: 0
      };
    }
    
    const cacheData = JSON.parse(cached);
    const cachedTimeStr = await redisClient.get(`${key}:time`);
    const cachedTime = parseInt(cachedTimeStr) || Date.now();
    const age = Date.now() - cachedTime;
    
    // XFetch: Probabilistic early refresh
    const delta = ttl * 1000 - age;  // Time until expiration in ms
    const beta = 1.0;
    
    // Calculate refresh probability
    const rand = Math.random();
    const refreshProbability = beta * Math.log(rand) / (-(ttl * 1000) / 1000);
    
    if (refreshProbability > 0.1) {
      // Refresh in background (async)
      setImmediate(async () => {
        try {
          const freshData = await expensiveQuery(1000);  // Faster refresh
          await redisClient.setEx(key, ttl, JSON.stringify(freshData));
          await redisClient.setEx(`${key}:time`, ttl, Date.now().toString());
          console.log(`✓ XFetch background refresh completed for ${key}`);
        } catch (err) {
          console.error(`✗ XFetch background refresh failed:`, err.message);
        }
      });
    }
    
    return {
      source: 'Cache (XFetch)',
      data: cacheData,
      cacheAge: Math.floor(age / 1000),
      willRefresh: refreshProbability > 0.1
    };
  } catch (err) {
    console.error('XFetch error:', err.message);
    throw err;
  }
}

// ==================== Strategy 2: Distributed Lock ====================

async function getDataWithLock(key, ttl = 60) {
  try {
    const cached = await redisClient.get(key);
    
    if (cached) {
      const cacheTime = parseInt(await redisClient.get(`${key}:time`) || '0');
      const age = Date.now() - cacheTime;
      return {
        source: 'Cache (Lock)',
        data: JSON.parse(cached),
        cacheAge: Math.floor(age / 1000)
      };
    }
    
    // Cache miss - try to acquire lock
    const lockKey = `${key}:lock`;
    const lockValue = Date.now().toString();
    
    const acquired = await redisClient.set(
      lockKey,
      lockValue,
      {
        EX: 10,  // Lock expires after 10 seconds
        NX: true // Only if not exists
      }
    );
    
    if (acquired) {
      // I got the lock - refresh cache
      console.log(`✓ Lock acquired for ${key}, refreshing...`);
      
      try {
        const data = await expensiveQuery();
        await redisClient.setEx(key, ttl, JSON.stringify(data));
        await redisClient.setEx(`${key}:time`, ttl, Date.now().toString());
        
        // Release lock via Lua script
        const luaScript = `
          if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
          else
            return 0
          end
        `;
        await redisClient.eval(luaScript, { keys: [lockKey], arguments: [lockValue] });
        
        return {
          source: 'DB (Lock - refreshed)',
          data,
          cacheAge: 0
        };
      } catch (err) {
        // Release lock on error
        await redisClient.del(lockKey);
        throw err;
      }
    } else {
      // Someone else has lock - wait for refresh
      console.log(`⏳ Lock held by another request, waiting...`);
      
      const maxWait = 5000;  // 5 seconds
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWait) {
        await new Promise(r => setTimeout(r, 100));
        
        const newData = await redisClient.get(key);
        if (newData) {
          const cacheTime = parseInt(await redisClient.get(`${key}:time`) || '0');
          const age = Date.now() - cacheTime;
          return {
            source: 'Cache (Lock - via waiter)',
            data: JSON.parse(newData),
            cacheAge: Math.floor(age / 1000),
            waitTime: Date.now() - startTime
          };
        }
      }
      
      throw new Error('Cache refresh timeout - lock holder did not complete');
    }
  } catch (err) {
    console.error('Lock strategy error:', err.message);
    throw err;
  }
}

// ==================== Strategy 3: Stale-While-Revalidate ====================

async function getDataStaleWhileRevalidate(key, ttl = 60, maxStale = 20) {
  try {
    const cached = await redisClient.get(key);
    const timestamp = parseInt(await redisClient.get(`${key}:time`) || Date.now().toString());
    const age = Date.now() - timestamp;
    
    if (!cached) {
      // No cache - fetch fresh
      const data = await expensiveQuery();
      await redisClient.setEx(key, ttl, JSON.stringify(data));
      await redisClient.setEx(`${key}:time`, ttl, Date.now().toString());
      return {
        source: 'DB (fresh)',
        data,
        cacheAge: 0
      };
    }
    
    // Cache exists
    if (age < ttl * 1000) {
      // Still fresh
      return {
        source: 'Cache (fresh)',
        data: JSON.parse(cached),
        cacheAge: Math.floor(age / 1000)
      };
    }
    
    // Cache is stale (age >= ttl)
    if (age < (ttl + maxStale) * 1000) {
      // Still within maxStale window - serve stale + refresh background
      console.log(`⟲ Serving stale cache, scheduling background refresh...`);
      
      // Background refresh
      setImmediate(async () => {
        try {
          const data = await expensiveQuery(1000);
          await redisClient.setEx(key, ttl, JSON.stringify(data));
          await redisClient.setEx(`${key}:time`, ttl, Date.now().toString());
          console.log(`✓ Stale-while-revalidate background refresh completed`);
        } catch (err) {
          console.error(`✗ Background refresh failed:`, err.message);
        }
      });
      
      // Return stale data immediately
      return {
        source: 'Cache (stale, revalidating)',
        data: JSON.parse(cached),
        cacheAge: Math.floor(age / 1000),
        isStale: true,
        maxStaleMs: maxStale * 1000
      };
    }
    
    // Beyond maxStale - must fetch fresh
    const data = await expensiveQuery();
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    await redisClient.setEx(`${key}:time`, ttl, Date.now().toString());
    return {
      source: 'DB (beyond maxStale)',
      data,
      cacheAge: 0
    };
  } catch (err) {
    console.error('Stale-while-revalidate error:', err.message);
    throw err;
  }
}

// ==================== API Routes ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: '09 Cache Stampede Prevention',
    category: '08 Caching',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: '09 Cache Stampede Prevention',
    module: '08-caching - 14',
    description: 'Preventing thundering herd/cache stampede problems',
    version: '1.0.0',
    category: '08 Caching',
    endpoints: {
      health: '/health',
      xfetch: '/api/xfetch',
      lock: '/api/lock',
      stale: '/api/stale-while-revalidate',
      clear: '/api/clear-cache'
    }
  });
});

// XFetch endpoint
app.get('/api/xfetch', async (req, res) => {
  try {
    const result = await getDataXFetch('stampede:test:xfetch', 60);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lock endpoint
app.get('/api/lock', async (req, res) => {
  try {
    const result = await getDataWithLock('stampede:test:lock', 60);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stale-while-revalidate endpoint
app.get('/api/stale-while-revalidate', async (req, res) => {
  try {
    const result = await getDataStaleWhileRevalidate('stampede:test:stale', 60, 20);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear cache for testing
app.post('/api/clear-cache', async (req, res) => {
  try {
    await redisClient.del('stampede:test:xfetch');
    await redisClient.del('stampede:test:xfetch:time');
    await redisClient.del('stampede:test:lock');
    await redisClient.del('stampede:test:lock:time');
    await redisClient.del('stampede:test:stale');
    await redisClient.del('stampede:test:stale:time');
    
    res.json({ message: 'Cache cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// Start server
const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ 09 Cache Stampede Prevention running on http://localhost:${HTTP_PORT}`);
  console.log(`✓ Health check: http://localhost:${HTTP_PORT}/health`);
  console.log(`✓ API endpoints available`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    redisClient.disconnect();
    process.exit(0);
  });
});

export default app;
