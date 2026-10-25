/**
 * Memory Leaks Patterns Controller
 * Demonstrates common memory leak patterns
 */

// Global cache for demonstrating leaks
let globalCache = {};
let timerIds = [];
let listeners = [];

// ============================================
// Pattern 1: Closure Memory Leak
// ============================================

exports.demonstrateClosureLeak = (req, res) => {
  const results = {
    operation: 'closure_memory_leak',
    pattern: 'Closure holding large data',
    memoryBefore: process.memoryUsage().heapUsed,
  };

  console.log('\n=== MEMORY LEAK: Closure Pattern ===');

  function createLeakyFunction() {
    const largeArray = new Array(1000000).fill('data');
    return function () {
      return largeArray.length;
    };
  }

  // Store function that keeps largeArray in memory
  global.leakyFunction = createLeakyFunction();

  results.memoryAfter = process.memoryUsage().heapUsed;
  results.memoryIncrease =
    ((results.memoryAfter - results.memoryBefore) / 1024 / 1024).toFixed(2) + ' MB';
  results.consequence = 'largeArray is never garbage collected';
  results.fix = 'Clear reference when done: delete global.leakyFunction';

  res.json(results);
};

// ============================================
// Pattern 2: Event Listener Leak
// ============================================

exports.demonstrateEventListenerLeak = (req, res) => {
  const { EventEmitter } = require('events');
  const results = {
    operation: 'event_listener_leak',
    pattern: 'Listeners not removed',
    leakCount: 0,
  };

  console.log('\n=== MEMORY LEAK: Event Listener Pattern ===');

  const emitter = new EventEmitter();

  // Create many listeners without removing them
  for (let i = 0; i < 1000; i++) {
    emitter.on('event', () => {
      // ... handler
    });
    results.leakCount++;
  }

  results.listenerCount = emitter.listenerCount('event');
  results.memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB';
  results.consequence = '1000 listeners accumulate in memory';
  results.fix = 'Use emitter.off() or emitter.removeListener() after use';

  listeners.push(emitter);

  res.json(results);
};

// ============================================
// Pattern 3: Timer Reference Leak
// ============================================

exports.demonstrateTimerLeak = (req, res) => {
  const iterations = parseInt(req.query.iterations) || 1000;
  const results = {
    operation: 'timer_leak',
    pattern: 'Timers not cleared',
    timerCount: 0,
  };

  console.log(`\n=== MEMORY LEAK: Timer Pattern (${iterations}) ===`);

  // Create many timers that are never cleared
  for (let i = 0; i < iterations; i++) {
    const id = setTimeout(() => {
      // This might never clear if we don't store/clear it
    }, 100000); // Long timeout
    timerIds.push(id);
    results.timerCount++;
  }

  results.activeTimers = timerIds.length;
  results.memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB';
  results.consequence = `${iterations} timers are kept in memory`;
  results.fix = 'Use clearTimeout(id) when timers are no longer needed';

  res.json(results);
};

// ============================================
// Pattern 4: Circular Reference Leak
// ============================================

exports.demonstrateCircularReferenceLeak = (req, res) => {
  const results = {
    operation: 'circular_reference_leak',
    pattern: 'Circular references in objects',
  };

  console.log('\n=== MEMORY LEAK: Circular Reference Pattern ===');

  class Node {
    constructor(value) {
      this.value = value;
      this.next = null;
      this.parent = null;
    }
  }

  // Create circular structure
  const node1 = new Node(1);
  const node2 = new Node(2);
  node1.next = node2;
  node2.parent = node1; // Circular reference
  global.circularNode = node1; // Keep reference

  results.consequence = 'Even if removed from app, cycles prevent garbage collection';
  results.note: 'Modern GC handles cycles, but WeakMap/WeakSet better prevention';
  results.memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB';

  res.json(results);
};

// ============================================
// Pattern 5: Cache Without Eviction
// ============================================

exports.demonstrateCacheLeak = (req, res) => {
  const iterations = parseInt(req.query.iterations) || 10000;
  const results = {
    operation: 'cache_leak',
    pattern: 'Unlimited cache growth',
  };

  console.log(`\n=== MEMORY LEAK: Cache Pattern (${iterations} items) ===`);

  // Unbounded cache that grows indefinitely
  for (let i = 0; i < iterations; i++) {
    globalCache[`key-${i}`] = new Array(1000).fill(`value-${i}`);
  }

  results.cacheSize = Object.keys(globalCache).length;
  results.memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB';
  results.consequence = 'Cache grows unbounded, consuming all available memory';
  results.solutions = [
    'Implement LRU (Least Recently Used) cache',
    'Use time-based expiration',
    'Set maximum cache size',
    'Use npm packages like node-cache or redis',
  ];

  res.json(results);
};

// ============================================
// Memory Profiling
// ============================================

exports.profileMemory = (req, res) => {
  const results = {
    operation: 'memory_profile',
    timestamp: new Date().toISOString(),
  };

  console.log('\n=== MEMORY PROFILE ===');

  const memUsage = process.memoryUsage();

  results.memory = {
    rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`, // Overall resident set size
    heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`, // Total allocated heap
    heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`, // Actual used
    external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`, // External memory (buffers)
    arrayBuffers: `${(memUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`,
  };

  results.leakIndicators = {
    cacheSize: Object.keys(globalCache).length,
    pendingTimers: timerIds.length,
    eventListeners: listeners.length,
  };

  results.recommendations = [
    'Monitor heapUsed growth over time',
    'Use chrome DevTools for heap snapshots',
    'Implement leak detection in CI/CD',
  ];

  res.json(results);
};

// ============================================
// Cleanup Function
// ============================================

exports.cleanupLeaks = (req, res) => {
  const results = {
    operation: 'cleanup_leaks',
    cleaned: [],
  };

  console.log('\n=== CLEANUP MEMORY LEAKS ===');

  // Clear all leaks
  delete global.leakyFunction;
  results.cleaned.push('Removed closure reference');

  listeners.forEach((emitter) => {
    emitter.removeAllListeners();
  });
  listeners = [];
  results.cleaned.push('Removed all event listeners');

  timerIds.forEach((id) => clearTimeout(id));
  timerIds = [];
  results.cleaned.push(`Cleared ${results.cleaned.length} timers`);

  delete global.circularNode;
  results.cleaned.push('Removed circular references');

  globalCache = {};
  results.cleaned.push('Cleared cache');

  if (global.gc) {
    global.gc();
    results.cleaned.push('Garbage collection executed (if available)');
  }

  results.memoryAfterCleanup = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB';
  results.status = 'cleaned';

  res.json(results);
};
