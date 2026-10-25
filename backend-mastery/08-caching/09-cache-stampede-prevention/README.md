# Module 09: Cache Stampede Prevention

## Overview

A **cache stampede** (also called "thundering herd") occurs when cached data expires and multiple requests simultaneously attempt to rebuild the cache, overwhelming the database. This module demonstrates three production-grade solutions to prevent stampedes.

## Learning Objectives

By completing this module, you will:
- Understand the cache stampede problem and its impact on system performance
- Learn the XFetch algorithm for probabilistic early expiration
- Master distributed locks for cache refresh coordination
- Implement stale-while-revalidate patterns for graceful degradation
- Simulate and stress-test cache scenarios with concurrent requests
- Choose the right strategy for different use cases

## The Problem: Thundering Herd

### Scenario
```
Cache TTL = 60 seconds
Cache expires at T=60
1000 requests arrive simultaneously at T=60
All 1000 miss the cache → All hit database
Database crashes under load
```

### Impact
- Database CPU spikes from 20% to 95%
- Response latency increases from 10ms to 5000ms
- User timeout rate jumps to 40%
- Cascading failures in downstream services

## Three Solutions

### 1. **XFetch: Probabilistic Early Refresh**
**Cost:** Low computational overhead  
**Benefit:** Smooth, distributed load  
**Best For:** High-traffic, read-heavy workloads

**How It Works:**
- Implement probabilistic expiration: `sleep(log(random()) / (-delta))`
- Instead of hard expiration at time T, items probability-based refresh
- Early refreshes are spread randomly across the TTL window
- When a request triggers refresh, only that request hits the database

**Code Pattern:**
```javascript
async function getDataXFetch(key, ttl = 60, delta = 10) {
  const cached = await redis.get(key);
  if (!cached) return fetchFresh();
  
  const probability = Math.exp(-delta * Math.random());
  const shouldRefresh = Math.random() < probability;
  
  if (shouldRefresh && Date.now() - timestamp > ttl * 1000) {
    // Refresh asynchronously
    refreshInBackground();
  }
  return JSON.parse(cached);
}
```

**Pros:**
- Minimal code changes
- Spreads load naturally over TTL window
- No coordination overhead
- Works great for distributed systems

**Cons:**
- Predictability: Early expiration may deliver slightly stale data
- Tuning delta requires benchmarking
- Less strict consistency guarantees

---

### 2. **Distributed Locks: Serialized Refresh**
**Cost:** Lock coordination overhead  
**Benefit:** Single database hit, strict coordination  
**Best For:** Expensive computations, critical data

**How It Works:**
- First request to expire data acquires a lock (SET NX)
- Requests wait for lock release (polling/blocking)
- Refresh completes, lock released, all requests use new cache
- Timeout prevents indefinite locks

**Code Pattern:**
```javascript
async function getDataWithLock(key, ttl = 60) {
  const cached = await redis.get(key);
  if (cached && !isExpired()) return cached;
  
  // Try to acquire lock
  const lockKey = `lock:${key}`;
  const lockAcquired = await redis.set(
    lockKey, 
    '1', 
    { EX: 10, NX: true }
  );
  
  if (lockAcquired) {
    // This request refreshes
    const data = await expensiveQuery();
    await redis.setex(key, ttl, JSON.stringify(data));
    await redis.del(lockKey);
    return data;
  } else {
    // Wait for refresh to complete
    for (let i = 0; i < 100; i++) {
      await sleep(50);
      const fresh = await redis.get(key);
      if (fresh) return JSON.parse(fresh);
    }
  }
}
```

**Pros:**
- Guaranteed single database hit
- Strict consistency (only one refresh at a time)
- No stale data served
- Works with expensive queries

**Cons:**
- Lock coordination latency
- Waiting threads block resources
- Deadlock risk if refresh fails
- Polling creates unnecessary Redis calls

---

### 3. **Stale-While-Revalidate: Graceful Degradation**
**Cost:** Serving stale data window  
**Benefit:** Always fast, background refresh  
**Best For:** User-facing content, real-time analytics

**How It Works:**
- Fresh cache: Serve immediately (0-30 seconds)
- Stale cache: Serve immediately + refresh in background (30-50 seconds)
- Beyond stale window: Block on refresh
- User always gets response within SLA

**Code Pattern:**
```javascript
async function getDataStaleWhileRevalidate(key, ttl = 60, maxStale = 20) {
  const cached = await redis.get(key);
  const age = Date.now() - timestamp;
  
  // Fresh
  if (age < ttl * 1000) {
    return { source: 'fresh', data: cached };
  }
  
  // Stale but within window - serve + refresh background
  if (age < (ttl + maxStale) * 1000) {
    setImmediate(async () => {
      const fresh = await expensiveQuery();
      await redis.setex(key, ttl, JSON.stringify(fresh));
    });
    return { source: 'stale-revalidating', data: cached };
  }
  
  // Beyond window - block on refresh
  const fresh = await expensiveQuery();
  await redis.setex(key, ttl, JSON.stringify(fresh));
  return { source: 'refreshed', data: fresh };
}
```

**Pros:**
- Fastest user perception (always serves from cache if available)
- Smooth performance profile
- Background refresh eliminates thundering herd
- Perfect for high-traffic pages

**Cons:**
- Temporary stale data served to users
- Requires eventual consistency tolerance
- More memory overhead (stale + fresh copies)
- Refresh race conditions possible

---

## Comparison Matrix

