# Setup Guide: Module 13 - Multi-tier Caching

## Prerequisites
- Node.js >= 16.0.0
- Redis server running on localhost:6379
- npm >= 8.0.0

## Quick Start

```bash
cd 13-multilevel-caching
npm install
npm start
```

Open: **http://localhost:6411**

## Understanding the Three Tiers

### L1: In-Memory Cache (Process-Local)
- **Speed**: 0.5ms average
- **Size**: Limited by RAM (100-500MB typical)
- **Scope**: Single process only
- **Use for**: Config, active sessions, lookup tables

### L2: Redis Cache (Distributed)
- **Speed**: 15ms average (network + operation)
- **Size**: 1-100GB typical
- **Scope**: Available to all servers
- **Use for**: API responses, expensive queries, temporary data

### L3: Database (Source of Truth)
- **Speed**: 100ms average (disk I/O + query)
- **Size**: Unlimited (terabytes)
- **Scope**: Single authoritative copy
- **Use for**: ALL persistent data

## API Endpoints

### Fetch Value (Multi-tier Lookup)
```bash
GET /api/value/:key
# Example: /api/value/user:1
# Returns: { value, source, latency }
```

### Get Statistics
```bash
GET /api/stats
# Returns hit ratios and latencies per tier
```

### Cache Contents
```bash
GET /api/cache/contents
# Returns items in L1 and L2
```

### Invalidate Key
```bash
POST /api/invalidate/:key
# Clears from L1 and L2
```

### Clear All
```bash
POST /api/cache/clear
# Clears L1 and L2, resets metrics
```

## Dashboard Features

### Control Panel
- **Select & Fetch**: Get any user or product
- **Invalidate**: Clear from all layers
- **Clear All**: Reset all caches and metrics
- **Auto-refresh**: Watch stats update in real-time every 1 second

### Cache Hierarchy Visualization
Shows the 3-tier structure and average latencies

### Statistics
- **L1 Hits/Misses**: In-memory cache performance
- **L2 Hits/Misses**: Redis cache performance
- **L3 Hits**: Database queries
- **Overall Hit Ratio**: % served from caches vs DB

### Cache Contents
View exactly what's stored in L1 and L2

## Testing Scenarios

### Scenario 1: Cold Start (All Misses)
1. Click "Clear All" to empty caches
2. Fetch user:1 → Goes to L3 (Database, ~100ms)
3. Value now cached in L1 and L2
4. Fetch same user:1 → L1 hit (~0.5ms)
5. Watch statistics show the improvement

### Scenario 2: L2 Fallback
1. Fetch product:101 (L1 + L2 populated)
2. Invalidate to clear L1 only
3. Fetch same product:101 → L2 hit (~15ms)
4. Automatically fills L1
5. Next fetch → L1 hit (~0.5ms)

### Scenario 3: Hit Ratio Evolution
1. Clear all caches
2. Fetch 5 different items
3. Fetch them again in same order
4. Watch hit ratio improve:
   - Start: 0% (all misses)
   - After repeat: 60% (second pass hits  L1/L2)
   - After stabilize: 80%+

### Scenario 4: Memory Management
1. Warm cache with multiple items
2. Watch L1 and L2 contents grow
3. See size limits in real-world systems

## Key Concepts to Understand

### Hit Ratio Interpretation
- **L1 Hit %**: Percentage of requests served from in-memory
- **L2 Hit %**: Percentage of L1-misses  served from Redis
- **Overall**: (L1 hits + L2 hits) / total requests

Example:
```
100 requests total:
- 70 hit L1 (70% L1 hit ratio)
- 20 hit L2 (80% L2 hit ratio, because 30 misses from L1)
- 10 hit L3 (DB)
- Overall hit ratio: 90%
```

### Latency Implications
```
Without multi-tier:
- All 100 requests hit Redis (10ms each)
- Total: 1000ms

With multi-tier:
- 70 × 0.5ms (L1) = 35ms
- 20 × 15ms (L2) = 300ms
- 10 × 100ms (L3) = 1000ms
- Total: 1335ms BUT:
  - 70% get 0.5ms response (happy!)
  - 20% get 15ms response (okay)
  - 10% get 100ms response (acceptable for rare cases)
```

## Metrics to Track

After testing, note:
- **L1 Hit Ratio**: Should be 60-80%
- **L2 Hit Ratio**: Should be 70-90% (of remaining)
- **Overall Hit Ratio**: Should be > 90%
- **Average Latency**: Should decrease with warm cache
- **L3 Hits**: Should be < 10% of total

## Real-World Examples

### E-commerce Product Catalog
- **L1**: Feature flags, current user (5MB)
- **L2**: Hot 1000 products (1GB)
- **L3**: All 1M products (500GB database)
- **Hit ratio goal**: > 95% (miss only for new products)

### Social Media Feed
- **L1**: Current user preferences (10MB)
- **L2**: Recent posts cache (10GB)
- **L3**: All posts ever created (1TB+ database)
- **Hit ratio goal**: 85% (feeds change frequently)

### Financial Transaction System
- **L1**: Current day aggregates (5MB)
- **L2**: Recent transaction summaries (100GB)
- **L3**: All transactions + audit trail (indefinite)
- **Hit ratio goal**: 70% (mostly fresh queries)

## Troubleshooting

### "L1 Hit Ratio is 0%"
- L1 cache is not being populated yet
- Fetch values to populate L1
- Enable auto-refresh to watch growth

### "L2 Hit Ratio is 0%"
- No values cleared from L1 yet
- Invalidate a key then fetch it again
- L2 will show hits when L1 misses

### "All requests hitting L3"
- Both L1 and L2 are empty
- Click "Clear All" to reset and verify
- Fetch values to populate both

### "Memory growing indefinitely"
- Real app would have max memory limits
- This demo has no eviction policy
- Implement LRU eviction in production

## Production Implementation

Key points for real systems:

1. **L1 TTL**: Short (1-5 minutes) for consistency
2. **L2 TTL**: Medium (10-60 minutes) for efficiency
3. **Eviction**: Use LRU/LFU for L1, let Redis handle L2
4. **Invalidation**: Must cascade through all tiers
5. **Warming**: Pre-populate L1 and L2 on startup

## Next Steps

✅ Understand 3-tier hierarchy benefits
✅ See latency improvement from caching
✅ Test various access patterns
✅ Calculate hit ratios for your workload
✅ Plan L1/L2/L3 separation for your app

**Next Module**: 14 - Consistent Hashing (distributed cache mapping)
