# Checklist: Module 12 - Cache Warming

## Learning Objectives
- [ ] Understand why cache warming prevents "thundering herd"
- [ ] Learn 4 different warming strategies
- [ ] Compare trade-offs (startup time vs coverage)
- [ ] Implement warming in your own applications

## Dashboard Testing
- [ ] Warm cache using "Warm Cache (Startup)" button
- [ ] Monitor cache status (keys, memory)
- [ ] Fetch items from dropdown list
- [ ] Observe TTL decreasing over time
- [ ] Clear cache and fetch (simulate cold miss)
- [ ] Enable auto-refresh and watch live updates

## Strategy Deep Dive

### Startup Preloading
- [ ] Understand cold start problem
- [ ] Trace warmCacheStartup() in server.js
- [ ] Calculate warm-up time
- [ ] Check memory after warming
- [ ] Identify pros: guaranteed availability
- [ ] Identify cons: long startup, memory overhead

### Scheduled Refresh
- [ ] Find setInterval() for 5-minute refresh
- [ ] Watch activity log for refresh messages
- [ ] Understand background reload pattern
- [ ] Identify use cases: slow-changing data
- [ ] See how it prevents stale-ness

### Lazy Warmer
- [ ] Trace lazyWarmData() in server.js
- [ ] Understand TTL checking logic
- [ ] See background reheat in action
- [ ] Identify pros: reduces impact of expiry
- [ ] Identify cons: complexity

### Warm-on-Deploy (Code Study)
- [ ] Find warmOnDeploy() function signatures
- [ ] Understand intensity levels: full/standard/minimal
- [ ] See how to customize warming dataset
- [ ] Identify use cases: blue-green deploys

## API Testing

### Using curl or Postman
```bash
# Test 1: Get database stats
curl http://localhost:6410/api/database/stats

# Test 2: Warm cache
curl -X POST http://localhost:6410/api/cache/warm/startup

# Test 3: Get cache status
curl http://localhost:6410/api/cache/status

# Test 4: Fetch specific item
curl http://localhost:6410/api/item/user:1
curl http://localhost:6410/api/item/product:101

# Test 5: Get all cached items
curl http://localhost:6410/api/cache/all

# Test 6: Clear cache
curl -X POST http://localhost:6410/api/cache/clear
```

## Code Walkthrough

### server.js File Structure
- [ ] Locate mock database (db object)
- [ ] Find queryDatabase() simulator
- [ ] Trace warmCacheStartup() execution
- [ ] See scheduleRefresh() interval
- [ ] Find lazyWarmData() lazy loading logic
- [ ] Understand Redis operations (set, get, ttl)

### App.jsx Functionality
- [ ] Understand state management (cacheStatus, itemData, log)
- [ ] See fetchCacheStatus() periodic updates
- [ ] Trace fetchItem() with lazy warming
- [ ] Find triggerWarmup() button handler
- [ ] See clearCache() functionality
- [ ] Understand activity logging

## Real-World Analysis

### Scenario 1: E-commerce Cold Restart
- [ ] Estimate data size: 1M products × 1KB = 1GB
- [ ] Calculate warm-up time at 10MB/s = 100s (too long!)
- [ ] Solution: Warm only top 1% = 100MB = 10s
- [ ] Implement selective warming logic

### Scenario 2: API Service Deployment
- [ ] Identify critical data endpoints
- [ ] Measure current response times
- [ ] Warm cache before marking healthy
- [ ] Compare response times before/after

### Scenario 3: Traffic Spike
- [ ] Study how warming prevent stampede
- [ ] Calculate DB overload without warming
- [ ] Verify warming reduces peak load
- [ ] See improvement in p99 latency

## Performance Testing

- [ ] Measure warm-up duration
- [ ] Check memory usage after warming  
- [ ] Monitor cache hit rate
- [ ] Test with cleared cache (cold)
- [ ] Compare speed: cold vs warm
- [ ] Calculate improvement factor

## Implementation Exercise

### Basic: Add warming to your app
- [ ] Create warmCache() function
- [ ] Call on app startup
- [ ] Verify data loads before first request

### Intermediate: Selective warming
- [ ] Warm only "hot" data (frequent access)
- [ ] Implement frequency tracking
- [ ] Auto-select top 80% of keys

### Advanced: Distributed warming
- [ ] Partition data across multiple nodes
- [ ] Each node warms its shard
- [ ] Implement hash-based sharding
- [ ] Test failover behavior

## Metrics & Monitoring

Track these after implementation:
- [ ] Warm-up duration (target: < 30s)
- [ ] Cache hit rate first 5 minutes (target: > 70%)
- [ ] Memory utilization (target: < 60%)
- [ ] Items warmed ratio (coverage %)

## Common Gotchas

- [ ] Warming too much data → OOM
- [ ] Warming in request path → slow startup
- [ ] No TTL adjustment → cache skew
- [ ] Warming stale data → inconsistency
- [ ] Missing error handling → silent failures

## Integration Points

- [ ] Works with cache-aside pattern from module 02
- [ ] Coordinates with TTL strategy from module 10
- [ ] Relates to stampede prevention from module 09
- [ ] Complements session management from module 10

## Summary Questions

- [ ] Why does cache warming prevent "thundering herd"?
- [ ] What's the difference between startup vs scheduled warming?
- [ ] When would you use lazy warming over startup warming?
- [ ] How do you decide which data to warm?
- [ ] What are the memory trade-offs?
- [ ] How do you monitor successful warming?
-  [ ] Is warming always beneficial? (When is it not?)

## Next Module Preview

**Module 13: Multi-tier Caching**
- L1 Cache: In-memory (process)
- L2 Cache: Distributed (Redis)
- L3 Cache: Database layer
- Request routing through hierarchy
- Hit ratio monitoring per tier
