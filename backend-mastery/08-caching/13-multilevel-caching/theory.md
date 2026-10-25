# Multi-tier Caching: Theory & Concepts

## What is Multi-tier Caching?

Multi-tier caching (also called **cache hierarchy** or **cache levels**) uses multiple cache layers with different characteristics to optimize both speed and cost.

### The Cache Hierarchy

```
Request comes in...
  ↓
L1 Cache (In-Memory) - FASTEST but limited
  ↓ Miss → 
L2 Cache (Redis) - MEDIUM speed, large capacity
  ↓ Miss → 
L3 Cache (Database) - SLOWEST, source of truth
  ↓
Response sent back, populated up the chain
```

### Real Numbers

```
L1 In-Memory:  0.1ms  | 100 MB  | Process-local
L2 Redis:      10ms   | 10 GB   | Single machine or cluster
L3 Database:   100ms  | 1 TB+   | Persistent, authoritative
```

---

## Why Multi-tier Caching?

### Problem 1: Redis Not Fast Enough
Redis hits over network (~10ms) become bottleneck under high load. Solution: Add in-memory layer.

### Problem 2: Cost vs Speed Trade-off
- Can't keep everything in $$$-expensive RAM
- Must be smart about what goes where
- Multi-tier allows tiered storage strategy

### Problem 3: Latency Percentiles
```
Single Layer (Redis):
P50: 10ms ✓
P95: 50ms ✓
P99: 500ms ✗ (network jitter)

Multi-tier (L1+L2):
P50: 0.1ms ✓
P95: 10ms ✓
P99: 50ms ✓
```

---

## The Three Cache Levels

### L1: In-Memory Cache (Process-Local)

**What it is**: JavaScript object or Map stored in app memory

**Use for**:
- Config (app settings, feature flags)
- Current user session
- Hot lookup tables (< 10MB)
- Real-time counters (active users)

**Characteristics**:
- **Speed**: 0.1-1ms (local memory access)
- **Size**: Limited by RAM (10-500MB typical)
- **Scope**: Single process only
- **Durability**: Lost on restart

**Code Pattern**:
```javascript
const L1Cache = new Map();

// Store
L1Cache.set('config:app', appConfig);

// Retrieve
const config = L1Cache.get('config:app');

// With TTL
L1Cache.set('user:123', userData);
setTimeout(() => L1Cache.delete('user:123'), 3600000); // 1 hour
```

### L2: Distributed Cache (Redis)

**What it is**: Central Redis instance or cluster

**Use for**:
- User sessions (distributed)
- API responses (shared across servers)
- Expensive queries (shared computation)
- temporary data (< 1GB)

**Characteristics**:
- **Speed**: 5-50ms (network + lookup)
- **Size**: 1-100 GB typical
- **Scope**: All servers in cluster can access
- **Durability**: Can persist to disk

**Code Pattern**:
```javascript
// Store
await redis.set('session:token:abc123', sessionData, { EX: 3600 });

// Retrieve
const session = await redis.get('session:token:abc123');

// Check TTL
const ttl = await redis.ttl('session:token:abc123');
```

### L3: Database

**What it is**: PostgreSQL, MongoDB, file system, etc.

**Use for**:
- ALL persistent data
- Source of truth
- Audit logs
- Historical data

**Characteristics**:
- **Speed**: 50-500ms (disk I/O + query)
- **Size**: Unlimited (terabytes)
- **Scope**: Single source of truth
- **Durability**: Fully persistent

**Code Pattern**:
```javascript
// Retrieve from source of truth
const user = await db.users.findById(userId);
```

---

## Cache Flow Patterns

### Pattern 1: Hierarchical Lookup (Cache-Aside per Level)

```javascript
async function getValue(key) {
  // Try L1 first
  let value = L1Cache.get(key);
  if (value) return value;
  
  // Try L2 next
  value = await redis.get(key);
  if (value) {
    // Populate L1 from L2
    L1Cache.set(key, value);
    return value;
  }
  
  // Try L3 finally
  value = await database.get(key);
  if (value) {
    // Populate L2 and L1
    await redis.set(key, JSON.stringify(value), { EX: 3600 });
    L1Cache.set(key, value);
  }
  
  return value;
}
```

### Pattern 2: Write-Through (All Levels)

```javascript
async function setValue(key, value) {
  // Write to database first (source of truth)
  await database.set(key, value);
  
  // Then update L2
  await redis.set(key, JSON.stringify(value), { EX: 3600 });
  
  // Then update L1
  L1Cache.set(key, value);
}
```

### Pattern 3: Invalidation Cascade

```javascript
async function invalidateKey(key) {
  // Clear all layers
  L1Cache.delete(key);                    // L1
  await redis.del(key);                   // L2
  // L3 (database) is source of truth, don't clear
  
  console.log(`Invalidated ${key} across all layers`);
}
```

