import express from 'express';
import redis from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.HTTP_PORT || 6417;

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  db: process.env.REDIS_DB || 0
});

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

await redisClient.connect();

// =====================================================
// RATE LIMITING ALGORITHM 1: FIXED WINDOW
// =====================================================
const fixedWindow = async (identifier, limit = 100, windowSeconds = 60) => {
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `rate:fixed:${identifier}:${windowStart}`;
  
  const count = await redisClient.incr(key);
  
  if (count === 1) {
    await redisClient.expire(key, windowSeconds);
  }
  
  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);
  const resetTime = (windowStart + 1) * windowSeconds * 1000;
  
  return {
    allowed,
    count,
    limit,
    remaining,
    resetTime,
    resetIn: Math.ceil((resetTime - Date.now()) / 1000),
    algorithm: 'fixed-window'
  };
};

// =====================================================
// RATE LIMITING ALGORITHM 2: TOKEN BUCKET
// =====================================================
const tokenBucket = async (identifier, capacity = 100, refillSeconds = 60) => {
  const key = `rate:token:${identifier}`;
  const now = Date.now();
  
  let bucket = await redisClient.hGetAll(key);
  
  if (!bucket || !bucket.tokens) {
    bucket = { tokens: capacity, lastRefill: now };
  } else {
    const timePassed = (now - parseInt(bucket.lastRefill)) / 1000;
    const tokensAdded = (timePassed / refillSeconds) * capacity;
    bucket.tokens = Math.min(capacity, parseFloat(bucket.tokens) + tokensAdded);
    bucket.lastRefill = now;
  }
  
  const allowed = bucket.tokens >= 1;
  
  if (allowed) {
    bucket.tokens -= 1;
  }
  
  await redisClient.hSet(key, {
    tokens: bucket.tokens.toFixed(2),
    lastRefill: bucket.lastRefill
  });
  await redisClient.expire(key, 3600); // 1 hour expiry
  
  return {
    allowed,
    tokens: parseFloat(bucket.tokens).toFixed(2),
    capacity,
    refillRate: (capacity / refillSeconds).toFixed(2),
    algorithm: 'token-bucket'
  };
};

