# V8 Garbage Collection & Profiling - Deep Dive

## Overview

The V8 JavaScript engine's garbage collector is responsible for memory management. Understanding how GC works, profiling memory usage, and optimizing for GC performance is critical for production Node.js applications.

## Part 1: V8 Garbage Collection Basics

### What is Garbage Collection?

```javascript
// Automatic memory management in JavaScript

// Memory allocated
let user = { id: 1, name: 'Alice' };

// Used by application
console.log(user.name);

// No longer referenced
user = null;

// Garbage collector detects unreachable object
// Memory is automatically freed

// Without GC, program would eventually crash with "Out of Memory"
```

### Generational Hypothesis

V8 divides memory into generations based on the assumption that:
1. Young objects are more likely to be garbage
2. Old objects are more likely to stay alive

```
Heap Memory:

┌─────────────────────────────────────────┐
│  Young Generation (Eden)                │ ← Most objects start here
│  - New objects allocated here           │
│  - Frequent minor collections           │
│  - Copy survivor objects to next space  │
├─────────────────────────────────────────┤
│  Intermediate Generation                │ ← Survived one GC
│  - Objects that survived GC             │
│  - Less frequent collections            │
├─────────────────────────────────────────┤
│  Old Generation                         │ ← Long-lived objects
│  - Survived multiple GCs                │
│  - Infrequent, expensive collections    │
└─────────────────────────────────────────┘
```

## Part 2: GC Phases

### Scavenge (Young Generation GC)

```
1. Mark phase
   - Find all reachable objects from roots (global, stack)
   - Mark them as "alive"

2. Sweep phase
   - Free unmarked ("dead") objects
   - Compact remaining objects in memory

3. Result
   - Fast, frequent collections
   - Lower pause time (usually < 10ms)
```

### Mark-Sweep (Old Generation GC)

```
1. Mark phase
   - Traverse entire heap from roots
   - Mark all reachable objects
   - Time: milliseconds to seconds for large heaps

2. Sweep phase
   - Iterate memory, free unmarked objects
   - Read/Write barriers for young→old references

3. Compact phase (optional)
   - Defragment memory to prevent fragmentation
   - Time: most expensive part

Result: Long pause times (full GC can pause app for 1000ms+!)
```

## Part 3: Memory Usage Patterns

### Heap Structure

```javascript
const v8 = require('v8');
const heapStats = v8.getHeapStatistics();

console.log(heapStats);
// {
//   totalHeapSize: 104857600,           // 100MB total
//   totalHeapExecutableSize: 10485760,  // 10MB code
//   totalPhysicalSize: 62914560,        // Actual memory used
//   totalAvailableSize: 1234567890,     // Can grow to this
//   heapLimitSize: 2147483648,          // Max heap (2GB 32-bit)
//   ...
// }

// Actual used heap
const mem = process.memoryUsage();
console.log({
  heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
  heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
  rss: Math.round(mem.rss / 1024 / 1024) + 'MB'
});
```

### Memory Leaks Detection

```javascript
// Typical memory leak patterns

// 1. Global variable accumulation
const cache = {}; // Global
function addData(key, value) {
  cache[key] = value; // Grows indefinitely!
}

// 2. Detached DOM nodes (in Electron/Browser context)
let node = document.getElementById('large-element');
document.body.removeChild(node);
// node still referenced, memory not freed

// 3. Circular references with callbacks
class EventEmitter {
  constructor() {
    this.callbacks = [];
  }

  on(callback) {
    this.callbacks.push(callback.bind(this)); // Memory reference
  }
}

// 4. Timers that accumulate
const timers = [];
function startTimer() {
  timers.push(setInterval(() => {
    // Do something
  }, 1000));
}

// Solutions:
// - Clear caches periodically
// - Remove event listeners
// - Clear timers
// - Use WeakMap for caches
```

### Using WeakMap for Caches

```javascript
// ❌ Strong references prevent GC
const cache = new Map();
function cacheUserData(user, data) {
  cache.set(user, data);
  // User object can never be garbage collected
}

// ✅ Weak references allow GC
const weakCache = new WeakMap();
function cacheUserDataSafe(user, data) {
  weakCache.set(user, data);
  // If user is garbage collected, entry is automatically removed
}

// Use case: Metadata about objects without preventing GC
const metadata = new WeakMap();
metadata.set(object, { lastAccessed: Date.now() });
// No risk of memory leak
```

## Part 4: Stop-the-World Pauses

### GC Pause Impact

```javascript
// GC can freeze entire application
function simulateGC() {
  console.log('Request 1 start:', Date.now());
  
  // Garbage collection starts (invisible)
  // Application PAUSES
  
  console.log('Request 1 end:', Date.now());
  // May show 1000ms+ gap if GC ran
}

// In production, this causes:
// - Slow HTTP responses
// - Missed deadlines
// - Poor user experience
// - Possible request timeouts
```

### Incremental Marking

Modern V8 uses incremental marking to reduce pause time:

```
┌──────────────────────────────────────────┐
│ Application Work  │ Mark      │ App Work │
│ (50ms)           │ (10ms GC) │ (50ms)   │
└──────────────────────────────────────────┘

Instead of:
┌────────────────────────────────────────────┐
│ Application Work  │ Full Mark Pause (200ms)│
│ (50ms)           │ (entire GC blocked app)│
└────────────────────────────────────────────┘
```

## Part 5: Profiling and Monitoring

### V8 Profiling Tools

