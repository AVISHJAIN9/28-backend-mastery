# README: Module 13 - Multi-tier Caching

## Overview

Learn how to optimize cache performance using **three cache levels**: L1 (in-memory), L2 (Redis), and L3 (database).

### What You'll Learn
- ✅ When to use each cache tier
- ✅ Request routing through hierarchy
- ✅ Hit ratio calculations per tier
- ✅ Invalidation patterns
- ✅ Real-world trade-offs

## Quick Start

```bash
cd 13-multilevel-caching
npm install
npm start
```

Open: **http://localhost:6411**

## The Problem Multi-tier Solves

### Single-tier (Redis Only)
```
10,000 requests/sec to Redis
- 10ms per request
- Network overhead
- 100ms of total latency
- Cost: expensive Redis hardware
```

### Multi-tier (L1+L2+L3)
```
Same 10,000 requests:
- 7,000 hit L1 (0.5ms) → 3500ms total
- 2,500 hit L2 (15ms) → 37,500ms total
- 500 hit L3 (100ms) → 50,000ms total
- TOTAL: 91,000ms BUT:
  - P50 latency: 0.5ms (most users)
  - P95 latency: 15ms (okay)
  - P99 latency: 100ms (rare)
```

## Three Cache Levels

### L1: In-Memory Cache
**What**: Local JavaScript Map in application process  
**Speed**: 0.5-1ms  
**Size**: 100-500MB (process memory)  
**Use for**: Config, current user, feature flags  

```javascript
const L1Cache = new Map();
L1Cache.set('config:app', { ... });
```

### L2: Distributed Cache (Redis)
**What**: Central Redis instance or cluster  
**Speed**: 10-50ms (network)  
**Size**: 1-100GB  
**Use for**: API responses, expensive queries  

```javascript
await redis.set('user:123', JSON.stringify(data), { EX: 3600 });
```

### L3: Database
**What**: PostgreSQL, MongoDB, etc.  
**Speed**: 50-500ms  
**Size**: Unlimited  
**Use for**: Persistent storage, source of truth  

## Lookup Flow (Cache-Aside Pattern per Level)

```javascript
async function getValue(key) {
  // Try L1 first (fastest)
  if (L1Cache.has(key)) {
    return L1Cache.get(key);  // 0.5ms
  }
  
  // Try L2 next (medium)
  const value = await redis.get(key);
  if (value) {
    L1Cache.set(key, value);
    return value;  // 15ms
  }
  
  // Try L3 finally (slowest, source of truth)
  const dbValue = await database.get(key);
  if (dbValue) {
    await redis.set(key, dbValue, { EX: 3600 });
    L1Cache.set(key, dbValue);
    return dbValue;  // 100ms
  }
  
  return null;  // Not found anywhere
}
```

## Hit Ratio Explained

**Hit Ratio = (Hits in tier) / (Requests to tier)**

### Example: 100 Requests
```
Request 1-10: All miss L1 → Check L2
├─ Hit L2: Requests 6-10 (50%)  → Copy to L1
├─ Miss L2: Requests 1-5 (50%) → Check L3
   └─ Hit L3: All 5 found (100%)

After 10 requests:
- L1 hit ratio: 0% (fresh start)
- L2 hit ratio: 50% (requests 6-10)
- L3 hit ratio: 100% (all database queries succeed)

Request 11-20: L1 now has some data
├─ Hit L1: Requests 11-19 (90%)  → 9 hits
├─ Miss L1: Request 20 (10%)     → Check L2
   └─ Hit L2: Found (100%)

After 20 requests:
- L1 hit ratio: 90% (9 out of 10 new requests)
- L2 hit ratio: improved
- Overall hit ratio: 98% (only 1 DB hit)
```

## Key Metrics

| Metric | Target | Why |
|--------|--------|-----|
| L1 Hit Ratio | 60-80% | Fast responses |
| L2 Hit Ratio | 70-90% | Low DB load |
| Overall Hit Ratio | > 90% | System efficiency |
| L3 Requests | < 10% | Fewer expensive queries |

## When to Use Multi-tier

### Use Multi-tier If:
- ✅ High QPS (> 10k/sec)
- ✅ Expensive L2 operations
- ✅ Clear hot/cold data split
- ✅ Have data you access repeatedly

### Use Single-tier (L2 Only) If:
- ❌ Low traffic (< 1k/sec)
- ❌ All data equally likely
- ❌ Need consistency
- ❌ Memory-constrained

## Invalidation Patterns

### Cascade Invalidation
When data changes, clear all tiers:

```javascript
async function invalidateKey(key) {
  L1Cache.delete(key);          // Clear L1
  await redis.del(key);          // Clear L2
  // L3 already updated
}
```

### Selective Invalidation
Clear only affected tiers:

```javascript
async function invalidateUser(userId) {
  // Only invalidate user data
  const key = `user:${userId}`;
  L1Cache.delete(key);
  await redis.del(key);
  // Leave other users cached
}
```

## Real-World Scenarios

### E-commerce Search
```
User searches for "laptop"

Request 1-100 on new search:
- L1 miss (first search)
- L2 miss (new result set)
- L3 hit (full database search)
- Store in L2 (10 min TTL)

Request 101-200, same search:
- L2 hit (cached result)
- Return from Redis (no L3 query)
- Copy to L1 if space

Result: 99% hit ratio after warmup
```

### User Profile Access
```
User A accesses own profile 100 times/sec:
- Request 1: L1 miss → L2 miss → L3 hit
- Requests 2-100: L1 hits (99% hit ratio)

User B accesses User A's profile:
- L1 miss (different process)
- L2 hit (shared Redis)
- Copy to User B's L1

Result: 90% L1 + 10% L2 = 100% cache hit
```

## Performance Impact

```
Cold Cache (No tier hits):
P50:  50ms (L3 every request)
P95:  100ms
P99:  200ms

Warmed Cache (Multi-tier):
P50:  0.5ms (L1 hits)
P95:  15ms (L2 hits)
P99:  100ms (L3 rare)

Improvement: 100x P50, 7x P99
```

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Too much in L1 | OOM, slow startup | Limit to 100-200MB |
| Same TTL everywhere | Misses cluster | Vary TTL: L1<L2<L3 |
| No invalidation | Stale data | Cascade all tiers |
| L1 not thread-safe | Race conditions | Use thread-safe structures |
| Warming all data | Startup slow | Warm only hot 20% |

## Production Checklist

- [ ] Identify hot data (to keep in L1)
- [ ] Size L1 appropriately (memory available)
- [ ] Set different TTLs per tier
- [ ] Implement invalidation cascade
- [ ] Monitor hit ratios
- [ ] Test eviction behavior
- [ ] Plan for L1 restart impact
- [ ] Document tier strategy

## Next Steps

1. ✅ Understand the 3-tier hierarchy
2. ✅ Test different access patterns
3. ✅ Calculate hit ratio improvements
4. ✅ Measure latency P50/P95/P99
5. ✅ Plan tiering for your application

**Module 14**: Consistent Hashing (distributed cache mapping)  
**Module 15**: Negative Caching (caching failures)

See Also:
- [Cache-Aside Pattern](../02-cache-aside-pattern) - Single tier basics
- [Cache Warming](../12-cache-warming) - Preload L1 and L2
