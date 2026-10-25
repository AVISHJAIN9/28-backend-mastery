# Consistent Hashing: Theory & Concepts

## What is Consistent Hashing?

Consistent hashing is an algorithm for distributing data across multiple cache nodes that **minimizes reorganization when nodes are added or removed**.

### Simple Hashing vs Consistent Hashing

#### Problem: Simple Hashing (mod)
```javascript
function simpleHash(key, nodeCount) {
  return hash(key) % nodeCount;
}

With 3 nodes:
- hash("user:1") % 3 = 0 → Node 0
- hash("user:2") % 3 = 1 → Node 1
- hash("user:3") % 3 = 2 → Node 2

If node dies and we have 2 nodes:
- hash("user:1") % 2 = 0 → Node 0 (still same ✓)
- hash("user:2") % 2 = 1 → Node 1 (still same ✓)
- hash("user:3") % 2 = 0 → Node 0 (CHANGED! ✗)

Result: 66% of keys rehashed to DIFFERENT nodes
```

#### Solution: Consistent Hashing
```javascript
With virtual ring:
- All keys and nodes placed on circle (0-360°)
- Key assigned to CLOCKWISE next node

Node removal:
- Keys only reassigned to next node clockwise
- 33% of keys rehashed (only those before removed node)
```

---

## How Consistent Hashing Works

### The Ring (Hash Ring)

Imagine a circle numbered 0 to 2^32 - 1:
```
        250°
    300°     200°


Node C     Node A
(280°)     (180°)

    0°         
    
        
Node B
(60°)

```

### Placing Keys

Each key hashed to a position, mapped to next node clockwise:

```
Key "user:1" → hash → 45°  → Clockwise → Node B (60°) ✓
Key "user:2" → hash → 150° → Clockwise → Node A (180°) ✓
Key "user:3" → hash → 270° → Clockwise → Node C (280°) ✓
Key "user:4" → hash → 350° → Clockwise → Node B (60° next) ✓
```

### Node Failure

If Node A (180°) fails:
```
Before:
- user:2 (150°) → Node A ✓

After removal:
- user:2 (150°) → Clockwise → Node B (60° next, wrapping) ✓

Keys on other nodes unchanged:
- user:1 (45°) still → Node B ✓
- user:3 (270°) still → Node C ✓
- user:4 (350°) still → Node B ✓
```

**Impact**: Only keys from removed node rehashed (1/3)

---

## Virtual Nodes (Vnodes)

Problem: Real nodes not evenly distributed on ring.

```
Physical nodes on ring:
        
        Node A (180°)
        
        
                         
        
Node B (0°)         Node C (350°)
```

If Node B fails, it only handles 10° of the ring (small load).

### Solution: Virtual Nodes

Each physical node represented multiple times on ring:

```
Node A:  (40°, 140°, 240°)  // 3 vnodes
Node B:  (30°, 130°, 230°)  // 3 vnodes
Node C:  (50°, 150°, 250°)  // 3 vnodes

Now more evenly distributed!
Removing Node B → 33% of keys rehashed (fair)
Removing Node A → 33% of keys rehashed (fair)
```

### Code Pattern

```javascript
class ConsistentHash {
  constructor(nodeCount, vnodeCount = 3) {
    this.ring = new Map();  // position -> physical node
    this.nodeCount = nodeCount;
    this.vnodeCount = vnodeCount;
    this.buildRing();
  }
  
  buildRing() {
    for (let i = 0; i < this.nodeCount; i++) {
      // Add multiple vnodes per physical node
      for (let j = 0; j < this.vnodeCount; j++) {
        const position = hash(`node:${i}:${j}`);
        this.ring.set(position, i);
      }
    }
  }
  
  getNode(key) {
    const position = hash(key);
    
    // Find next position in ring (clockwise)
    const positions = Array.from(this.ring.keys()).sort((a, b) => a - b);
    const nextPos = positions.find(p => p >= position) || positions[0];
    
    return this.ring.get(nextPos);
  }
}
```

---

## Real-World Example: Cache Cluster

### Scenario: 3 Redis Nodes

```
Nodes:
- Cache1 (5000 keys)
- Cache2 (5000 keys)
- Cache3 (5000 keys)
Total: 15,000 keys

Distribution with consistent hashing:
Key "product:101" → hash → position 12,000
                    → Clockwise → Cache2 ✓

Key "user:456"    → hash → position 5,500
                    → Clockwise → Cache1 ✓

Key "order:789"   → hash → position 18,000 (wraps)
                    → Clockwise → Cache3 ✓
```

### Node Addition

Add Cache4:
```
New positions on ring:
- Cache1: (2000, 5500, 9000) ← NEW vnodes at different positions

Old keys affected:
- Keys between old Cache1 and new Cache4 vnode
- Estimated: ~1/4 of 15,000 = 3,750 keys moved
- Without consistent hashing: 7,500 keys moved

Improvement: 50% fewer keys rehashed!
```

### Node Removal

Remove Cache2:
```
Keys from Cache2:
- Reassigned to next node clockwise: Cache3
- Estimated: 5,000 keys moved
- Other nodes unaffected: 10,000 keys stay

Without consistent hashing:
- All 15,000 keys rehash
- Keys on Cache1 & Cache3 (66%) reassigned

Improvement: 66% fewer rehashes!
```

---

## Trade-offs

### Pros
- ✅ Minimal rehashing on node changes (1/N instead of all)
- ✅ Distributes load evenly with vnodes
- ✅ Easy to add/remove nodes
- ✅ Predictable (same key always maps to same node)
- ✅ Scales to 1000s of nodes

### Cons
- ❌ Slightly more complex than simple hashing
- ❌ Need to track ring positions
- ❌ Hot spots possible if vnodes sparse
- ❌ Network traffic on rehashing

---

## When to Use Consistent Hashing

### Use Consistent Hashing For:
- ✅ Multi-node Redis clusters
- ✅ Memcached farms
- ✅ Distributed databases
- ✅ Load balancing with sticky sessions
- ✅ Sharding large datasets

### Don't Use For:
- ❌ Single cache node
- ❌ Co-located replicas (prefer replication)
- ❌ Need perfect balancing (use weighted hashing)

---

## Implementation Considerations

### Hash Function
```javascript
// Use 32-bit or 64-bit hash
function hash(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) - h) + key.charCodeAt(i);
    h = h & h; // Convert to 32-bit
  }
  return Math.abs(h);
}
```

### Vnode Count

```
Too few vnodes (1-2):
- Uneven distribution
- Hot nodes

Too many vnodes (100+):
- Memory overhead
- Lookup slower

Sweet spot: 3-10 vnodes per node
```

### Rehashing Strategy

```javascript
async function rehashKeys(oldNode, newNode) {
  // Get all keys from old node
  const keys = await getKeysForNode(oldNode);
  
  // For each key, check if should move
  for (const key of keys) {
    const newN = getNode(key); // Using new ring
    
    if (newN !== oldNode) {
      // This key should move
      const value = await redis.getFrom(oldNode, key);
      await redis.setOn(newN, key, value);
      await redis.deleteFrom(oldNode, key);
    }
  }
}
```

---

## Summary

**Consistent hashing solves the "cache invalidation on node change" problem.**

Use when:
1. Multiple cache nodes
2. Nodes change frequently
3. Want minimal data movement
4. Need predictable node assignment

Key insight: Keys only rehashed when their "zone" affected, not entire cache.
