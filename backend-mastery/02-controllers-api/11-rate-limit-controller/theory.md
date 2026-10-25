# Rate Limiting - Theory & Algorithms

## Fixed Window Counter

```javascript
const counter = new Map(); // { "user:123": 5 }

const rateLimit = (req, res, next) => {
  const key = `user:${req.user.id}`;
  const now = Math.floor(Date.now() / 60000); // 1-min window
  const windowKey = `${key}:${now}`;
  
  let count = counter.get(windowKey) || 0;
  count++;
  counter.set(windowKey, count);
  
  if (count > 100) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  next();
};
```

**Problem**: Burst at window boundaries
```
Window A: 100 requests
Window B: 100 requests
Boundary: 100 + 100 = 200 requests in 1 second!
```

## Sliding Window Log

```javascript
const log = new Map(); // { "user:123": [ts1, ts2, ts3...] }

const rateLimit = (req, res, next) => {
  const key = `user:${req.user.id}`;
  const now = Date.now();
  const window = 60 * 1000; // 1 minute
  
  // Remove old requests outside window
  const userLog = log.get(key) || [];
  const filtered = userLog.filter(ts => now - ts < window);
  
  if (filtered.length >= 100) {
    return res.status(429).json({ 
      error: 'Rate limited',
      retryAfter: Math.ceil((filtered[0] + window - now) / 1000)
    });
  }
  
  filtered.push(now);
  log.set(key, filtered);
  next();
};
```

## Token Bucket Algorithm (Leaky Bucket)

```javascript
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;        // max tokens
    this.tokens = capacity;          // current tokens
    this.refillRate = refillRate;    // tokens/second
    this.lastRefill = Date.now();
  }
  
  refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + timePassed * this.refillRate
    );
    this.lastRefill = now;
  }
  
  consume(tokens = 1) {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }
}

const bucket = new TokenBucket(100, 10); // 100 tokens, 10/sec refill

const rateLimit = (req, res, next) => {
  if (bucket.consume(1)) {
    next();
  } else {
    res.status(429).json({ error: 'Rate limited' });
  }
};
```

## Distributed Rate Limiting (Redis)

```javascript
const redis = require('redis').createClient();

const rateLimit = async (req, res, next) => {
  const key = `ratelimit:${req.user.id}`;
  const limit = 100;
  const window = 60;
  
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window); // Must expire on first request
  }
  
  res.set('X-RateLimit-Limit', limit);
  res.set('X-RateLimit-Remaining', Math.max(0, limit - current));
  
  if (current > limit) {
    res.set('Retry-After', window);
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  next();
};
```
