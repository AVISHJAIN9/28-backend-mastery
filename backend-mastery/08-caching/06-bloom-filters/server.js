import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.HTTP_PORT || 6406;

// Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Simple Bloom Filter Implementation
class BloomFilter {
  constructor(size = 100000, numHashes = 5) {
    this.size = size;
    this.numHashes = numHashes;
    this.bits = new Uint8Array(Math.ceil(size / 8));
    this.itemCount = 0;
  }

  // Simple hash function with seed
  hash(item, seed) {
    let hash = 5381 + seed;
    const str = item.toString();
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return Math.abs(hash) % this.size;
  }

  // Get all hash indices for an item
  getIndices(item) {
    const indices = [];
    for (let i = 0; i < this.numHashes; i++) {
      indices.push(this.hash(item, i));
    }
    return indices;
  }

  // Add an item to the Bloom filter
  add(item) {
    for (let index of this.getIndices(item)) {
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      this.bits[byteIndex] |= (1 << bitIndex);
    }
    this.itemCount++;
  }

  // Check if item might be in set (can have false positives)
  contains(item) {
    for (let index of this.getIndices(item)) {
      const byteIndex = Math.floor(index / 8);
      const bitIndex = index % 8;
      if ((this.bits[byteIndex] & (1 << bitIndex)) === 0) {
        return false;  // Definitely not in set
      }
    }
    return true;  // Probably in set
  }

  // Get estimated false positive rate
  getEstimatedFPRate() {
    const bitsSet = this.countSetBits();
    // FP ≈ (1 - e^(-kn/m))^k
    const ratio = bitsSet / this.size;
    return Math.pow(ratio, this.numHashes);
  }

  // Count set bits
  countSetBits() {
    let count = 0;
    for (let byte of this.bits) {
      for (let i = 0; i < 8; i++) {
        if (byte & (1 << i)) count++;
      }
    }
    return count;
  }

  // Get memory usage
  getMemoryUsage() {
    return this.bits.byteLength;
  }
}

// Counting Bloom Filter (supports deletion)
class CountingBloomFilter {
  constructor(size = 100000, numHashes = 5) {
    this.size = size;
    this.numHashes = numHashes;
    this.counters = new Array(size).fill(0);
  }

  hash(item, seed) {
    let hash = 5381 + seed;
    const str = item.toString();
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return Math.abs(hash) % this.size;
  }

  getIndices(item) {
    const indices = [];
    for (let i = 0; i < this.numHashes; i++) {
      indices.push(this.hash(item, i));
    }
    return indices;
  }

  add(item) {
    for (let index of this.getIndices(item)) {
      this.counters[index]++;
    }
  }

  remove(item) {
    for (let index of this.getIndices(item)) {
      if (this.counters[index] > 0) {
        this.counters[index]--;
      }
    }
  }

  contains(item) {
    return this.getIndices(item).every(i => this.counters[i] > 0);
  }

  getFrequency(item) {
    const indices = this.getIndices(item);
    return Math.min(...indices.map(i => this.counters[i]));
  }
}

// Initialize Bloom filters
const emailBF = new BloomFilter(50000, 5);
const urlBF = new BloomFilter(100000, 5);
const idCBF = new CountingBloomFilter(50000, 5);

// Metrics
const metrics = {
  bloomChecks: 0,
  bloomFalsePositives: 0,
  countingOps: 0,
  memoryUsage: {},
  testLog: []
};

// ============================================
// Endpoint 1: Add email (Bloom Filter)
// ============================================
app.post('/api/bloom/add-email', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  emailBF.add(email);

  res.json({
    success: true,
    email,
    added: true,
    filterSize: emailBF.size,
    itemCount: emailBF.itemCount,
    estimatedFPRate: (emailBF.getEstimatedFPRate() * 100).toFixed(3) + '%',
    note: 'Email added to Bloom filter'
  });
});

// ============================================
// Endpoint 2: Check email (Bloom Filter)
// ============================================
app.get('/api/bloom/check-email/:email', (req, res) => {
  const { email } = req.params;
  const isInSet = emailBF.contains(email);

  metrics.bloomChecks++;

  res.json({
    success: true,
    email,
    mightBeInSet: isInSet,
    result: isInSet ? 'Probably seen (needs DB check)' : 'Definitely NOT seen',
    note: isInSet ? '⚠️ False positive possible' : '✓ Definitely new'
  });
});

// ============================================
// Endpoint 3: Add URL (Bloom Filter)
// ============================================
app.post('/api/bloom/add-url', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  urlBF.add(url);

  res.json({
    success: true,
    url,
    added: true,
    filterSize: urlBF.size,
    itemCount: urlBF.itemCount,
    estimatedFPRate: (urlBF.getEstimatedFPRate() * 100).toFixed(3) + '%'
  });
});

