# Module 11: Rate Limiting with Redis

## Overview

**Rate limiting** controls the rate of requests clients can make to your API, protecting against abuse, DDoS attacks, and resource exhaustion. Redis provides sub-millisecond rate limit checks that scale to millions of requests per second.

## The Problem: Why Rate Limiting Matters

### Without Rate Limiting
```
User A: 10,000 requests/second (bot attack)
User B: Normal usage
User C: 1 request every 10 seconds

Result:
- Server CPU: 95-100%
- Normal users wait 5+ seconds per request
- Database overload
- Service degradation
- Revenue impact
```

### With Rate Limiting
```
User A: Limited to 100 requests/minute
User B: Limited to 100 requests/minute
User C: No limit (within normal range)

Result:
- Server CPU: 45-60% (controlled)
- Normal users: <50ms response time
- Fair resource allocation
- Service stability
- SLA compliance
```

## Three Algorithms

### 1. **Token Bucket** (Most Flexible)

**How It Works:**
- Tokens added at fixed rate: `refillRate = capacity / refillPeriod`
- Client needs 1 token per request
- If no tokens available → request rejected
- Burst allowed up to capacity

**Math:**
```
Initial tokens: 100
Refill rate: 100 tokens / 60 seconds = 1.67 tokens/sec
Max tokens: 100 (capacity)

Timeline:
T=0s:   100 tokens, request 50 → 50 tokens remaining
T=10s:  50 + (1.67 * 10) = 66.7 tokens
T=30s:  100 (capped at max)
T=30s:  Request 200 → REJECTED (only 100 available)
```

**Pros:**
- Allows bursts up to capacity
- Handles variable traffic well
- Industry standard
- Fair to all users

**Cons:**
- More complex to implement
- Requires accurate time tracking
- Memory overhead

**Best For:**
- Public APIs
- Bursty traffic patterns
- Premium tier accounts (higher capacity)

**Implementation:**
```javascript
async function tokenBucket(userId, capacity = 100, refillRate = 60) {
  const key = `rate:token:${userId}`;
  const now = Date.now();
  
  let bucket = await redis.hGetAll(key);
  
  if (!bucket.lastRefill) {
    // First request
    bucket = { tokens: capacity, lastRefill: now };
  } else {
    // Calculate tokens to add
    const secondsPassed = (now - parseInt(bucket.lastRefill)) / 1000;
    const tokensToAdd = (secondsPassed / refillRate) * capacity;
    bucket.tokens = Math.min(capacity, parseFloat(bucket.tokens) + tokensToAdd);
    bucket.lastRefill = now;
  }
  
  if (bucket.tokens < 1) {
    return { allowed: false, remaining: 0 };
  }
  
  bucket.tokens -= 1;
  await redis.hSet(key, { tokens: bucket.tokens, lastRefill: bucket.lastRefill });
  
  return { allowed: true, remaining: Math.floor(bucket.tokens) };
}
```

---

### 2. **Sliding Window** (Most Accurate)

**How It Works:**
- Track timestamps of all requests in current window
- Window slides forward in time
- Remove old requests outside window
- Count requests in window

**Example (60-second window, 100 req/min limit):**
```
Window: [T-60s to T]

Request 1 at T=0s:  [0]  → 1 request, ALLOWED
Request 2 at T=10s: [0, 10] → 2 requests, ALLOWED
Request 3 at T=20s: [0, 10, 20] → 3 requests, ALLOWED
...
Request 101 at T=600s: [10-70s], 100 requests → REJECTED
Request 102 at T=610s: [20-80s], 99 requests → ALLOWED (T=0s left window)
```

**Pros:**
- Exact rate limiting (no burst overage)
- Fair distribution over time
- Easy to monitor
- No approximation

**Cons:**
- Memory overhead (store all timestamps)
- More expensive (list operations)
- Precision issues at boundaries

**Best For:**
- Strict quotas
- Financial transactions
- Regulatory compliance (PSD2, HIPAA)

