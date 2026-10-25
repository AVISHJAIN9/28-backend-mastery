# LRU Eviction Policy: Deep Dive

LRU (Least Recently Used) eviction is the most popular cache eviction policy. When cache capacity is reached, it removes the entry accessed longest ago. Learn the architecture, implementation, trade-offs, and pitfalls.

---

## Part 1: LRU Fundamentals

### What is LRU?

LRU evicts the **least recently used item** when the cache is full. "Recently used" means any access (read or write) updates the item's position to "most recent."

```
Initial cache (capacity 3): [A, B, C]
Access A → [B, C, A]  (A moved to end)
Add D (full) → [C, A, D]  (B evicted, least recently used)
Access C → [A, D, C]  (C to end)
Add E (full) → [A, D, C, E] won't fit
Actually: [D, C, E]  (A evicted)
```

**Key property:** Recent accesses stay; old accesses leave.

### Why LRU Works Well

1. **Temporal locality heuristic**: Programs re-access recent data often
2. **CPU/disk caches**: LRU approximates optimal offline algorithm
3. **Web serving**: User's recent requests likely to repeat
4. **Database buffers**: Hot data stays, cold data ages out
5. **Browser cache**: Recent pages more likely revisited

### LRU vs Other Policies

| Policy | Evict | Pro | Con |
|--------|-------|-----|-----|
| LRU | Least recently used | Temporal locality | Cache misses if access pattern Sequential |
| FIFO | Oldest inserted | O(1) simple | No reuse awareness |
| LFU | Least frequently used | Captures popular items | Frequency stuck (old popular item stays forever) |
| Random | Random entry | Low overhead | No intelligence |
| ARC | Adaptive blend | Learns pattern | Complexity O(1) + overhead |
| Optimal | Future known access | Perfect | Requires clairvoyance |

---

## Part 2: Core Implementation: DoublyLinkedList + HashMap

### The Challenge: O(1) Operations

To evict LRU item instantly, we need **O(1) access AND O(1) ordering**:

- **HashMap**: O(1) get cache value
- **DoublyLinkedList**: O(1) reorder on access

Without this exact combination, LRU becomes O(n log n) or O(n).

### Architecture: Two Data Structures

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();  // key -> Node
    this.head = new Node(-1, -1);  // dummy head
    this.tail = new Node(-1, -1);  // dummy tail
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const node = this.cache.get(key);
    this._moveToFront(node);  // O(1) relink
    return node.value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      const node = this.cache.get(key);
      node.value = value;
      this._moveToFront(node);
    } else {
      if (this.cache.size === this.capacity) {
        this._removeTail();  // Evict LRU
      }
      const newNode = new Node(key, value);
      this._addToFront(newNode);
      this.cache.set(key, newNode);
    }
  }

  _moveToFront(node) {
    this._remove(node);
    this._addToFront(node);
  }

  _remove(node) {
    const prev = node.prev;
    const next = node.next;
    prev.next = next;
    next.prev = prev;
  }

  _addToFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  _removeTail() {
    const lru = this.tail.prev;
    this._remove(lru);
    this.cache.delete(lru.key);
  }
}
```

**Why DoublyLinkedList?**
- Doubly-linked allows O(1) removal (need both prev/next)
- Singly-linked can't remove node without predecessor
- Dummy head/tail eliminate edge cases

**Why HashMap?**
- O(1) key lookup to find cache entry
- Linked list alone is O(n) search

---

## Part 3: Detailed Algorithm Walk-Through

### Step-by-Step Example: Cache capacity 3

```
Initialize: cache=[], order=[head] -> [tail]

PUT(A, 1):
  cache.set(A, Node(A,1))
  Add to front: [head] -> [A] -> [tail]
  State: {A:1}, order=[head->A->tail]

PUT(B, 2):
  cache.set(B, Node(B,2))
  Add to front: [head] -> [B] -> [A] -> [tail]
  State: {A:1, B:2}, order=[head->B->A->tail]

PUT(C, 3):
  cache.set(C, Node(C,3))
  Add to front: [head] -> [C] -> [B] -> [A] -> [tail]
  State: {A:1, B:2, C:3}, full

GET(A):
  Find A in cache: yes
  Move to front: [head] -> [A] -> [C] -> [B] -> [tail]
  Return 1
  State: {A:1, B:2, C:3}, A is newest

PUT(D, 4):
  Cache full (size=3, capacity=3)
  Evict tail.prev = B (LRU)
  Add D to front: [head] -> [D] -> [A] -> [C] -> [tail]
  State: {A:1, C:3, D:4}, B removed

GET(B):
  B not in cache
  Return -1
  State unchanged
