import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.HTTP_PORT || 4007;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// ============================================
// LRU Cache Implementation
// ============================================

class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = new Node(-1, -1);
    this.tail = new Node(-1, -1);
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      puts: 0,
      gets: 0
    };
  }

  get(key) {
    this.stats.gets++;
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return -1;
    }
    const node = this.cache.get(key);
    this.stats.hits++;
    this._moveToFront(node);
    return node.value;
  }

  put(key, value) {
    this.stats.puts++;
    if (this.cache.has(key)) {
      const node = this.cache.get(key);
      node.value = value;
      this._moveToFront(node);
    } else {
      if (this.cache.size === this.capacity) {
        this._removeTail();
        this.stats.evictions++;
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

  size() {
    return this.cache.size;
  }

  getCurrentOrder() {
    const order = [];
    let current = this.head.next;
    while (current !== this.tail) {
      order.push({ key: current.key, value: current.value });
      current = current.next;
    }
    return order;
  }

  getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : ((this.stats.hits / total) * 100).toFixed(2);
  }

  clear() {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.stats = { hits: 0, misses: 0, evictions: 0, puts: 0, gets: 0 };
  }
}

// ============================================
// S-LRU: Segmented LRU
// ============================================

class SegmentedLRU {
  constructor(capacity, probationaryRatio = 0.2) {
    this.capacity = capacity;
    this.probationaryCapacity = Math.floor(capacity * probationaryRatio);
    this.protectedCapacity = capacity - this.probationaryCapacity;
    this.probationary = new LRUCache(this.probationaryCapacity);
    this.protected = new LRUCache(this.protectedCapacity);
    this.stats = { promotions: 0 };
  }

  get(key) {
    const val = this.probationary.get(key);
    if (val !== -1) {
      this.probationary.cache.delete(key);
      this.protected.put(key, val);
      this.stats.promotions++;
      return val;
    }
    return this.protected.get(key);
  }

  put(key, value) {
    if (this.probationary.cache.has(key)) {
      this.probationary.cache.delete(key);
      this.protected.put(key, value);
      this.stats.promotions++;
    } else if (this.protected.cache.has(key)) {
      this.protected.put(key, value);
    } else {
      this.probationary.put(key, value);
    }
  }

  size() {
    return this.probationary.size() + this.protected.size();
  }

  getStats() {
    return {
      probationary: {
        size: this.probationary.size(),
        ...this.probationary.stats
      },
      protected: {
        size: this.protected.size(),
        ...this.protected.stats
      },
      promotions: this.stats.promotions
    };
  }
}

// ============================================
// Test Instances
// ============================================

const lruCache = new LRUCache(5);
const slruCache = new SegmentedLRU(5);
const sequentialCache = new LRUCache(5);
const comparisonCache = { lru: new LRUCache(3), fifo: [], size: 0, capacity: 3 };

// ============================================
// REST Endpoints
// ============================================

// Endpoint 1: Basic LRU GET
app.get('/api/lru/get/:key', (req, res) => {
  try {
    const { key } = req.params;
    const value = lruCache.get(key);
    res.json({
      key,
      value: value === -1 ? null : value,
      found: value !== -1,
      size: lruCache.size(),
      order: lruCache.getCurrentOrder()
    });
  } catch (error) {
    logger.error('LRU GET error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Endpoint 2: Basic LRU PUT
app.get('/api/lru/put/:key/:value', (req, res) => {
  try {
    const { key, value } = req.params;
    lruCache.put(key, value);
    res.json({
      key,
      value,
      size: lruCache.size(),
      order: lruCache.getCurrentOrder(),
      stats: lruCache.stats
    });
  } catch (error) {
    logger.error('LRU PUT error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Endpoint 3: Temporal Locality Test (80/20)
app.post('/api/lru/temporal-test', (req, res) => {
  try {
    lruCache.clear();
    let iterations = req.body.iterations || 100;
    const hotKeys = ['A', 'B']; // 20% of keys
    const coldKeys = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']; // 80%

    for (let i = 0; i < iterations; i++) {
      const random = Math.random();
      if (random < 0.8) {
        const key = hotKeys[Math.floor(Math.random() * hotKeys.length)];
        lruCache.get(key);
        if (lruCache.get(key) === -1) {
          lruCache.put(key, `hot-${i}`);
        }
      } else {
        const key = coldKeys[Math.floor(Math.random() * coldKeys.length)];
        lruCache.get(key);
        if (lruCache.get(key) === -1) {
          lruCache.put(key, `cold-${i}`);
        }
      }
    }

    res.json({
      test: 'Temporal Locality (80/20)',
      iterations,
      hitRate: lruCache.getHitRate(),
      stats: lruCache.stats,
      currentOrder: lruCache.getCurrentOrder()
    });
  } catch (error) {
    logger.error('Temporal test error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Endpoint 4: Sequential Access Test (No Locality)
app.post('/api/lru/sequential-test', (req, res) => {
  try {
    sequentialCache.clear();
    const iterations = req.body.iterations || 3;

    for (let round = 0; round < 2; round++) {
      for (let i = 1; i <= 8; i++) {
        const key = `seq-${i}`;
        const result = sequentialCache.get(key);
        if (result === -1) {
          sequentialCache.put(key, i);
        }
      }
    }

    res.json({
      test: 'Sequential Access (Same pattern repeated)',
      iterations,
      hitRate: sequentialCache.getHitRate(),
      stats: sequentialCache.stats,
      note: 'LRU performs poorly with sequential patterns'
    });
  } catch (error) {
    logger.error('Sequential test error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Endpoint 5: S-LRU vs LRU Comparison
app.post('/api/lru/slru-comparison', (req, res) => {
  try {
    slruCache.probationary.clear();
    slruCache.protected.clear();
    lruCache.clear();

    const oneHitWonders = ['x', 'y', 'z'];
    const repeatedAccess = ['A', 'B'];

    // Access pattern: one-hit wonders then repeated
    oneHitWonders.forEach(k => {
      lruCache.put(k, 'value');
      slruCache.put(k, 'value');
    });

    // Repeated accesses (one-hit wonders already evicted in LRU)
    for (let i = 0; i < 10; i++) {
      repeatedAccess.forEach(k => {
        lruCache.get(k);
        slruCache.get(k);
      });
    }

    res.json({
      lruPerformance: {
        hitRate: lruCache.getHitRate(),
        stats: lruCache.stats
      },
      slruPerformance: {
        stats: slruCache.getStats()
      },
      insight: 'S-LRU protects repeated items from one-hit wonders'
    });
  } catch (error) {
    logger.error('S-LRU comparison error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Endpoint 6: LRU vs FIFO
app.post('/api/lru/lru-vs-fifo', (req, res) => {
  try {
    const lru = new LRUCache(3);
    const fifo = { queue: [], cache: new Map(), capacity: 3 };

    const operations = ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'D'];

    const lruOps = [];
    const fifoOps = [];

    operations.forEach((key, idx) => {
      // LRU
      if (lru.get(key) === -1) {
        lru.put(key, `v${idx}`);
        lruOps.push({ op: idx, key, result: 'miss', evicted: idx >= 3 });
      } else {
        lruOps.push({ op: idx, key, result: 'hit' });
      }

      // FIFO
      if (!fifo.cache.has(key)) {
        if (fifo.cache.size === fifo.capacity) {
          const oldest = fifo.queue.shift();
          fifo.cache.delete(oldest);
          fifoOps.push({ op: idx, key, result: 'miss', evicted: oldest });
        }
        fifo.queue.push(key);
        fifo.cache.set(key, `v${idx}`);
      } else {
        fifoOps.push({ op: idx, key, result: 'hit' });
      }
    });

    res.json({
      operations,
      lru: { ops: lruOps, hitRate: lru.getHitRate() },
      fifo: { ops: fifoOps, hits: fifoOps.filter(o => o.result === 'hit').length },
      insight: 'LRU adapts to repeated access; FIFO does not'
    });
  } catch (error) {
    logger.error('LRU vs FIFO error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Endpoint 7: Eviction Order Tracking
app.get('/api/lru/eviction-trace', (req, res) => {
  try {
    const cache = new LRUCache(3);
    const evictionTrace = [];

    const keys = ['A', 'B', 'C', 'A', 'D', 'E', 'A', 'F'];

    keys.forEach(key => {
      const sizeBefore = cache.size();
      cache.put(key, `value-${key}`);
      const sizeAfter = cache.size();
      const evicted = sizeBefore === 3 && sizeAfter === 3;
      
      evictionTrace.push({
        key,
        order: cache.getCurrentOrder(),
        evicted,
        size: sizeAfter
      });
    });

    res.json({
      capacity: 3,
      keys,
      trace: evictionTrace,
      insight: 'Least recently used item evicted first'
    });
  } catch (error) {
    logger.error('Eviction trace error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Endpoint 8: Get Current State
app.get('/api/lru/state', (req, res) => {
  try {
    res.json({
      capacity: lruCache.capacity,
      size: lruCache.size(),
      order: lruCache.getCurrentOrder(),
      stats: lruCache.stats,
      hitRate: lruCache.getHitRate()
    });
  } catch (error) {
    logger.error('Get state error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Endpoint 9: Clear Cache
app.get('/api/lru/clear', (req, res) => {
  try {
    lruCache.clear();
    res.json({ message: 'LRU cache cleared', size: 0 });
  } catch (error) {
    logger.error('Clear error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Endpoint 10: Bulk Load Test
app.post('/api/lru/bulk-load', (req, res) => {
  try {
    lruCache.clear();
    const items = req.body.items || 20;

    for (let i = 1; i <= items; i++) {
      lruCache.put(`key-${i}`, `value-${i}`);
    }

    res.json({
      loaded: items,
      capacity: lruCache.capacity,
      size: lruCache.size(),
      stats: lruCache.stats,
      order: lruCache.getCurrentOrder().slice(0, 5)
    });
  } catch (error) {
    logger.error('Bulk load error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
  logger.info(`LRU Eviction server running on port ${PORT}`);
  console.log(`LRU Eviction server running on http://localhost:${PORT}`);
});