```javascript
const { performance, PerformanceObserver } = require('perf_hooks');
const v8 = require('v8');
const fs = require('fs');

// 1. Create heap snapshot (for offline analysis)
const snapshotStream = v8.writeHeapSnapshot();
console.log('Heap snapshot written to:', snapshotStream);

// 2. Write heap profile (faster, continuous)
function startHeapProfiling() {
  const prof = v8.startSamplingHeapProfiler();
  
  setTimeout(() => {
    const samples = prof.getSampledProfile();
    fs.writeFileSync('heap-profile.json', JSON.stringify(samples));
    prof.stopSamplingHeapProfiler();
  }, 10000); // 10 second profile
}

// 3. GC statistics
function getGCStats() {
  const stats = v8.getHeapCodeStatistics();
  console.log('Code heap size:', stats.code_and_metadata_size);
}
```

### Memory Monitoring

```javascript
const v8 = require('v8');

function monitorMemory() {
  setInterval(() => {
    const mem = process.memoryUsage();
    const stats = v8.getHeapStatistics();
    
    console.log({
      timestamp: new Date().toISOString(),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      heapLimitMB: Math.round(stats.heap_size_limit / 1024 / 1024),
      rss_MB: Math.round(mem.rss / 1024 / 1024),
      gcThrashingRisk: mem.heapUsed / stats.heap_size_limit > 0.9 ? 'HIGH' : 'LOW'
    });
  }, 5000);
}

monitorMemory();
```

### CPU Profiling

```javascript
// Using inspector protocol
const inspector = require('inspector');
const fs = require('fs');

const session = new inspector.Session();
session.connect();

const file = fs.createWriteStream('profile.cpuprofile');

session.post('Profiler.enable', () => {
  session.post('Profiler.start', () => {
    // Your code runs here
    
    setTimeout(() => {
      session.post('Profiler.stop', (err, { profile }) => {
        file.write(JSON.stringify(profile));
        file.end();
        session.disconnect();
      });
    }, 10000); // 10 second profile
  });
});
```

## Part 6: Optimization Strategies

### Reducing Garbage

```javascript
// ❌ Creates many temporary objects (GC pressure)
function processLargeArray(arr) {
  return arr.map(x => ({ value: x * 2 }))
    .filter(x => x.value > 10)
    .reduce((sum, x) => sum + x.value, 0);
}

// ✅ Reuse objects, fewer allocations
function processLargeArrayOptimized(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    const value = arr[i] * 2;
    if (value > 10) {
      sum += value;
    }
  }
  return sum;
}
```

### Object Pool Pattern

```javascript
// Pre-allocate objects to reuse
class ObjectPool {
  constructor(factory, resetFn, size = 100) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.pool = [];
    
    for (let i = 0; i < size; i++) {
      this.pool.push(factory());
    }
  }

  acquire() {
    return this.pool.length > 0 ? this.pool.pop() : this.factory();
  }

  release(obj) {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// Usage
const vectorPool = new ObjectPool(
  () => ({ x: 0, y: 0, z: 0 }),
  (v) => { v.x = v.y = v.z = 0; }
);

const vec = vectorPool.acquire();
vec.x = 10;
// ... use vector ...
vectorPool.release(vec); // Recycle for next use
```

### Controlling Heap Size

```javascript
// Start Node with larger heap
// node --max-old-space-size=2048 app.js (2GB)
// node --max-old-space-size=4096 app.js (4GB)

// In code
if (process.env.NODE_ENV === 'production') {
  // Request immediate GC (requires --expose-gc)
  if (global.gc) {
    setInterval(() => {
      global.gc();
    }, 60000); // Every minute
  }
}

// Detect heap pressure
const v8 = require('v8');
setInterval(() => {
  const stats = v8.getHeapStatistics();
  const ratio = stats.used_heap_size / stats.heap_size_limit;
  
  if (ratio > 0.85) {
    console.log('Heap pressure HIGH - consider scaling');
    if (global.gc) global.gc();
  }
}, 10000);
```

## Part 7: Production Best Practices

### Monitoring and Alerting

```javascript
// Alert when GC pause is too long
const { performance } = require('perf_hooks');

let lastGCTime = 0;

// Detect GC pauses by checking timer precision
setInterval(() => {
  const now = performance.now();
  const delta = now - lastGCTime;
  
  if (delta > 100) { // 100ms pause detected
    logger.warn('Long GC pause detected', { duration: delta });
    metrics.recordGCPause(delta);
  }
  
  lastGCTime = now;
}, 10);
```

### Heap Size Management

```javascript
// Monitor heap and prevent runaway growth
const MAX_HEAP_MB = 1024; // 1GB limit

setInterval(() => {
  const mem = process.memoryUsage();
  const heapUsedMB = mem.heapUsed / 1024 / 1024;
  
  if (heapUsedMB > MAX_HEAP_MB * 0.9) {
    logger.error('Heap near limit', { used: heapUsedMB });
    // Trigger graceful shutdown
    process.exit(1);
  }
}, 30000); // Check every 30 seconds
```

## Summary

- **Generations:** Young objects GC frequently/fast, old objects GC rarely/slow
- **Pause Times:** Full GC can pause app for 100ms-1000ms+
- **Memory Leaks:** Detached objects, circular references, global caches cause leaks
- **WeakMap:** Use for caches that shouldn't prevent GC
- **Profiling:** Use V8 heap snapshots and CPU profilers
- **Optimization:** Object pools, fewer allocations, controlled heap size
- **Monitoring:** Track heap usage and GC pause times in production

This module provides hands-on experience with 17 v8 garbage collection profiling patterns.