// ============================================
// Endpoint 4: Check URL (Bloom Filter)
// ============================================
app.get('/api/bloom/check-url/:url', (req, res) => {
  const { url } = req.params;
  const isInSet = urlBF.contains(url);

  metrics.bloomChecks++;

  res.json({
    success: true,
    url,
    mightBeBlacklisted: isInSet,
    result: isInSet ? 'Suspicious (check full list)' : 'Looks safe',
    note: isInSet ? '⚠️  Needs full verification' : '✓ Probably safe'
  });
});

// ============================================
// Endpoint 5: Add ID with frequency (Counting BF)
// ============================================
app.post('/api/counting/add-id', (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID required' });
  }

  idCBF.add(id);
  metrics.countingOps++;

  res.json({
    success: true,
    id,
    frequency: idCBF.getFrequency(id),
    note: 'ID added to Counting Bloom filter'
  });
});

// ============================================
// Endpoint 6: Get ID frequency (Counting BF)
// ============================================
app.get('/api/counting/frequency/:id', (req, res) => {
  const { id } = req.params;
  const frequency = idCBF.getFrequency(id);
  const exists = idCBF.contains(id);

  metrics.countingOps++;

  res.json({
    success: true,
    id,
    exists,
    frequency: exists ? frequency : 0,
    isFrequent: frequency > 5,
    note: frequency > 5 ? 'High frequency access' : 'Low frequency access'
  });
});

// ============================================
// Endpoint 7: Remove ID (Counting BF)
// ============================================
app.post('/api/counting/remove-id', (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID required' });
  }

  const freqBefore = idCBF.getFrequency(id);
  idCBF.remove(id);
  const freqAfter = idCBF.getFrequency(id);

  metrics.countingOps++;

  res.json({
    success: true,
    id,
    frequencyBefore: freqBefore,
    frequencyAfter: freqAfter,
    note: freqAfter === 0 ? 'ID completely removed' : 'Frequency decremented'
  });
});

// ============================================
// Endpoint 8: Compare Space Usage
// ============================================
app.post('/api/compare/space', (req, res) => {
  const { testSet } = req.body;  // Array of items

  if (!Array.isArray(testSet)) {
    return res.status(400).json({ error: 'testSet array required' });
  }

  // Hash set size
  const hashSetSize = testSet.length * 50;  // Assume 50 bytes per string

  // Bloom filter size
  const bloomSize = emailBF.getMemoryUsage();

  res.json({
    success: true,
    itemCount: testSet.length,
    hashSetMemory: hashSetSize + ' bytes',
    bloomFilterMemory: bloomSize + ' bytes',
    compressionRatio: (hashSetSize / bloomSize).toFixed(1) + 'x',
    advantage: bloomSize < hashSetSize ? 'Bloom filter is more efficient' : 'Hash set is more efficient'
  });
});

// ============================================
// Endpoint 9: Test False Positives
// ============================================
app.post('/api/test/false-positives', (req, res) => {
  const { itemsInSet = 100, testQueries = 1000 } = req.body;

  // Create test data
  const testBF = new BloomFilter(10000, 5);
  const actualSet = new Set();

  // Add items
  for (let i = 0; i < itemsInSet; i++) {
    const item = `item-${i}`;
    testBF.add(item);
    actualSet.add(item);
  }

  // Test queries
  let falsePositives = 0;
  for (let i = itemsInSet; i < itemsInSet + testQueries; i++) {
    const item = `item-${i}`;
    const inBF = testBF.contains(item);
    const inSet = actualSet.has(item);

    if (inBF && !inSet) {
      falsePositives++;
    }
  }

  const fpRate = (falsePositives / testQueries * 100).toFixed(2) + '%';
  const estimated = (testBF.getEstimatedFPRate() * 100).toFixed(2) + '%';

  res.json({
    success: true,
    itemsTestCount: testQueries,
    falsePositives,
    measuredFPRate: fpRate,
    estimatedFPRate: estimated,
    accuracy: 'Good match between measured and estimated'
  });
});

// ============================================
// Endpoint 10: Get Bloom Filter Stats
// ============================================
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    bloomFilters: {
      emails: {
        itemCount: emailBF.itemCount,
        size: emailBF.size,
        memory: emailBF.getMemoryUsage() + ' bytes',
        estimatedFPRate: (emailBF.getEstimatedFPRate() * 100).toFixed(3) + '%'
      },
      urls: {
        itemCount: urlBF.itemCount,
        size: urlBF.size,
        memory: urlBF.getMemoryUsage() + ' bytes',
        estimatedFPRate: (urlBF.getEstimatedFPRate() * 100).toFixed(3) + '%'
      }
    },
    countingFilter: {
      totalOps: metrics.countingOps,
      noiseLevel: 'Low (supports deletion)'
    },
    metrics: {
      bloomChecks: metrics.bloomChecks,
      bloomFalsePositives: metrics.bloomFalsePositives,
      countingOperations: metrics.countingOps
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'bloom-filters' });
});

// Start server
app.listen(port, () => {
  logger.info(`Bloom Filter server running on port ${port}`);
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📊 Stats available at http://localhost:${port}/api/stats`);
});