**Implementation:**
```javascript
async function slidingWindow(userId, limit = 100, windowSeconds = 60) {
  const key = `rate:sliding:${userId}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  
  // Remove requests outside window
  await redis.zRemRangeByScore(key, 0, windowStart);
  
  // Count requests in window
  const count = await redis.zCard(key);
  
  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  // Add current request
  await redis.zAdd(key, { score: now, member: `${now}-${Math.random()}` });
  await redis.expire(key, windowSeconds);
  
  return { allowed: true, remaining: limit - count - 1 };
}
```

---

### 3. **Fixed Window** (Simplest & Fastest)

**How It Works:**
- Divide time into fixed buckets (minute, hour)
- Count requests in current bucket
- Reset count at bucket boundary
- If count ≥ limit → reject

**Example (60-second window, 100 req/min):**
```
Minute 0 (0-60s):
  T=10s: Request 1 → 1 in bucket → ALLOWED
  T=30s: Request 2 → 2 in bucket → ALLOWED
  T=50s: Request 100 → 100 in bucket → ALLOWED
  T=55s: Request 101 → 101 would exceed → REJECTED
  
Minute 1 (60-120s):
  T=65s: Request 1 → 1 in NEW bucket → ALLOWED (counter reset)
```

**Pros:**
- Simplest implementation
- Fastest (single key read/increment)
- Lowest memory usage
- Standard HTTP 429 headers

**Cons:**
- Burst at boundaries (100 req at T=59s, 100 at T=60s = 200 in 2s)
- Less precise
- Can exhaust quota early in period

**Best For:**
- Lightweight rate limiting
- High-traffic endpoints
- Public APIs (generous limits)
- Mobile apps

**Implementation:**
```javascript
async function fixedWindow(userId, limit = 100, windowSeconds = 60) {
  const key = `rate:fixed:${userId}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
  
  const count = await redis.incr(key);
  
  if (count === 1) {
    // First request in window, set expiration
    await redis.expire(key, windowSeconds);
  }
  
  if (count > limit) {
    return { allowed: false, remaining: 0 };
  }
  
  return { allowed: true, remaining: limit - count };
}
```

---

## Real-World Scenarios

### Scenario 1: **Public API with Premium Tiers** (Token Bucket)
```
Free tier: 100 req/min, burst up to 10
Pro tier: 1000 req/min, burst up to 100
Enterprise: 10,000 req/min, burst up to 1000

User can make quick burst (e.g., batch upload) then throttled to sustained rate
```

### Scenario 2: **Financial API** (Sliding Window)
```
Money transfer: 10 transfers/day (exact)
Login attempts: 5 failed attempts/30min (exact)
Password reset: 1 request/60min (exact)

Regulatory requirement: Must be precise, no burst exploitation
```

### Scenario 3: **Public Web API** (Fixed Window)
```
Endpoint: GET /api/search
Limit: 30 requests/minute per IP
Purpose: Prevent abuse, fair access

At T=59s: 30 requests counted
At T=60s: Counter resets, allows 30 more
```

---

## Distributed Rate Limiting

### Single Server (Not Scalable)
```
User A → Server 1 (rate limiter)
User B → Server 2 (separate counter)
User A → Server 1 (100 req counted)
User A → Server 2 (100 req counted separately)
Result: 200 req allowed, exceeds 100/min limit!
```

### With Redis (Works Across Servers)
```
User A → Server 1 → Redis (checks shared counter)
User B → Server 2 → Redis (checks shared counter)
User A → Server 1 → Redis (same counter incremented)
User A → Server 2 → Redis (same counter incremented)
Result: Counter shared, accurate limit across all servers!
```

---

## Response Headers (HTTP Standard)

All rate limiters should return standard headers:

```
RateLimit-Limit: 100          # Requests per period
RateLimit-Remaining: 42       # Requests left in period
RateLimit-Reset: 1640000000   # Unix timestamp when limit resets
Retry-After: 35               # Seconds to wait before retry (on 429)
```

**Example Response:**
```
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1640000035
Retry-After: 35

{
  "error": "Rate limit exceeded",
  "message": "100 requests per minute. Try again in 35 seconds."
}
```

---

## Tiered Rate Limiting

### By User ID (Authenticated)
```
POST /api/session-rolling → limit: 10/min
GET /api/user/profile → limit: 100/min
GET /api/search → limit: 30/min
```

### By IP Address (Anonymous)
```
User not authenticated → use IP address
200.100.50.5 → limit: 10/min (stricter)
100.100.100.100 → limit: 10/min
```

### By Path
```
Public endpoint → 100/min per IP
Private endpoint → 10/min per IP
API key endpoint → 1000/min per key
```

---

## DDoS Protection Example

```javascript
// Strict rate limit for login attempts
const loginLimiter = rateLimit({
  key: `rate:login:${req.ip}`,  // Per IP
  limit: 5,
  period: 900  // 15 minutes
});

app.post('/api/login', loginLimiter, async (req, res) => {
  // Process login...
});

// Results:
// IP attacks with login bruteforce → blocked after 5 attempts
// Prevents 10K+ attempts in 15 minutes
// Account lockout protection
```

---

## Monitoring Rate Limit Events

```javascript
app.use((req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (res.statusCode === 429) {
      logger.warn('Rate limit exceeded', {
        userId: req.user?.id,
        ip: req.ip,
        path: req.path,
        limit: res.getHeader('RateLimit-Limit'),
        remaining: res.getHeader('RateLimit-Remaining')
      });
    }
    return originalJson.call(this, data);
  };
  
  next();
});
```

---

## Performance Comparison

| Algorithm | Per-Request Cost | Memory | Accuracy | Burst |
|-----------|-----------------|--------|----------|-------|
| **Fixed Window** | O(1) | Minimal | 80% | ⭐⭐⭐ |
| **Token Bucket** | O(1) | Low | 95% | ⭐⭐ |
| **Sliding Window** | O(N) | High | 100% | ⭐ |

### Benchmark (1M requests/sec)
- Fixed Window: <1ms per request
- Token Bucket: 1-2ms per request
- Sliding Window: 5-10ms per request

### Memory for 1M users
- Fixed Window: 10MB
- Token Bucket: 50MB
- Sliding Window: 500MB+

**Recommendation:** Use Fixed Window for high traffic, Token Bucket for fairness, Sliding Window for precision.

---

## Common Patterns

### Pattern 1: Tiered by Role
```javascript
const limits = {
  free: { perMinute: 10, perHour: 100 },
  pro: { perMinute: 100, perHour: 10000 },
  enterprise: { perMinute: unlimited, perHour: unlimited }
};
```

### Pattern 2: Endpoint-Specific
```javascript
// Search: expensive
GET /api/search → 5/min

// Read: cheap
GET /api/items → 100/min

// Write: moderate cost
POST /api/items → 20/min
```

### Pattern 3: Grace Period
```javascript
// Allow burst immediately, then throttle
const bucket = tokenBucket(userId, capacity = 10, refillRate = 0.1/sec);
// User can do 10 requests immediately, then 1 every 10 seconds
```

---

## Module Structure

```
11-rate-limiting/
├── theory.md              # This file + algorithms
├── server.js              # Express with 3 algorithms
├── App.jsx                # React interactive testing
├── index.js               # React entry point
├── App.css                # Styling
├── package.json           # Dependencies
├── .env.example           # Environment variables
├── index.html             # HTML entry point
├── README.md              # Quick reference
├── setup.md               # Installation guide
└── checklist.md           # Learning objectives
```

---

## References

- RFC 6585: HTTP Status Code 429
- Auth0 Rate Limiting Guide
- Stripe API Rate Limits
- AWS WAF Rate Rules

---

**Author:** Backend Mastery  
**Level:** Intermediate  
**Time to Complete:** 2-3 hours  
**Last Updated:** 2024
