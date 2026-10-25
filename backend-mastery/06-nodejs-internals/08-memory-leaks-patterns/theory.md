# Memory Leaks - Patterns & Detection Theory

## What is a Memory Leak?

Memory that's no longer needed but not released.

### Example
```javascript
const cache = {};

function addToCache(id, data) {
  cache[id] = data; // Grows forever
}

// After 1 million calls
// cache object uses gigabytes of RAM
// "Never garbage collected"
```

## Causes of Memory Leaks

### 1. Unbounded Caches
```javascript
// ❌ Grows forever
const cache = new Map();

function cacheData(key, value) {
  cache.set(key, value); // Never deleted
}

// ✅ With limit
class LimitedCache {
  constructor(maxSize) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

### 2. Event Listener Leaks
```javascript
// ❌ Never removed
emitter.on('event', () => {
  console.log('Handler');
});

// Problem: Handler never garbage collected
// Each listener: ~100 bytes
// 100k listeners: ~10MB

// ✅ Clean up
emitter.once('event', () => {
  console.log('Handler');
}); // Removed after first call

// Or remove explicitly
const handler = () => {};
emitter.on('event', handler);
emitter.removeListener('event', handler);
```

### 3. Detached DOM Nodes
```javascript
// Browser-specific, but pattern similar
const nodes = [];

function storeNode(element) {
  nodes.push(element); // Never removed
  element.parentNode.removeChild(element);
  // Element removed from DOM but referenced in array
  // Prevents garbage collection
}
```

### 4. Circular References
```javascript
// Modern GC handles this, but be aware
const obj1 = { name: 'obj1' };
const obj2 = { name: 'obj2' };

obj1.ref = obj2;
obj2.ref = obj1;

// Even if both unreferenced, old engines leak
// Modern V8 handles with generational GC
```

### 5. Timers Not Cleared
```javascript
// ❌ Timer keeps running
const timerId = setInterval(() => {
  console.log('Tick');
  // If interval references large objects, kept in memory
}, 1000);

// ✅ Clear when done
clearInterval(timerId);
```

### 6. Stream Listeners
```javascript
// ❌ Listeners accumulate
fs.createReadStream('file.txt')
  .on('data', (chunk) => {})
  .on('data', (chunk) => {}) // Added again
  .on('data', (chunk) => {}); // Gets called multiple times

// ✅ Use once or removeListener
```

## Detecting Memory Leaks

### Monitoring Heap
```javascript
const used = process.memoryUsage().heapUsed / 1024 / 1024;
console.log(`Heap used: ${used}MB`);

// Track over time
setInterval(() => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Heap: ${used}MB`);
}, 5000);

// Growing heap = potential leak
```

### Heap Snapshot
```javascript
const v8 = require('v8');

// Create snapshot
const snapshot = v8.writeHeapSnapshot();

// Compare before/after operation
// Analyze with Chrome DevTools
```

### Clinic.js
```
npm install clinic
clinic doctor -- node app.js

// Analyzes memory, CPU, I/O
// Shows potential leaks
```

## Common Patterns

### Pattern 1: Growing Array
```javascript
const data = [];

// ❌ Only adds, never removes
function processAndStore(item) {
  data.push(processItem(item));
}

// ✅ Bounded
function processAndStore(item) {
  data.push(processItem(item));
  if (data.length > 10000) {
    data.shift(); // Remove oldest
  }
}
```

### Pattern 2: Closure References
```javascript
// ❌ Closure captures large object
function createHandler() {
  const largeData = new Array(1000000);
  
  return function handler() {
    console.log(largeData.length);
    // largeData always in memory
  };
}

// ✅ Only capture what needed
function createHandler() {
  const size = largeData.length;
  
  return function handler() {
    console.log(size);
    // Only stores number, not array
  };
}
```

### Pattern 3: Module-Level Caches
```javascript
// ❌ Persists across requests
const cache = {};

app.get('/api/data/:id', (req, res) => {
  if (cache[req.params.id]) {
    return res.json(cache[req.params.id]);
  }
  
  const data = fetchData(req.params.id);
  cache[req.params.id] = data; // Grows with users
  res.json(data);
});

// ✅ Use proper cache library
const LRU = require('lru-cache');
const cache = new LRU({ max: 500 });
```

## Testing for Leaks

### Artificial Load Test
```javascript
async function testForLeaks() {
  const initialHeap = process.memoryUsage().heapUsed;
  
  // Do operation 10k times
  for (let i = 0; i < 10000; i++) {
    await serviceFunction();
  }
  
  const finalHeap = process.memoryUsage().heapUsed;
  const increase = (finalHeap - initialHeap) / 1024 / 1024;
  
  console.log(`Memory increase: ${increase}MB`);
  
  if (increase > 50) {
    console.warn('Potential leak detected');
  }
}
```

## GC (Garbage Collection)

### Forcing GC
```javascript
// Run with --expose-gc flag
// node --expose-gc app.js

if (global.gc) {
  global.gc();
}

// Forces garbage collection
// Use carefully (expensive operation)
```

### GC Pauses
```
GC pauses = moment of truth
If taking 500ms+, might have memory issue
```

## Tools & Monitoring

### Node.js Built-in
```
node --prof app.js
node --prof-process isolate-*.log > output.txt
```

### clinic.js
```
npm install -g clinic

clinic doctor -- node app.js
clinic flame -- node app.js
```

### New Relic / DataDog
```
Production monitoring
Memory tracking over time
Alert on anomalies
```

## Best Practices

✅ Always remove event listeners
✅ Use bounded caches
✅ Clear timers when done
✅ Monitor memory regularly
✅ Test with production load
✅ Use profiling tools
✅ Check for circular references
✅ Avoid large closures
✅ Use weak references when appropriate
✅ Document known listeners