---

## Hit Ratio Metrics

### What is Hit Ratio?

**Hit Ratio = Hits / (Hits + Misses)**

```
100 requests total:
- 90 hit cache (L1 or L2)
- 10 miss, go to database
- Hit ratio: 90% ✓ Excellent
```

### Per-Tier Hit Ratio

```javascript
{
  L1: {
    hits: 800,
    misses: 100,
    hitRatio: '89%',
    avgLatency: '0.5ms'
  },
  L2: {
    hits: 80,      // L1 misses that hit L2
    misses: 20,    // L1 + L2 misses
    hitRatio: '80%',
    avgLatency: '15ms'
  },
  L3: {
    requests: 20,  // Actual DB queries
    avgLatency: '120ms'
  }
}
```

### Targets by Use Case

| Use Case | L1 Hit | L2 Hit | DB Hit | Target |
|----------|--------|--------|---------|--------|
| **API** | 70% | 20% | 10% | < 5% to DB |
| **Web App** | 80% | 15% | 5% | < 3% to DB |
| **Mobile** | 60% | 25% | 15% | Varies |
| **Real-time** | 40% | 40% | 20% | Fresh data |

### Improving Hit Ratio

1. **Size**: Increase cache size (more items fit)
2. **TTL**: Extend TTL (stay in cache longer)
3. **Warming**: Preload hot data
4. **Smart Eviction**: Keep hot items, evict cold items
5. **Prediction**: Warm before access patterns

---

## Eviction & Size Management

### L1 Size Limits
```javascript
const MAX_L1_SIZE = 100 * 1024 * 1024; // 100MB
let L1CurrentSize = 0;

function addToL1(key, value) {
  const valueSize = JSON.stringify(value).length;
  
  if (L1CurrentSize + valueSize > MAX_L1_SIZE) {
    // Evict least recently used
    evictOldest();
  }
  
  L1Cache.set(key, value);
  L1CurrentSize += valueSize;
}
```

### L2 (Redis) Management
```javascript
// Set max memory policy
config set maxmemory-policy allkeys-lru  // Remove any key (LRU)
config set maxmemory 10gb

// Or policy: volatile-lru (remove only keys with TTL)
config set maxmemory-policy volatile-lru
```

---

## Real-World Example: E-commerce

### Product Data Caching

```
User searches for "laptop"

Try L1 (In-Memory):
├─ Config: FOUND ✓
│  (feature flags for search)
├─ Query cache: MISS ✗
    ↓
  Try L2 (Redis):
  ├─ Query cache: FOUND ✓
  │  (previous search results)
  │  → Copy to L1
  │  → Return (10ms)
     
Try L3 (Database):
├─ Search query: HITS DB
│  (complex aggregation)
│  → Store in L2 (10min TTL)
│  → Copy to L1 (1min TTL)
│  → Return (200ms)
```

### Multi-tier Benefit

```
Without multi-tier:
- 1000 visits/sec
- All hit Redis (10ms)
- Total: 10,000ms overhead

With multi-tier:
- 700 hit L1 (0.5ms) = 350ms
- 250 hit L2 (10ms) = 2500ms
- 50 hit L3 (200ms) = 10,000ms
- Total: 12,850ms overhead → 98% reduction per tier
```

---

## Trade-offs & Considerations

### Cost vs Speed

| Tier | Cost | Speed | Size | Tradeoff |
|------|------|-------|------|----------|
| L1 | Very High | Fastest | Small | Use sparingly |
| L2 | Medium | Medium | Large | Balanced |
| L3 | Low | Slow | Unlimited | Authoritative |

### Consistency Issues

**L1 (local) issues**:
- Different processes see different data
- Updates don't sync across nodes
- Solution: Keep only read-only config in L1

**L2 (Redis) issues**:
- Eventual consistency
- Must handle misses
- Solution: L3 is source of truth

---

## When NOT to Use Multi-tier

- **Small cache needs**: Single Redis is enough
- **Consistency critical**: Too complex, use L3 only
- **Memory constrained**: Can't afford L1 overhead
- **Rapidly changing**: TTLs become complex

Use **single-layer (L2 only)** for simplicity unless you have:
- Very high QPS (> 10k/sec)
- Expensive L2 operations
- Clear hot/cold data separation

---

## Summary

**Multi-tier caching combines three levels:**

1. **L1 (Local)**: Fast but small, process-specific
2. **L2 (Distributed)**: Medium-speed, shared across servers
3. **L3 (Database)**: Source of truth, authoritative

**Use together to:**
- Reduce latency (P99 < 100ms)
- Improve hit ratio (> 90%)
- Scale to high QPS (> 100k/sec)
- Manage costs (use each layer efficiently)

**Key pattern**: Hierarchical lookup with cascade invalidation
