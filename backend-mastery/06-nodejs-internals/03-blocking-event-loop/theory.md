# Blocking the Event Loop Theory

## What is Blocking?

When your code takes so long that other operations must wait.

### Single-Threaded Problem
```
Thread 1: Processing request A (5 seconds)
         ↓ (during this time)
Queue:   - Request B (waiting)
         - Request C (waiting)  
         - Database query (waiting)
         - Timer callback (waiting)

Result: Everything delayed 5+ seconds
```

## Synchronous vs Asynchronous

### Synchronous (Blocking)
```javascript
const result = fs.readFileSync('file.txt');
console.log(result);

// readFileSync BLOCKS until file read
// Nothing else can run
```

### Asynchronous (Non-Blocking)
```javascript
fs.readFile('file.txt', (err, result) => {
  console.log(result);
});
console.log('Reading...');

// readFile starts (returns immediately)
// "Reading..." logs right away
// Callback runs when file ready
```

## Event Loop Starvation

### Scenario
```javascript
// Process huge array
function processAllUsers() {
  for (let i = 0; i < 10000000; i++) {
    processUser(users[i]); // Heavy computation
  }
}

// While this runs:
// - setTimeout callbacks delayed
// - HTTP requests piling up
// - Database operations waiting
// - No throughput for other users
```

### Result
```
One slow request blocks all others
100 concurrent requests = 100x slower each
Unacceptable performance
```

## Detecting Blocking

### Latency Spikes
```
Normally: Request response time 50ms
With blocking: Response time 5000ms
Indicates: Event loop blocked
```

### Node.js Lag Monitor
```javascript
const lag = require('event-loop-lag');

setInterval(() => {
  console.log(`Lag: ${lag()}ms`);
}, 1000);

// Low lag: < 10ms (healthy)
// High lag: > 1000ms (problem!)
```

## Common Blocking Operations

### 1. Large Synchronous Computations
```javascript
// ❌ BAD: Blocks event loop
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.time('fib');
console.log(fibonacci(40));
console.timeEnd('fib');
// Takes 10-30 seconds, blocks everything
```

### 2. Synchronous File Operations
```javascript
// ❌ BAD
const data = fs.readFileSync('huge-file.txt');
const json = JSON.parse(data);

// ✅ GOOD
fs.readFile('huge-file.txt', (err, data) => {
  const json = JSON.parse(data);
});
```

### 3. Large JSON Operations
```javascript
// ❌ BAD: Parsing huge JSON blocks
const huge = JSON.parse(massiveString); // 100MB

// ✅ GOOD: Stream or chunk
const parser = JSONStream.parse('*');
```

### 4. Heavy Crypto Operations
```javascript
// ❌ BAD: Blocks for seconds
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derived) => {
  // ...
});

// ✅ GOOD: Use Worker thread (if many calls)
```

## Solutions

### 1. Break Work into Chunks
```javascript
// ❌ Bad: One huge loop
for (let i = 0; i < 1000000; i++) {
  processItem(i);
}

// ✅ Good: Process in batches
async function processInBatches() {
  for (let i = 0; i < 1000000; i += 1000) {
    await processBatch(i, i + 1000);
    await setImmediate(() => {}); // Let event loop breathe
  }
}
```

### 2. Use setImmediate to Defer
```javascript
function heavyLoop() {
  for (let i = 0; i < DATA.length; i++) {
    if (i % 1000 === 0) {
      // Every 1000 items, defer
      return setImmediate(() => heavyLoop()); 
    }
    processItem(DATA[i]);
  }
}
```

### 3. Use Worker Threads
```javascript
// Offload to separate thread
const { Worker } = require('worker_threads');

const worker = new Worker('./compute.js');
worker.on('message', (result) => {
  console.log(result); // Heavy computation done
});

// Main thread free to handle other requests
```

### 4. Use async/await with I/O
```javascript
// ✅ Good: I/O is async
async function getUser(id) {
  const user = await db.findOne({_id: id});
  const posts = await db.findMany({userId: id});
  return { user, posts };
}
```

## Case Study: Node.js at Scale

### Scenario
```
Server handling 1000 concurrent requests
Each request: 20ms computation + 10ms I/O
```

### Good Implementation
```
- All requests finish in ~30ms total
- Event loop constantly switching requests
- I/O waiting doesn't block CPU
```

### Bad Implementation (Blocking)
```
- Request 1: 20ms computation (blocks all)
- All other requests: waiting
- Response time: 1000 * 30ms = 30 seconds!
```

## Monitoring Event Loop

### Simple Tracker
```javascript
let lastCheck = Date.now();
setInterval(() => {
  const now = Date.now();
  const delay = now - lastCheck - 1000; // Expected 1000ms
  
  if (delay > 100) {
    console.warn(`Event loop lag: ${delay}ms`);
  }
  
  lastCheck = now;
}, 1000);
```

### Production Tools
```
- Node.js --prof (CPU profiling)
- clinic.js (Event loop analysis)
- New Relic (APM monitoring)
- DataDog (Distributed tracing)
```

## Best Practices

✅ Use async/await, not sync operations
✅ Break long computations into chunks
✅ Use Worker threads for CPU-bound work
✅ Monitor event loop lag
✅ Defer non-critical work with setImmediate
✅ Stream large files instead of loading
✅ Test with production-like load
✅ Profile bottlenecks
✅ Set timeouts on operations
✅ Keep callbacks short
