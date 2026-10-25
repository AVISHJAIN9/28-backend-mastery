import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 6410;

// Redis setup
const redis = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  db: process.env.REDIS_DB || 0
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('✓ Redis connected'));

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock database
const db = {
  users: {
    1: { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
    2: { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user' },
    3: { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'user' },
    4: { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'moderator' },
    5: { id: 5, name: 'Eve Wilson', email: 'eve@example.com', role: 'user' }
  },
  products: {
    101: { id: 101, name: 'Laptop Pro', price: 1299.99, category: 'electronics', stock: 45 },
    102: { id: 102, name: 'Wireless Mouse', price: 29.99, category: 'accessories', stock: 200 },
    103: { id: 103, name: 'USB-C Cable', price: 14.99, category: 'accessories', stock: 500 },
    104: { id: 104, name: 'Monitor 4K', price: 599.99, category: 'electronics', stock: 25 },
    105: { id: 105, name: 'Keyboard Mechanical', price: 149.99, category: 'accessories', stock: 80 }
  },
  config: {
    appName: 'Cache Warming Demo',
    version: '1.0.0',
    maxUsers: 10000,
    cacheEnabled: true,
    refreshInterval: 300000 // 5 minutes
  }
};

// Simulated database queries with delay
async function queryDatabase(key, delayMs = 200) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (key.startsWith('user:')) {
        const id = parseInt(key.split(':')[1]);
        resolve(db.users[id] || null);
      } else if (key.startsWith('product:')) {
        const id = parseInt(key.split(':')[1]);
        resolve(db.products[id] || null);
      } else if (key === 'config:app') {
        resolve(db.config);
      } else {
        resolve(null);
      }
    }, delayMs);
  });
}

// ============== CACHE WARMING STRATEGIES ==============

// Strategy 1: Startup Preloading
async function warmCacheStartup() {
  console.log('📦 Starting cache warm-up...');
  const startTime = Date.now();
  let itemsWarmed = 0;

  try {
    // Warm users
    for (const [id, user] of Object.entries(db.users)) {
      const key = `user:${id}`;
      await redis.set(key, JSON.stringify(user), { EX: 3600 }); // 1 hour TTL
      itemsWarmed++;
    }

    // Warm products
    for (const [id, product] of Object.entries(db.products)) {
      const key = `product:${id}`;
      await redis.set(key, JSON.stringify(product), { EX: 7200 }); // 2 hour TTL
      itemsWarmed++;
    }

    // Warm config
    await redis.set('config:app', JSON.stringify(db.config), { EX: 86400 }); // 1 day TTL
    itemsWarmed++;

    const duration = Date.now() - startTime;
    console.log(`✓ Warmed ${itemsWarmed} items in ${duration}ms`);
  } catch (error) {
    console.error('❌ Warm-up failed:', error);
  }
}

// Strategy 2: Scheduled Refresh (simulates periodic background refresh)
function scheduleRefresh() {
  console.log('⏱️ Scheduled refresh enabled (every 5 minutes)');
  setInterval(async () => {
    console.log('🔄 Refreshing hot data...');
    try {
      // Refresh popular products
      for (const [id, product] of Object.entries(db.products)) {
        const key = `product:${id}`;
        await redis.set(key, JSON.stringify(product), { EX: 7200 });
      }
      console.log('✓ Refresh completed');
    } catch (error) {
      console.error('Refresh error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

// Strategy 3: Lazy Warmer (reheats before expiry)
async function lazyWarmData(key) {
  const data = await redis.get(key);
  
  if (!data) {
    // Cache miss - fetch from database
    const freshData = await queryDatabase(key);
    if (freshData) {
      const ttl = key.startsWith('user:') ? 3600 : 7200;
      await redis.set(key, JSON.stringify(freshData), { EX: ttl });
    }
    return freshData;
  }
  
  // Data exists but check if should reheat
  const ttl = await redis.ttl(key);
  if (ttl > 0 && ttl < 600) {
    // Less than 10 minutes remaining - reheat in background
    queryDatabase(key).then(freshData => {
      const newTtl = key.startsWith('user:') ? 3600 : 7200;
      redis.set(key, JSON.stringify(freshData), { EX: newTtl });
    }).catch(err => console.error('Lazy warm error:', err));
  }
  
  return JSON.parse(data);
}

// ============== API ENDPOINTS ==============

// Get item (with lazy warming)
app.get('/api/item/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const data = await lazyWarmData(key);
    
    if (!data) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const ttl = await redis.ttl(key);
    res.json({ data, ttl, source: 'cache' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cache status
app.get('/api/cache/status', async (req, res) => {
  try {
    const keys = await redis.keys('*');
    const info = await redis.info('memory');
    const stats = {
      totalKeys: keys.length,
      userKeys: keys.filter(k => k.startsWith('user:') || k.startsWith('product:') || k.startsWith('config:')).length,
      memory: info ? info.split('\r\n').find(line => line.startsWith('used_memory_human')) : 'N/A',
      keys: keys.slice(0, 20) // First 20 keys
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger startup warm-up manually
app.post('/api/cache/warm/startup', async (req, res) => {
  try {
    const start = Date.now();
    await warmCacheStartup();
    const duration = Date.now() - start;
    res.json({ message: 'Startup warm-up completed', duration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all warmed data
app.get('/api/cache/all', async (req, res) => {
  try {
    const keys = await redis.keys('*');
    const data = {};
    
    for (const key of keys) {
      const value = await redis.get(key);
      const ttl = await redis.ttl(key);
      data[key] = { value: JSON.parse(value), ttl };
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear cache
app.post('/api/cache/clear', async (req, res) => {
  try {
    await redis.flushDb();
    res.json({ message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Database stats (shows what's available to warm)
app.get('/api/database/stats', (req, res) => {
  res.json({
    users: Object.keys(db.users).length,
    products: Object.keys(db.products).length,
    config: 1,
    totalItems: Object.keys(db.users).length + Object.keys(db.products).length + 1
  });
});

// ============== START SERVER ==============

async function startServer() {
  try {
    await redis.connect();
    
    // Warm up cache on startup
    await warmCacheStartup();
    
    // Enable scheduled refresh
    scheduleRefresh();
    
    app.listen(HTTP_PORT, () => {
      console.log(`\n🚀 Cache Warming Server running on http://localhost:${HTTP_PORT}`);
      console.log(`📊 Dashboard: http://localhost:${HTTP_PORT}/index.html`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