```

---

## Part 4: Optimization Techniques

### 1. Batch Operations
When multiple operations come together, combine them:
```javascript
putBatch(updates) {
  updates.forEach(({key, value}) => this.put(key, value));
  // Optional: defer relink until end for bulk load
}
```

### 2. Lazy Deletion
Instead of immediate removal, mark as deleted:
```javascript
invalidate(key) {
  const node = this.cache.get(key);
  if (node) node.deleted = true;
}

get(key) {
  const node = this.cache.get(key);
  if (node && !node.deleted) {
    this._moveToFront(node);
    return node.value;
  }
  return -1;
}
```

### 3. LRU with TTL
Combine LRU eviction with time-based expiration:
```javascript
put(key, value, ttl = null) {
  // existing LRU logic
  if (ttl) {
    node.expireAt = Date.now() + ttl;
    this.ttlQueue.push(node);  // sorted by expire time
  }
}

_evictExpired() {
  while (this.ttlQueue.length && 
         this.ttlQueue[0].expireAt < Date.now()) {
    const expired = this.ttlQueue.shift();
    if (this.cache.has(expired.key)) {
      this._remove(expired);
      this.cache.delete(expired.key);
    }
  }
}
```

### 4. LRU-K (Multi-level Recency)
Track last K accesses instead of just one:
```javascript
class LRUKCache {
  constructor(capacity, k = 2) {
    this.k = k;
    this.cache = new Map();  // key -> {value, accesses[]}
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const entry = this.cache.get(key);
    entry.accesses.push(Date.now());
    if (entry.accesses.length > this.k) {
      entry.accesses.shift();
    }
    return entry.value;
  }
}
```

---

## Part 5: Real-World Examples

### 1. CPU L1/L2/L3 Caches
Modern CPUs use LRU variants:
- L1: 32KB, 8-way associative (8-LRU per set)
- L3: 8-20MB, LRU or pseudo-LRU
- Reduces cache misses 40-60% vs random

### 2. Redis Maxmemory Eviction
```
maxmemory-policy allkeys-lru  # LRU for all keys
maxmemory-policy volatile-lru  # LRU only for keys with TTL

Redis: randomly samples 5 keys, evicts LRU from sample
(Not true LRU, but approximates at O(1))
```

### 3. Linux Page Replacement
Kernel LRU approximation (clock algorithm):
```
Two lists: active, inactive
- Access -> move to active
- Clock hand rotates, inactive entries evicted
- Hybrid approach (not pure LRU but good enough)
```

### 4. Browser Back/Forward Cache
Firefox/Chrome keep 50 LRU pages in memory:
- Navigate to new page -> page moves to LRU
- Memory pressure -> oldest page freed
- Same-site navigation often cache hit

### 5. CDN Edge Caches
Akamai, Cloudflare use LRU-like policies:
- Popular content (high frequency) stays
- Old requests fade out
- Reduces origin server hits 95%+

---

## Part 6: Common Mistakes & Solutions

### Mistake 1: Forgetting to Update on Read
**Problem:** `get()` doesn't update recency
```javascript
// WRONG
get(key) {
  return this.cache.get(key).value;  // LRU position unchanged!
}

// RIGHT
get(key) {
  if (this.cache.has(key)) {
    this._moveToFront(this.cache.get(key));
    return this.cache.get(key).value;
  }
  return -1;
}
```

**Impact:** Cache misses increase 30-50%; cold items stay in cache.

---

### Mistake 2: Using Array Instead of LinkedList
**Problem:** O(n) removal
```javascript
// WRONG - O(n) every access
class BadLRU {
  cache = [];  // [entry, entry, entry]
  
  get(key) {
    const idx = this.cache.findIndex(e => e.key === key);
    if (idx !== -1) {
      const entry = this.cache.splice(idx, 1)[0];  // O(n)!
      this.cache.unshift(entry);  // O(n)!
      return entry.value;
    }
    return -1;
  }
}

// RIGHT - O(1) with LinkedList
class GoodLRU {
  _moveToFront(node) {  // O(1)
    // relink pointers
  }
}
```

**Impact:** 1M items → 1M operations per access vs 1.

---

### Mistake 3: Single Lock for Entire Cache
**Problem:** Thread contention
```javascript
// WRONG
class UnsafeLRU {
  get(key) {
    this.lock.acquire();
    try {
      this._moveToFront(key);
      return this.cache.get(key);
    } finally {
      this.lock.release();  // Everyone waits for one lock
    }
  }
}

// RIGHT - fine-grained locking
class SafeLRU {
  get(key) {
    const node = this.cache.get(key);
    if (!node) return -1;
    
    node.lock.acquire();
    try {
      this._moveToFront(node);
      return node.value;
    } finally {
      node.lock.release();  // Only this entry locked
    }
  }
}
```

**Impact:** Thread throughput: 100K ops/sec → 20K ops/sec under contention.

---

### Mistake 4: Not Handling Capacity = 1
**Problem:** Evict immediately, cache always misses
```javascript
// WRONG
const cache = new LRUCache(1);
cache.set("A", 1);
cache.set("B", 1);  // A evicted immediately
cache.get("A");      // Returns -1
cache.get("B");      // Returns 1, then B evicted

