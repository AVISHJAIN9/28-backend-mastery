# README: Module 12 - Cache Warming

## Overview

Learn **cache warming strategies** to eliminate cold-start performance problems and prevent "thundering herd" when your cache expires.

### What You'll Learn
- ✅ Startup preloading techniques
- ✅ Scheduled refresh patterns (background tasks)
- ✅ Lazy warming (proactive reheating before expiry)
- ✅ Warm-on-deploy strategies
- ✅ Performance impact (50x faster with warming)

## Quick Start

```bash
cd 12-cache-warming
npm install
npm start
```

Open: **http://localhost:6410**

## Core Concepts

### The Cold Cache Problem ❌
```
New deployment or cache restart:
User 1 → DB (slow) → 500ms
User 2 → DB (overloaded) → 2000ms
User 3 → DB (locked) → 5000ms
RESULT: Cascading failures
```

### Cache Warming Solution ✅
```
Preload critical data at startup:
User 1 → Cache HIT → 10ms
User 2 → Cache HIT → 10ms
User 3 → Cache HIT → 10ms
RESULT: Fast, reliable responses
```

## Warming Strategies

### 1. **Startup Preloading** (Best for small datasets)
Load all critical data when app boots
- **Use when**: Data is small & essential
- **TTL**: 1-2 hours
- **Trade-off**: Long startup, guaranteed availability

### 2. **Scheduled Refresh** (Best for slow-changing data)
Periodically reload data (every N minutes)
- **Use when**: Data changes slowly
- **TTL**: 2-4 hours
- **Trade-off**: No startup delay, may warm unused data

### 3. **Lazy Warmer** (Best for edge cases)
Reheat data near expiry while serving stale
- **Use when**: Always want fresh data
- **TTL**: Auto-refreshed when < 10 min left
- **Trade-off**: Background load, brief staleness

### 4. **Warm-on-Deploy** (Best for controlled rollouts)
Special warming during blue-green deploys
- **Use when**: Blue-green deployments
- **TTL**: Custom per intensity level
- **Trade-off**: Adds deployment time

## Key Metrics

| Metric | Target | Why |
|--------|--------|-----|
| **Warm-up Duration** | < 30s | Startup experience |
| **Hit Rate (5m)** | > 70% | User performance |
| **Coverage** | 80% of traffic | Efficiency |  
| **Memory Usage** | < 60% | Cost control |

## Real-World Scenario

**E-commerce Platform at 2am**
```
Without warming:
- Deploy new cache
- First search query (product:101) → Cache miss
- 100 concurrent users hit same miss
- All 100 hit database simultaneously
- Database overloaded → response time 5000ms
- Cascading failures

With startup warming:
- Deploy new cache
- Startup preloading runs (30s)
- First search query → Cache hit from preload
- Response time: 10ms
- Zero impact to users
```

## API Reference

### Warming Operations
```bash
# Trigger startup preloading
POST /api/cache/warm/startup

# Clear cache (for testing)
POST /api/cache/clear

# Get cache status
GET /api/cache/status

# Fetch item with TTL
GET /api/item/user:1
GET /api/item/product:101
```

### Response Examples
```json
// GET /api/item/user:1
{
  "data": {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com"
  },
  "ttl": 3598,
  "source": "cache"
}

// GET /api/cache/status
{
  "totalKeys": 11,
  "userKeys": 11,
  "memory": "used_memory_human: 150K"
}
```

## Testing Guide

### Quick Test: See Cold vs Warm
1. **Clear cache** (click button)
2. **Fetch product:101** - Notice it says "loading"
3. **Warm cache** (click button) 
4. **Fetch product:101 again** - Instant response

### Test Scheduled Refresh
1. Warm cache
2. Wait 5 minutes
3. Check activity log for "Refreshing product cache..."
4. Products automatically reloaded

### Monitor Real-Time
- Check **Cache Status** box with auto-refresh ON
- Watch keys & memory update
- See current TTLs

## Why Cache Warming Matters

### Problem it Solves: Thundering Herd
When cache misses expire simultaneously:
- Popular key expires → 1000 concurrent requests
- All hit database at once
- Database can't handle load
- Cascading failure across system

### Solution it Provides
- Pre-populate cache before users arrive
- Stagger refreshes so not all expire together
- Serve stale data while reheating
- Prevent database overload

## Common Mistakes & How to Avoid

| Mistake | Impact | Fix |
|---------|--------|-----|
| No warming at all | 50x slower cold start | Implement startup preloading |
| Warming too much data | High memory, long startup | Warm only hot 20% of data |
| Same TTL for all | Thundering herd | Stagger TTLs by data type |
| No scheduled refresh | Stale data grows | Add periodic background refresh |
| Warming in critical path | Blocks user requests | Warm asynchronously |

## Performance Impact

 ```
Cold Cache Scenario:
Requests/sec: 10 (DB limited)
Response time: 500-5000ms
Error rate: 5%

Warmed Cache Scenario:
Requests/sec: 1000+ (Cache hits)
Response time: 10-50ms
Error rate: 0%

Improvement: 100x throughput, 50x latency reduction
```

## Production Checklist

- [ ] Identify which data to warm (top 20% of keys)
- [ ] Calculate warming dataset size
- [ ] Set appropriate TTLs per data type
- [ ] Implement startup preloading
- [ ] Add scheduled refresh job
- [ ] Monitor cache hit rate
- [ ] Test deployment (simulate restart)
- [ ] Set memory alerts
- [ ] Document warming strategy
- [ ] Train team on strategy

## Next Steps

1. ✅ Run the dashboard and try all warming strategies
2. ✅ Understand trade-offs of each approach  
3. ✅ Modify warm dataset to include only top items
4. ✅ Test with cleared cache to see impact
5. ✅ Implement startup warming in your app

**Module 13**: Multi-tier Caching (L1/L2/L3 hierarchy)  
**Module 14**: Consistent Hashing (distributed cache mapping)  
**Module 15**: Negative Caching (caching failures)

## See Also

- [Cache-Aside Pattern](../02-cache-aside-pattern) - Lazy loading
- [Stampede Prevention](../09-cache-stampede-prevention) - XFetch & Locks
- [Rate Limiting](../11-rate-limiting) - Token bucket with warmth