| Aspect | XFetch | Distributed Lock | Stale-While-Revalidate |
|--------|--------|------------------|------------------------|
| **DB Queries on Stampede** | Multiple (spread) | 1 | 1 + background |
| **User Latency** | 50-200ms | 50-5000ms (waiting) | <50ms always |
| **Implementation Complexity** | Low | Medium | Low-Medium |
| **Memory Overhead** | Minimal | Lock entries | 2x cache size |
| **Consistency** | Eventually (stale) | Strong | Eventually (stale window) |
| **Best Use Case** | Read-heavy, distributed | Expensive computations | User-facing content |
| **Horizontal Scaling** | Excellent | Good | Excellent |
| **Tuning Effort** | Medium (delta) | Low | Low (window size) |

---

## Real-World Scenarios

### E-commerce Product Catalog (Stale-While-Revalidate)
```
Product DB: 50ms query, ~100K products
Cache TTL: 60s, Stale window: 20s
Traffic at stampede: 500 req/s for product X
```
- **XFetch**: 250 DB hits over 10s window (acceptable)
- **Locks**: All 500 requests wait 100-500ms (bad UX)
- **Stale**: 500 requests in <50ms, 1 background refresh (best!)

**Winner:** Stale-While-Revalidate

### Financial Risk Calculation (Distributed Lock)
```
Risk query: 5 seconds computation, 1% error margin
Cache TTL: 5 minutes
Requirement: Consistency > speed
```
- **XFetch**: Risk of multiple parallel calculations (unacceptable)
- **Locks**: Single calculation, wait acceptable (< 5s) (perfect!)
- **Stale**: Stale risk calculation could lose millions (unacceptable)

**Winner:** Distributed Locks

### API Rate Limits (XFetch)
```
Rate limit key: per-user-minute
TTL: 60 seconds, 1M users active
Peak throughput: 10M req/s
```
- **XFetch**: Spread refreshes naturally, no coordination (perfect!)
- **Locks**: Lock contention at 10M/s, massive latency (bad)
- **Stale**: Stale limits allow extra requests (unacceptable)

**Winner:** XFetch

---

## Testing & Evaluation

### Single Request Test
```bash
# Test 1: Verify cache hit behavior
GET /api/xfetch?key=test1&ttl=60
# Returns: { source: "DB (fresh)", data: {...} }

# Test 2: Verify cache serves
GET /api/xfetch?key=test1&ttl=60
# Returns: { source: "Cache (fresh)", data: {...} }
```

### Stampede Simulation
```bash
# Simulate 10 concurrent requests at expiry
POST /api/xfetch
{ action: "stampede-simulation", count: 10 }

# Observe:
# - XFetch: All 10 responses within 50-200ms
# - Locks: 1 response <100ms, 9 responses with 100-500ms delay
# - Stale: All responses <50ms
```

### Metrics Collection
- DB Query Count: How many hit the database?
- Response Time p50/p99: Speed percentiles
- Max Concurrent DB Queries: Peak load
- Memory Consumption: Cache overhead

---

## Module Structure

```
09-cache-stampede-prevention/
├── theory.md              # This file
├── server.js              # Express backend (3 strategies)
├── App.jsx                # React interactive testing UI
├── index.js               # React entry point
├── App.css                # Styling
├── package.json           # Dependencies
├── .env.example           # Environment template
└── README.md              # This file
```

## Getting Started

### 1. Installation
```bash
cd 09-cache-stampede-prevention
npm install
cp .env.example .env
```

### 2. Prerequisites
- Node.js 16+
- Redis 6+ (running on localhost:6379)
- npm 8+

### 3. Development
```bash
npm start
# Backend running on http://localhost:6415
```

### 4. Frontend Testing
- Open browser to http://localhost:3000
- Navigate to module 09
- Test each strategy with interactive controls

### 5. Verification Checklist
- [ ] All three endpoints respond correctly
- [ ] Database query count is as expected
- [ ] Stampede simulation shows different patterns
- [ ] Response times match expectations
- [ ] Understand when each strategy is best

---

## Advanced: Production Deployment

### XFetch with Probabilistic Refresh
```javascript
// More sophisticated TTL calculation
const refreshingTTL = -(Math.log(Math.random()) / 10); // delta = 10
const effectiveTTL = Math.floor(baseTTL + refreshingTTL);
```

### Distributed Locks with Lua
```lua
-- Atomic lock acquire + release check
if redis.call('EXISTS', KEYS[1]) == 0 then
  return redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2], 'NX')
else
  return 0
end
```

### Stale-While-Revalidate with Cache Versioning
```javascript
// Prevent serving corrupted cache
const version = await redis.get(`${key}:version`);
if (version !== expectedVersion) {
  // Refresh immediately instead of serving stale
}
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Lock deadlock | Refresh fails, lock not released | Add TTL to locks, implement timeout |
| Excessive stale data | Stale window too large | Tune maxStale based on data volatility |
| Low cache hit ratio with XFetch | Delta too high | Reduce delta (higher refresh), collect metrics |
| Thundering herd still happens | No refresh mechanism | Ensure background refresh executes |

---

## Next Steps

1. Implement pattern in your own caching layer
2. Measure DB query reduction (target: 50-80% reduction)
3. Monitor cache hit ratios
4. Adjust parameters based on your traffic pattern
5. Combine strategies (e.g., locks for expensive queries + xfetch for others)

---

## References

- [Google: Breaking Bad Caches](https://docs.google.com/document/d/1S-4jtYkwDV-bnzN5RRDQcAGTtxKwrx4Pms7T-5Z_gP4/)
- [Mike Krieger: Thundering Herd](https://instagram-engineering.com/tagged/scaling)
- [RFC 5861: Cache-Control Extensions for Stale Content](https://tools.ietf.org/html/rfc5861)

---

**Author:** Backend Mastery  
**License:** MIT  
**Last Updated:** 2024