// =====================================================
// RATE LIMITING ALGORITHM 3: SLIDING WINDOW
// =====================================================
const slidingWindow = async (identifier, limit = 100, windowSeconds = 60) => {
  const key = `rate:sliding:${identifier}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  
  // Remove old requests outside window
  await redisClient.zRemRangeByScore(key, '-inf', windowStart);
  
  // Count requests in window
  const count = await redisClient.zCard(key);
  const allowed = count < limit;
  
  if (allowed) {
    // Add current request with timestamp as score
    const member = `${now}-${Math.random()}`;
    await redisClient.zAdd(key, { score: now, member });
  }
  
  // Set expiration
  await redisClient.expire(key, windowSeconds);
  
  const remaining = Math.max(0, limit - count - 1);
  const resetTime = now + (windowSeconds * 1000);
  
  return {
    allowed,
    count,
    limit,
    remaining,
    resetTime,
    resetIn: Math.ceil((resetTime - now) / 1000),
    algorithm: 'sliding-window'
  };
};

// =====================================================
// HELPER: Set rate limit headers
// =====================================================
const setRateLimitHeaders = (res, result) => {
  if (result.limit) {
    res.set('RateLimit-Limit', result.limit.toString());
    res.set('RateLimit-Remaining', result.remaining.toString());
    res.set('RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  }
  if (!result.allowed) {
    res.set('Retry-After', result.resetIn.toString());
  }
};

// =====================================================
// ENDPOINTS: FIXED WINDOW
// =====================================================
app.post('/api/fixed-window/check', async (req, res) => {
  try {
    const { identifier, limit = 100, window = 60 } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ error: 'identifier required' });
    }
    
    const result = await fixedWindow(identifier, limit, window);
    setRateLimitHeaders(res, result);
    
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        ...result
      });
    }
    
    res.json({
      success: true,
      message: 'Request allowed',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// ENDPOINTS: TOKEN BUCKET
// =====================================================
app.post('/api/token-bucket/check', async (req, res) => {
  try {
    const { identifier, capacity = 100, refill = 60 } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ error: 'identifier required' });
    }
    
    const result = await tokenBucket(identifier, capacity, refill);
    
    if (!result.allowed) {
      return res.status(429).json({
        error: 'No tokens available',
        ...result
      });
    }
    
    res.json({
      success: true,
      message: 'Request allowed',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// ENDPOINTS: SLIDING WINDOW
// =====================================================
app.post('/api/sliding-window/check', async (req, res) => {
  try {
    const { identifier, limit = 100, window = 60 } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ error: 'identifier required' });
    }
    
    const result = await slidingWindow(identifier, limit, window);
    setRateLimitHeaders(res, result);
    
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        ...result
      });
    }
    
    res.json({
      success: true,
      message: 'Request allowed',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// SIMULATION: Burst Test
// =====================================================
app.post('/api/simulate/burst', async (req, res) => {
  try {
    const { algorithm, identifier, count = 10, limit = 5, window = 60 } = req.body;
    
    if (!algorithm) {
      return res.status(400).json({ error: 'algorithm required (fixed, token, sliding)' });
    }
    
    const idBase = identifier || `burst-${Date.now()}`;
    const results = [];
    
    for (let i = 1; i <= count; i++) {
      let result;
      
      if (algorithm === 'fixed') {
        result = await fixedWindow(`${idBase}:fixed`, limit, window);
      } else if (algorithm === 'token') {
        result = await tokenBucket(`${idBase}:token`, limit, window);
      } else if (algorithm === 'sliding') {
        result = await slidingWindow(`${idBase}:sliding`, limit, window);
      }
      
      results.push({
        request: i,
        allowed: result.allowed,
        remaining: result.remaining || result.tokens,
        timestamp: new Date().toISOString()
      });
    }
    
    const allowed = results.filter(r => r.allowed).length;
    const rejected = results.filter(r => !r.allowed).length;
    
    res.json({
      algorithm,
      limit,
      burstSize: count,
      allowed,
      rejected,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// STATISTICS
// =====================================================
app.get('/api/stats/rate-limits', async (req, res) => {
  try {
    const keys = await redisClient.keys('rate:*');
    const stats = {
      totalRateLimitKeys: keys.length,
      byAlgorithm: {
        fixedWindow: keys.filter(k => k.includes('fixed')).length,
        tokenBucket: keys.filter(k => k.includes('token')).length,
        slidingWindow: keys.filter(k => k.includes('sliding')).length
      }
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// Clear rate limits (testing)
// =====================================================
app.post('/api/clear-all', async (req, res) => {
  try {
    const keys = await redisClient.keys('rate:*');
    
    for (const key of keys) {
      await redisClient.del(key);
    }
    
    res.json({
      success: true,
      message: `Cleared ${keys.length} rate limit keys`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// HEALTH CHECK
// =====================================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Rate Limiting Module' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Rate Limiting Server running on http://localhost:${PORT}`);
  console.log(`📊 Redis connected on ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
  console.log(`\n📚 Available Algorithms:`);
  console.log(`  1. Fixed Window: POST /api/fixed-window/check`);
  console.log(`  2. Token Bucket: POST /api/token-bucket/check`);
  console.log(`  3. Sliding Window: POST /api/sliding-window/check`);
  console.log(`\n🔥 Testing:`);
  console.log(`  - Burst Test: POST /api/simulate/burst`);
  console.log(`  - Statistics: GET /api/stats/rate-limits`);
  console.log(`  - Clear All: POST /api/clear-all\n`);
});

process.on('SIGINT', async () => {
  await redisClient.quit();
  process.exit(0);
});
