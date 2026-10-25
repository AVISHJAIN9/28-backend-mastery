# Checklist: Module 13 - Multi-tier Caching

## Learning Objectives
- [ ] Understand L1, L2, L3 characteristics (speed, size, scope)
- [ ] Learn when to use each tier
- [ ] Calculate hit ratios per tier
- [ ] Implement hierarchical lookup
- [ ] Design invalidation strategy

## Dashboard Testing
- [ ] Fetch a value and note which tier it comes from
- [ ] Check latency for each tier
- [ ] Monitor hit/miss counts
- [ ] Enable auto-refresh and watch stats update
- [ ] Test all three access paths (L1→L2→L3)

## Tier Deep Dive

### L1: In-Memory Cache
- [ ] Understand process-local nature (not shared)
- [ ] See latency: ~0.5ms
- [ ] Trace L1Cache Map in server.js
- [ ] Understand TTL management
- [ ] Identify what's appropriate for L1

### L2: Redis Cache
- [ ] Understand distributed nature (all servers share)
- [ ] See latency: ~15ms (network + operation)
- [ ] Compare L1 vs L2 speed (30x difference)
- [ ] See multiple items cached together
- [ ] Understand TTL: 1 hour

### L3: Database
- [ ] Understand source of truth role
- [ ] See latency: ~100ms (simulated)
- [ ] Trace queryDatabase() simulator
- [ ] See when L3 hits occur
- [ ] Understand why L3 is avoided

## Access Pattern Scenarios

### Scenario 1: Cold Start (All Misses)
- [ ] Clear all caches
- [ ] Fetch first value → L3 hit
- [ ] Check latency: ~100ms
- [ ] Verify item now in L1 and L2
- [ ] Fetch same value again → L1 hit
- [ ] See latency drop: ~0.5ms

### Scenario 2: L2 Fallback
- [ ] Fetch value (L1 + L2 populated)
- [ ] Invalidate to clear L1 only
- [ ] Fetch same value → L2 hit
- [ ] Check latency: ~15ms (between L1 and L3)
- [ ] Verify value copied back to L1
- [ ] Next fetch: L1 hit again

### Scenario 3: Hit Ratio Evolution
- [ ] Clear all, reset metrics
- [ ] Fetch 10 different items
- [ ] Watch hit ratio at each tier
- [ ] Repeat same 10 items
- [ ] See overall hit ratio improve
- [ ] Calculate (L1 hits + L2 hits) / total

### Scenario 4: Concurrent Access
- [ ] Warm cache with several items
- [ ] Fetch many items in sequence
- [ ] Watch L1 fill up (limited size)
- [ ] See older items evicted if needed
- [ ] L2 acts as "spill over" for L1

## Code Analysis

### server.js Structure
- [ ] Find L1Cache = new Map()
- [ ] Trace getValueMultiTier() function
- [ ] See L1 lookup first
- [ ] See L2 awaited next
- [ ] See L3 queried as fallback
- [ ] Understand metric tracking

### Hit Ratio Calculation
- [ ] Find calculateHitRatio() function
- [ ] Understand: hits / (hits + misses)
- [ ] Trace per-tier calculations
- [ ] See overall hit ratio formula

### Invalidation Logic
- [ ] Find invalidateKey() function
- [ ] See L1 delete
- [ ] See L2 delete
- [ ] Understand cascading
- [ ] See metrics not reset

## Metrics Deep Dive

### Per-Tier Understanding
- [ ] L1: What % of requests hit in-memory?
- [ ] L2: What % of L1-misses hit Redis?
- [ ] L3: How many actual DB queries?
- [ ] Overall: % served from cache

### Target Hit Ratios
- [ ] L1 target: 60-80%
- [ ] L2 target: 70-90% (of remaining)
- [ ] Overall target: > 90%
- [ ] L3 target: < 10% of total

### Latency Interpretation
- [ ] Understand P50/P95/P99 percentiles
- [ ] L1 latency: Always ~0.5ms
- [ ] L2 latency: Consistent ~15ms
- [ ] L3 latency: High ~100ms
- [ ] Average: Weighted by hit ratio

## Real-World Analysis

### E-commerce Product
- [ ] Estimate product request volume
- [ ] Which products go to L1? Top 100
- [ ] Which to L2? Top 10,000
- [ ] Rest go to L3 (database)
- [ ] Calculate expected hit ratio

### Social Media Feed
- [ ] User profile → L1 (changing slowly)
- [ ] Feed results → L2 (cached 10 min)
- [ ] Individual posts → L3 (look up)
- [ ] Understand cache invalidation on new post
- [ ] See cascade effect on followers

### API Cache
- [ ] Popular endpoints → L1
- [ ] Medium traffic → L2
- [ ] Tail → L3
- [ ] Version-based invalidation
- [ ] Feature flag control

## Performance Testing

- [ ] Measure L1 latency (should be 0.5ms)
- [ ] Measure L2 latency (should be 15ms)
- [ ] Measure L3 latency (should be 100ms)
- [ ] Calculate hit ratio after 10 fetches
- [ ] Calculate hit ratio after 100 fetches
- [ ] Compare cold vs warm cache

## Implementation Exercise

### Basic: Multi-tier Scaffold
- [ ] Create L1, L2, L3 placeholders
- [ ] Implement lookup order
- [ ] Track which tier served request
- [ ] Return tier info to caller

### Intermediate: Hit Ratio Tracking
- [ ] Add hits/misses counters
- [ ] Calculate per-tier hit ratios
- [ ] Calculate overall hit ratio
- [ ] Show improvement over time
- [ ] Identify bottleneck layer

### Advanced: Eviction Management
- [ ] Set L1 max size (100MB)
- [ ] Implement LRU eviction
- [ ] Track evicted items
- [ ] Monitor L1 hit ratio impact
- [ ] Tune size for your workload

## Integration Points

- [ ] Connect with cache warming (module 12)
- [ ] Uses cache-aside pattern (module 02)
- [ ] Relates to invalidation (module 03)
- [ ] Coordinates with stampede prevention (module 09)

## Summary Questions

- [ ] When would you prefer single-tier over multi-tier?
- [ ] What's the memory-latency trade-off for L1?
- [ ] Why is L2 hit ratio often lower than L1?
- [ ] How do you decide data split across tiers?
- [ ] What happens if L1 evicts frequently?
- [ ] How much faster is L1 vs L2 vs L3?
- [ ] What's your target overall hit ratio?

## Next Module Preview

**Module 14: Consistent Hashing**
- Hash-based key mapping
- Minimal redistribution on node change
- Virtual nodes for load balance
-  Distributed cache across multiple Redis nodes