// RIGHT - handle edge case
const cache = new LRUCache(1);
cache.set("A", 1);
cache.set("B", 1);   // A evicted
cache.get("B");      // Returns 1, B moved to front (still alone)
```

**Test case often missed in interviews.**

---

### Mistake 5: Updating Same Key Increases Capacity
**Problem:** Put(existing_key) should update, not add
```javascript
// WRONG
cache = LRU(capacity=2), size=2 {A,B}
put(A, newValue) -> size becomes 3, must evict?

// RIGHT
cache.set("A", 1);  // A inserted
cache.set("A", 2);  // A value updated, size still 1
cache.set("B", 1);  // B inserted, size = 2
cache.set("A", 3);  // A value updated again, A moved to front
                     // size = 2, B is LRU
cache.set("C", 1);  // B evicted (LRU), C inserted
```

**Test:** LRUCache with updates=updates, not inserts.

---

## Part 7: Advanced Variants

### Segmented LRU (S-LRU)
Two segments: probationary (new items) and protected (proven items).
- New items start in probationary
- Demoted to probationary if short-lived
- Promoted to protected if reused
- Result: One-hit wonders don't evict hot data

```javascript
class SLRU {
  constructor(capacity) {
    this.probationary = new LRUCache(capacity * 0.2);
    this.protected = new LRUCache(capacity * 0.8);
  }

  get(key) {
    const val = this.probationary.get(key);
    if (val !== undefined) {
      // Promote to protected
      this.probationary.remove(key);
      this.protected.set(key, val);
      return val;
    }
    return this.protected.get(key);
  }
}
```

---

### Clock/Second-Chance
Simulates LRU without linked list overhead:
- Circular buffer + "referenced" bit
- Clock hand rotates, skips referenced entries
- Referenced bit cleared on skip
- Entry evicted when hand reaches it (unreferenced)

```javascript
class ClockEviction {
  constructor(capacity) {
    this.buffer = new Array(capacity).fill(null);
    this.hand = 0;
    this.referenced = new Map();
  }

  put(key, value) {
    if (this.cache.size === this.capacity) {
      while (this.referenced.get(this.buffer[this.hand])) {
        this.referenced.set(this.buffer[this.hand], false);
        this.hand = (this.hand + 1) % this.capacity;
      }
      this.cache.delete(this.buffer[this.hand]);
    }
    this.buffer[this.hand] = key;
    this.cache.set(key, value);
    this.referenced.set(key, true);
    this.hand = (this.hand + 1) % this.capacity;
  }
}
```

---

## Part 8: Performance Analysis & Comparison

### Measurement: Hit Rate Under Different Access Patterns

**Pattern 1: Temporal Locality (80/20 rule)**
```
80% access to 20% of data (hot set)
LRU hit rate: 95%
FIFO hit rate: 60%
Random hit rate: 20%
```

**Pattern 2: Sequential (1,2,3,...,N,1,2,3)**
```
LRU hit rate: 0% (no locality)
FIFO hit rate: 0% (no locality)
LRU-K hit rate: 70% (captures pattern)
```

**Pattern 3: Working Set Varies**
```
LRU hit rate: 85%
ARC hit rate: 92% (adaptive)
```

### Memory Overhead
- **True LRU:** 2 pointers per entry (16 bytes on 64-bit) + Map
- **Clock:** 1 bit per entry + circular buffer
- **Redis approx-LRU:** 8 bits per entry (LFU counter)

### Time Complexity
| Operation | LRU | S-LRU | Clock | Redis-LRU |
|-----------|-----|-------|-------|-----------|
| Get       | O(1) | O(1) | O(1)  | O(1) |
| Put       | O(1) | O(1) | O(1)*  | O(1) |
| Evict     | O(1) | O(1) | O(c)** | O(k) |

*Clock can take multiple rotations  
**c = rotations until unreferenced found  
***k = sample size (typically 5)

---

## Summary: LRU Checklist

- [x] Use DoublyLinkedList + HashMap for O(1) all operations
- [x] Update recency on every access (read and write)
- [x] Handle capacity=1 edge case
- [x] Lock at entry level, not cache level (concurrency)
- [x] Use dummy head/tail to avoid null checks
- [x] Test with sequential, temporal, and adversarial patterns
- [x] Consider TTL for expiration alongside LRU
- [x] Measure hit rate in production, not just latency
- [x] Profile memory: is overhead worth it?
- [x] Plan for variants (S-LRU, Clock) if LRU doesn't fit
