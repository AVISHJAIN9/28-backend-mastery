#!/usr/bin/env python3
"""Generate comprehensive theory.md for Node.js internals modules 01-12"""

BASE = "/Users/avishjain/Downloads/backend-mastery/06-nodejs-internals"

THEORY_NODEJS = {
    "01-event-loop-all-6-phases": """# Event Loop - All 6 Phases Theory

## What is the Event Loop?

The event loop is Node.js's core mechanism for handling asynchronous operations. It's a single-threaded loop that processes callbacks, timers, I/O operations, and more.

### JavaScript is Single-Threaded
```
Node.js runs one JavaScript operation at a time
But can handle multiple I/O operations concurrently
The event loop schedules which operation runs next
```

## The 6 Phases of the Event Loop

```
┌─────────────────────────────────┐
│           timers                │ (setTimeout, setInterval)
├─────────────────────────────────┤
│        pending callbacks        │ (deferred I/O callbacks)
├─────────────────────────────────┤
│           idle, prepare         │ (internal libuv)
├─────────────────────────────────┤
│             poll                │ (retrieve new I/O events)
├─────────────────────────────────┤
│             check               │ (setImmediate)
├─────────────────────────────────┤
│         close callbacks         │ (socket.destroy, etc)
└─────────────────────────────────┘
     (repeat)
```

## Phase 1: Timers

Executes callbacks scheduled by `setTimeout()` and `setInterval()`

### How It Works
```javascript
setTimeout(() => console.log('timer'), 100);

// Event loop checks: Has 100ms passed?
// If yes, execute callback
// If no, skip this phase
```

### Important: Not Precise
```javascript
setTimeout(() => {
  console.log('Timer fired');
}, 100);

// Actual delay might be 102-105ms (not exact)
// Subject to system load, other operations
```

## Phase 2: Pending Callbacks

Executes I/O callbacks that were deferred from previous cycle

### Examples
```
- TCP errors
- Filesystem errors
- Network errors
- Some callbacks from previous phase
```

## Phase 3: Idle & Prepare

Internal use by Node.js/libuv. Not visible to user code.

## Phase 4: Poll

Most time spent here. Waits for new I/O events and executes their callbacks.

### Poll Phase Logic
```javascript
// Can be summarized as:
1. Calculate how long to block (timeout)
2. Process I/O events (from file descriptors)
3. Execute I/O callbacks immediately
4. If no more I/O, move to check phase
```

### Poll Examples
```
- Reading files
- Network requests
- Database queries
- Any file descriptor operations
```

### Poll Can Block
```
If there are timers set:
- Poll blocks for max 1000ms (or until I/O)

If no timers:
- Poll can block indefinitely
- Until new I/O event arrives
```

## Phase 5: Check

Executes callbacks scheduled by `setImmediate()`

### setImmediate() Purpose
```
Run this after poll phase (when I/O blocked)
Good for: Heavy computation after I/O
```

### setImmediate vs setTimeout
```javascript
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));

// In most cases output is:
// immediate
// timeout
// (but depends on current phase)
```

## Phase 6: Close Callbacks

Executes close handlers

### Examples
```javascript
socket.on('close', () => {
  console.log('Socket closed - this runs in close phase');
});

fs.close(fd, () => {
  console.log('File closed - this runs in close phase');
});
```

## Event Loop Cycle Pseudo-code

```javascript
while (eventLoop.waitForTask()) {
  // Phase 1: Timers
  executeTimerCallbacks();
  
  // Phase 2: Pending I/O callbacks
  executePendingCallbacks();
  
  // Phase 3: Idle (internal)
  
  // Phase 4: Poll
  waitForIOEvents();
  executeIOCallbacks();
  
  // Phase 5: Check
  executeSetImmediateCallbacks();
  
  // Phase 6: Close
  executeCloseCallbacks();
  
  // Repeat
}
```

## Order of Execution Example

```javascript
console.log('Script start');

setTimeout(() => console.log('timeout 0'), 0);

setImmediate(() => console.log('immediate'));

Promise.resolve().then(() => console.log('promise'));

console.log('Script end');

// Output:
// Script start
// Script end
// promise (microtask)
// immediate (check phase)
// timeout (timers phase)
```

## Microtasks vs Macrotasks

### Microtasks (Between Phases)
```
- Promises (.then, .catch, .finally)
- queueMicrotask()
- MutationObserver

Execute immediately after current operation
Before moving to next phase
```

### Macrotasks (Phases)
```
- setTimeout/setInterval (timers)
- setImmediate (check)
- I/O callbacks (poll)
```

## Key Concepts

### Blocking the Event Loop
```
If one operation takes 1000ms
Other operations delayed 1000ms
Single-threaded = bottleneck
```

### Non-Blocking I/O
```
File read starts (async)
Event loop continues (can handle others)
When file ready, callback queued
Event loop eventually executes callback
```

## Best Practices

✅ Keep callbacks short
✅ Use async/await for readability
✅ Monitor event loop for blocking operations
✅ Understand phase order
✅ Use setImmediate for heavy work after I/O
✅ Avoid synchronous operations in production
✅ Test with production load
✅ Monitor callback queue depth
✅ Use profiling tools to identify bottlenecks
✅ Defer heavy computation to worker threads
""",

    "02-nexttick-vs-promise-resolve": """# process.nextTick vs Promise.then() Theory

## Two Different Queues

JavaScript has TWO places where callbacks queue:

```
1. Microtask Queue (Promises, queueMicrotask)
   └─ Executed BEFORE next event loop phase
   
2. Macrotask Queue (Timers, I/O, setImmediate)
   └─ Executed during event loop phases
```

## process.nextTick()

### What Does It Do?
```javascript
process.nextTick(() => {
  console.log('This runs ASAP');
});

console.log('Main');

// Output:
// Main
// runs ASAP
```

### When It Runs
```
After current operation completes
Before event loop continues
```

### Priority
```
Highest priority after current JS execution
Even before Promises
Even before setImmediate
```

## Promise.then() (Microtasks)

### Queue Position
```javascript
console.log('Start');

Promise.resolve().then(() => {
  console.log('Promise');
});

process.nextTick(() => {
  console.log('nextTick');
});

console.log('End');

// Output:
// Start
// End
// nextTick (runs first)
// Promise (runs after)
```

### Execution Order
```
1. Synchronous code
2. process.nextTick callbacks
3. All Promises
4. Event loop phases (timers, I/O, etc)
```

## Complete Example

```javascript
console.log('Start');

// Phase 1: setTimeout (will run in timers phase)
setTimeout(() => {
  console.log('setTimeout');
}, 0);

// Phase 2: Promise (microtask queue)
Promise.resolve()
  .then(() => console.log('Promise 1'))
  .then(() => console.log('Promise 2'));

// Phase 3: process.nextTick
process.nextTick(() => {
  console.log('nextTick 1');
});

process.nextTick(() => {
  console.log('nextTick 2');
});

// Phase 4: setImmediate (check phase)
setImmediate(() => {
  console.log('setImmediate');
});

console.log('End');

// Output:
// Start
// End
// nextTick 1
// nextTick 2
// Promise 1
// Promise 2
// setTimeout
// setImmediate
```

## Use Cases

### process.nextTick
```
✅ Run code after I/O event handlers
✅ Essential for error handling
✅ Allow stack to unwind before callback
✅ Guarantee immediate execution

Example:
EventEmitter uses nextTick internally
```

### Promises
```
✅ Async/await chaining
✅ Error handling with .catch()
✅ Multiple async operations
✅ Standard JavaScript pattern
```

## Important Distinction

### nextTick Runs First
```javascript
process.nextTick(() => console.log('A'));
Promise.resolve().then(() => console.log('B'));

// A
// B (always)
```

### Why The Order?
```
nextTick = Node.js specific (higher priority)
Promises = JavaScript standard (lower priority)
```

## Real-World Scenario

```javascript
function processFile() {
  readFile((err, data) => {
    if (err) {
      // Queue error handler for next iteration
      process.nextTick(() => {
        throw err; // Caught by top-level handler
      });
    }
  });
}
```

## Performance Implications

### Microtask Queue Can Starve Event Loop
```javascript
function infinite() {
  Promise.resolve().then(infinite);
}
infinite();

// setTimeout never runs!
// Promises keep consuming phase
```

### nextTick Same Issue
```javascript
function infinite() {
  process.nextTick(infinite);
}
infinite();

// All other code starved!
```

## Best Practices

✅ Use Promises for general async work
✅ Use process.nextTick for error handling
✅ Don't chain unlimited nextTicks
✅ Avoid deep Promise chains
✅ Use async/await for readability
✅ Monitor Promise queue depth
✅ Test with realistic workloads
✅ Be aware of starvation risks
✅ Use modern async patterns
✅ Profile your event loop
""",

    "03-blocking-event-loop": """# Blocking the Event Loop Theory

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
""",

    "04-buffers-and-streams": """# Buffers and Streams Theory

## What is a Buffer?

A fixed-size chunk of memory outside the JavaScript heap.

### Why Buffers?
```
JavaScript strings = Unicode characters (variable size)
Network/files = Raw bytes (fixed size)
Need conversion layer = Buffer
```

### Buffer Size
```javascript
const buf = Buffer.alloc(10); // 10 bytes
console.log(buf.length); // 10

// Can hold binary data
// [0x00, 0x01, 0x02, ...]
```

## Creating Buffers

### From String
```javascript
const buf = Buffer.from('Hello', 'utf8');
// Converts string to UTF-8 bytes

console.log(buf); // <Buffer 48 65 6c 6c 6f>
console.log(buf.toString()); // "Hello"
```

### Allocating Empty
```javascript
const buf = Buffer.alloc(10); // 10 bytes, zeros
const buf2 = Buffer.allocUnsafe(10); // Faster, might have data

// ⚠️ allocUnsafe might contain sensitive data
// Always initialize before use
```

### From Array
```javascript
const buf = Buffer.from([1, 2, 3, 4]);
console.log(buf); // <Buffer 01 02 03 04>
```

## Buffer Operations

### Concatenation
```javascript
const buf1 = Buffer.from('Hello ');
const buf2 = Buffer.from('World');

const combined = Buffer.concat([buf1, buf2]);
console.log(combined.toString()); // "Hello World"
```

### Slicing
```javascript
const buf = Buffer.from('Hello World');
const slice = buf.slice(0, 5);
console.log(slice.toString()); // "Hello"
```

### Encoding
```javascript
// Supported encodings
const encodings = ['utf8', 'utf16le', 'hex', 'base64', 'ascii'];

const buf = Buffer.from('Hello', 'utf8');
console.log(buf.toString('hex')); // "48656c6c6f"
console.log(buf.toString('base64')); // "SGVsbG8="
```

## What are Streams?

Data flows piece-by-piece instead of all at once.

### Stream vs Non-Stream
```
Non-Stream (RAMish):
1. Load entire 1GB file to memory
2. Process
3. Use 1GB RAM

Stream:
1. Read chunk (16KB)
2. Process
3. Read next chunk
4. Process
Uses constant memory
```

## Stream Types

### Readable
```javascript
const fs = require('fs');
const readable = fs.createReadStream('file.txt');

readable.on('data', (chunk) => {
  console.log(chunk); // Buffer of data
});
```

### Writable
```javascript
const writable = fs.createWriteStream('output.txt');

writable.write('Hello ');
writable.write('World');
writable.end(); // No more data
```

### Duplex (Both)
```
TCP sockets
WebSocket
Can read and write
```

### Transform
```javascript
const transform = fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'));

// Compress on the fly
```

## Backpressure

### Problem
```
Reader fast (1MB/s)
Writer slow (100KB/s)
Data piles up in memory
→ Memory leak!
```

### Solution: Backpressure Handling
```javascript
const readable = fs.createReadStream('large.txt');
const writable = fs.createWriteStream('copy.txt');

readable.on('data', (chunk) => {
  const ok = writable.write(chunk);
  
  if (!ok) {
    // Writer can't keep up
    readable.pause();
  }
});

writable.on('drain', () => {
  // Writer ready for more
  readable.resume();
});
```

### Pipe Does This Automatically
```javascript
// ✅ Auto handles backpressure
fs.createReadStream('large.txt')
  .pipe(fs.createWriteStream('copy.txt'));

// Equivalent to manual above
```

## Stream Events

### Readable
```javascript
readable.on('data', (chunk) => {});  // Chunk ready
readable.on('end', () => {});        // All data read
readable.on('error', (err) => {});   // Error occurred
readable.on('close', () => {});      // Underlying closed
```

### Writable
```javascript
writable.on('drain', () => {});      // Ready for more
writable.on('finish', () => {});     // All written
writable.on('error', (err) => {});   // Error
writable.on('close', () => {});      // Closed
```

## Piping

### Simple Pipe
```javascript
// Copy file without loading to memory
fs.createReadStream('source.txt')
  .pipe(fs.createWriteStream('dest.txt'));

// Handles backpressure automatically
```

### Pipe Chain
```javascript
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())  // Compress
  .pipe(fs.createWriteStream('input.txt.gz'));
```

### Error Handling
```javascript
readable
  .pipe(writable)
  .on('error', (err) => {
    console.error('Write error:', err);
  });

readable.on('error', (err) => {
  console.error('Read error:', err);
});
```

## Memory Management

### Buffer Sizes
```
Default chunk size: 16KB (readable), 16KB (writable)
Can tune highWaterMark

const readable = fs.createReadStream('file.txt', {
  highWaterMark: 64 * 1024 // 64KB chunks
});
```

### Why Object Pools?
```
Creating many buffers = GC pressure
Can reuse buffers = Better performance
Pool pattern for streams
```

## Performance Comparison

### Loading Entire File
```javascript
// ❌ 100MB file → 100MB memory
const data = fs.readFileSync('100mb.bin');
console.log(data.length);
```

### Streaming
```javascript
// ✅ 100MB file → ~16KB memory at a time
fs.createReadStream('100mb.bin')
  .pipe(process.stdout);
```

## Best Practices

✅ Use streams for large files
✅ Handle backpressure with pipe
✅ Always attach error listeners
✅ Close streams properly
✅ Use highWaterMark appropriately
✅ Stream for network data
✅ Buffer for small operations
✅ Monitor memory with streams
✅ Test backpressure scenarios
✅ Use pipeline() for cleanup
""",

    "05-async-local-storage": """# AsyncLocalStorage Theory

## What is AsyncLocalStorage?

A way to store data that follows async contexts.

### The Problem
```
Middleware sets user data
Later, in async handler, need user data
But async breaks context...

// ❌ Doesn't work reliably
app.use((req, res, next) => {
  req.userId = 123;
  next();
});

// Later in database call
db.find().then(() => {
  console.log(req.userId); // Lost!
});
```

### Solution: AsyncLocalStorage
```javascript
const { AsyncLocalStorage } = require('async_hooks');
const storage = new AsyncLocalStorage();

// Store data
storage.run({ userId: 123 }, () => {
  // Available in all async calls within this context
  db.find().then(() => {
    console.log(storage.getStore().userId); // 123!
  });
});
```

## How It Works

### Context Propagation
```
Main thread creates storage
├─ Context 1 (userId: 1)
│  ├─ Async operation A
│  ├─ Async operation B
│  └─ All see userId: 1
├─ Context 2 (userId: 2)
│  ├─ Async operation C
│  └─ All see userId: 2
└─ Each async chain remembers its context
```

## Basic Usage

### Setting Up
```javascript
const { AsyncLocalStorage } = require('async_hooks');

class RequestContext {
  constructor(userId, requestId) {
    this.userId = userId;
    this.requestId = requestId;
  }
}

const storage = new AsyncLocalStorage();
```

### Storing Data
```javascript
app.use((req, res, next) => {
  const ctx = new RequestContext(req.user.id, req.id);
  
  storage.run(ctx, () => {
    next();
  });
});
```

### Retrieving Data
```javascript
// From anywhere in that request chain
const ctx = storage.getStore();
console.log(ctx.userId); // Available!
```

## Real-World Example: Logging

### Without AsyncLocalStorage
```javascript
// Must pass requestId manually through all functions
function handle(req, res) {
  const requestId = req.id;
  
  getUserData(requestId, (data) => {
    saveData(requestId, data, () => {
      console.log('Done:', requestId);
    });
  });
}

// ❌ Tedious to pass everywhere
```

### With AsyncLocalStorage
```javascript
const storage = new AsyncLocalStorage();

function logger(msg) {
  const ctx = storage.getStore();
  console.log(`[${ctx.requestId}] ${msg}`);
}

app.use((req, res, next) => {
  storage.run({ requestId: req.id }, () => {
    next();
  });
});

app.get('/data', async (req, res) => {
  logger('Fetching data'); // Auto includes requestId
  const data = await db.find();
  logger('Data fetched');  // Auto includes requestId
  res.json(data);
});
```

## Async Context Preservation

### Promises
```javascript
const { AsyncLocalStorage } = require('async_hooks');
const storage = new AsyncLocalStorage();

storage.run({ id: 1 }, () => {
  Promise.resolve()
    .then(() => {
      console.log(storage.getStore().id); // 1
    });
});
```

### Callbacks
```javascript
storage.run({ id: 2 }, () => {
  setTimeout(() => {
    console.log(storage.getStore().id); // 2
  }, 100);
});
```

### async/await
```javascript
storage.run({ id: 3 }, async () => {
  await somePromise();
  console.log(storage.getStore().id); // 3
});
```

## Nested Contexts

### Context Isolation
```javascript
storage.run({ id: 1 }, () => {
  console.log(storage.getStore().id); // 1
  
  storage.run({ id: 2 }, () => {
    console.log(storage.getStore().id); // 2 (shadowed)
  });
  
  console.log(storage.getStore().id); // 1 (restored)
});
```

## Error Handling

### Preserves Context
```javascript
storage.run({ userId: 123 }, () => {
  Promise.reject('Error!')
    .catch(() => {
      // Context still available!
      logger('Error occurred');
    });
});
```

## Use Cases

### 1. Request Tracking
```javascript
storage.run({ 
  requestId: uuid(),
  userId: req.user.id,
  ip: req.ip
}, () => {
  // Use context throughout request lifecycle
});
```

### 2. Multi-Tenancy
```javascript
storage.run({ 
  tenantId: req.tenantId,
  database: getDatabaseForTenant(req.tenantId)
}, () => {
  // All queries automatically use correct tenant
});
```

### 3. Transaction Management
```javascript
storage.run({ 
  transactionId: uuid(),
  connection: db.getConnection()
}, () => {
  // All operations use same transaction/connection
});
```

## Performance Considerations

### Memory Overhead
```
Each context: ~100 bytes
1000 concurrent requests: ~100KB
Acceptable for most applications
```

### Lookup Speed
```
O(1) constant time
getStore() very fast
No performance penalty
```

## Best Practices

✅ Create storage at module level
✅ Use for request-scoped data
✅ Wrap entire request handler
✅ Consistent context structure
✅ Document what's in context
✅ Clean up context on error
✅ Test async context flow
✅ Don't put huge objects
✅ Use for logging/tracing
✅ Consider Thread Local Storage in native modules
""",

    "06-worker-threads": """# Worker Threads Theory

## What is a Worker Thread?

A separate JavaScript execution context running in parallel.

### Node.js is Single-Threaded
```
Problems:
- CPU-bound work blocks event loop
- Can't use multiple CPU cores
- Heavy computation freezes serving requests

Solution: Worker threads
- Run JavaScript in separate OS thread
- Still managed by Node.js
- Communicate via message passing
```

## Why Worker Threads?

### CPU-Bound Work
```
Main thread: Handling HTTP requests
Heavy computation: Encrypt passwords, image processing

❌ If in main thread: Blocks all requests
✅ If in worker: Main thread free
```

### Multi-Core Utilization
```
CPU cores available: 8
Node.js (no workers): Uses 1 core (~12.5% potential)
Node.js (workers): Can use all 8 cores (~100%)
```

## Creating Worker Threads

### Basic Worker
```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js');

worker.on('message', (result) => {
  console.log('Result:', result);
});

worker.postMessage({ task: 'calculate', value: 40 });
```

### Worker Script
```javascript
// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', (msg) => {
  if (msg.task === 'calculate') {
    const result = fibonacci(msg.value);
    parentPort.postMessage(result);
  }
});

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

## Communication

### Message Passing
```javascript
// Main thread
worker.postMessage({ command: 'start', data: 100 });

// Worker
parentPort.on('message', (msg) => {
  console.log('Received:', msg);
  parentPort.postMessage({ status: 'done' });
});
```

### Transferable Objects
```javascript
// More efficient for large data
const buffer = Buffer.alloc(1024);

// Transfer ownership (not copy)
worker.postMessage(
  { buffer },
  [buffer] // Transferable list
);

// ⚠️ Cannot use buffer in main thread after transfer
// Only use in worker
```

## Worker Pool

### Pattern
```javascript
const workers = [];

for (let i = 0; i < 4; i++) {
  workers.push(new Worker('./worker.js'));
}

let nextWorkerIndex = 0;

function runTask(data) {
  const worker = workers[nextWorkerIndex++];
  nextWorkerIndex %= workers.length;
  
  return new Promise((resolve) => {
    worker.once('message', resolve);
    worker.postMessage(data);
  });
}
```

### Worker Thread Pool Library
```javascript
// npm install piscina
const Piscina = require('piscina');

const pool = new Piscina({
  minThreads: 2,
  maxThreads: 8,
});

const result = await pool.run({ value: 40 });
```

## Use Cases

### 1. Heavy Computation
```javascript
// Fibonacci, sorting large arrays, image processing
const worker = new Worker('./compute.js');
worker.postMessage({ type: 'fibonacci', n: 40 });
```

### 2. Crypto Operations
```javascript
// Password hashing, encryption, signing
const worker = new Worker('./crypto.js');
worker.postMessage({
  type: 'hash',
  password: 'secret',
  rounds: 10
});
```

### 3. Data Processing
```javascript
// JSON parsing huge files, CSV processing
const worker = new Worker('./process.js');
worker.postMessage({ file: 'large-data.csv' });
```

## Sharing Memory

### SharedArrayBuffer
```javascript
// Shared memory between threads
const shared = new SharedArrayBuffer(1024);
const array = new Int32Array(shared);

worker.postMessage({ buffer: shared });

// Both can read/write simultaneously
array[0] = 42;
```

### Atomic Operations
```javascript
// Safe concurrent access
Atomics.store(array, 0, 123);
const value = Atomics.load(array, 0);

// Prevents race conditions
```

## Limitations

### Everything Cloned
```
Can't pass: DOM nodes, functions, class instances
Can pass: Primitives, objects, typed arrays, buffers
```

### Context Separated
```
Main thread: process, global
Worker: Own process, own global
Separate Node.js contexts
```

## Error Handling

### Catching Errors
```javascript
const worker = new Worker('./worker.js');

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

worker.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Worker died with code ${code}`);
  }
});
```

## Performance

### Overhead
```
Creating worker: ~50-100ms
Memory per worker: ~30MB
Message passing: ~1-5ms per message

Worth it for: Heavy computation > 100ms
```

## Best Practices

✅ Use for CPU-bound work
✅ Use worker pool library
✅ Set max threads to CPU count
✅ Handle errors and exit codes
✅ Don't overuse workers
✅ Profile before optimizing
✅ Use SharedArrayBuffer for shared data
✅ Clean up workers properly
✅ Test with realistic workload
✅ Monitor memory usage
""",

    "07-child-process-spawn-exec-fork": """# Child Process - spawn, exec, fork Theory

## What is Child Process?

Starting a separate process from Node.js.

### Use Cases
```
- Run system commands (ffmpeg, ImageMagick)
- Execute other languages (Python, Ruby)
- Long-running tasks
- Process isolation
```

## The 4 Methods

### 1. spawn() - Stream-Based

Best for large data/streaming

```javascript
const { spawn } = require('child_process');

const child = spawn('ls', ['-l']);

child.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});
```

### 2. exec() - Full Output in Callback

Best for small commands

```javascript
const { exec } = require('child_process');

exec('ls -l', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});
```

### 3. execFile() - No Shell

Like exec() but no shell overhead

```javascript
const { execFile } = require('child_process');

execFile('node', ['script.js'], (err, stdout) => {
  console.log(stdout);
});
```

### 4. fork() - Node to Node

Spawns another Node.js process with IPC channel

```javascript
const { fork } = require('child_process');

const child = fork('./child.js');

child.send({ hello: 'world' });
child.on('message', (msg) => {
  console.log(msg);
});
```

## spawn() Deep Dive

### Streaming Output
```javascript
const { spawn } = require('child_process');

const ls = spawn('ls');
ls.stdout.pipe(process.stdout);
```

### Handling Events
```javascript
spawn('ls')
  .on('close', (code) => {
    console.log(`Process exited with code ${code}`);
  })
  .on('error', (err) => {
    console.error('Failed to start:', err);
  });
```

### Large Output
```javascript
// Good for video encoding, file processing
spawn('ffmpeg', [
  '-i', 'input.mp4',
  '-c:v', 'libx264',
  'output.mp4'
]).on('exit', () => {
  console.log('Encoding done');
});
```

## exec() vs execFile()

### exec() - With Shell
```javascript
exec('cat file.txt | grep "pattern"', (err, stdout) => {
  // Shell pipes work
});

// ⚠️ Shell injection risk
// exec(`cat ${filename}`) // UNSAFE!
```

### execFile() - No Shell
```javascript
execFile('grep', ['pattern', 'file.txt'], (err, stdout) => {
  // Faster, no shell overhead
});

// Safer from injection
```

## fork() for Node Modules

### Child Process
```javascript
// child.js
process.on('message', (msg) => {
  console.log('Message from parent:', msg);
  
  // Send back result
  process.send({
    result: msg.value * 2,
    processId: process.pid
  });
});
```

### Parent Process
```javascript
// parent.js
const { fork } = require('child_process');

const child = fork('./child.js');

child.send({ value: 10 });
child.on('message', (msg) => {
  console.log('Received:', msg.result); // 20
});
```

## Output Handling

### Buffer Limit
```javascript
// exec() has 200KB default buffer
exec('huge_command', (err, stdout, stderr) => {
  // Output > 200KB = error
});

// spawn() has no limit (streams output)
spawn('huge_command').stdout.pipe(process.stdout);
```

### Large Files
```
❌ exec() with large output: Entire output in memory
✅ spawn() with large output: Streamed, low memory
✅ spawn() piped: Data flows directly
```

## Error Handling

### spawn()
```javascript
const child = spawn('command', ['arg']);

child.on('error', (err) => {
  console.error('spawn error:', err);
});

child.on('close', (code, signal) => {
  if (code !== 0) {
    console.error(`Process exited: ${code}`);
  }
});
```

### exec()
```javascript
exec('command', (err, stdout, stderr) => {
  if (err) {
    console.error('Command failed:', err);
    return;
  }
  console.log(stdout);
});
```

## Detached Processes

### Keep Running After Parent Dies
```javascript
const child = spawn('long_task', {
  detached: true,
  stdio: 'ignore'
});

child.unref(); // Don't keep parent alive

// Parent can exit, child still runs
```

## Performance

### spawn() vs exec()
```
spawn: ~2-5ms to start, streaming
exec: ~5-10ms to start, buffers output

For large output: spawn() much better
For small output: exec() simpler
```

## IPC with fork()

### Two-Way Communication
```javascript
// parent.js
const child = fork('./worker.js');

function calculate(value) {
  return new Promise((resolve) => {
    child.once('message', resolve);
    child.send({ task: 'calculate', value });
  });
}

const result = await calculate(40);
```

### Serialization
```javascript
// Data serialized via JSON
child.send({
  string: 'text',
  number: 42,
  array: [1, 2, 3],
  buffer: Buffer.from([1, 2, 3])
  // function: () => {} // NOT serializable
});
```

## PromisifiedVersion
```javascript
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function runCommand() {
  try {
    const {stdout, stderr} = await exec('ls -l');
    console.log(stdout);
  } catch (err) {
    console.error(err);
  }
}
```

## Best Practices

✅ Use spawn() for large output
✅ Use exec() for simple commands
✅ Use fork() for Node-to-Node
✅ Handle errors always
✅ Set timeout on long processes
✅ Validate command inputs
✅ Use execFile() over exec() when possible
✅ Don't detach unnecessarily
✅ Clean up child processes
✅ Monitor resource usage
""",

    "08-memory-leaks-patterns": """# Memory Leaks - Patterns & Detection Theory

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
""",

    "09-graceful-shutdown": """# Graceful Shutdown Theory

## Why Graceful Shutdown?

### Hard Shutdown (Bad)
```
Process killed immediately
├─ Database transaction: Rolled back
├─ File operation: Incomplete write
├─ HTTP connection: Abrupt close
├─ User: "Connection lost"
└─ Data corruption: Possible
```

### Graceful Shutdown (Good)
```
Process notified to shut down
├─ Stop accepting new requests
├─ Wait for in-flight requests
├─ Complete current operations
├─ Close connections cleanly
├─ Persist any cache/state
└─ Exit cleanly
```

## Shutdown Signals

### SIGTERM
```
Graceful termination request
Most common, deployments send this
Process CAN ignore (but shouldn't)
```

### SIGKILL
```
Forceful kill
Process CANNOT ignore
Last resort (process doesn't respond to SIGTERM)
```

### SIGHUP
```
Terminal disconnected
Historically meant reload config
```

## Implementing Graceful Shutdown

### Basic Pattern
```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Hello');
});

server.listen(3000);

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force exit after timeout
  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 5000);
});
```

## Cleanup Tasks

### 1. Stop Accepting Connections
```javascript
server.close(); // No more new connections
// Existing connections stay open

// But don't accept new ones
// Load balancer stops routing
```

### 2. Wait for Current Requests
```javascript
server.close((err) => {
  if (err) {
    console.error('Errors:', err);
    process.exit(1);
  }
  console.log('All connections closed');
  process.exit(0);
});
```

### 3. Close Database Connections
```javascript
process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});
```

### 4. Flush Buffers
```javascript
process.on('SIGTERM', async () => {
  await cache.flush();
  await logger.flush();
  process.exit(0);
});
```

## Timeout Pattern

### Force Exit if Takes Too Long
```javascript
process.on('SIGTERM', async () => {
  console.log('Starting graceful shutdown...');
  
  const timeout = setTimeout(() => {
    console.error('Shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000); // 10 second timeout
  
  try {
    await closeConnections();
    clearTimeout(timeout);
    process.exit(0);
  } catch (err) {
    console.error('Shutdown error:', err);
    process.exit(1);
  }
});
```

## Example: Express Server

```javascript
const express = require('express');
const app = express();

const server = app.listen(3000);

// Track active sockets
const activeRequests = new Set();

app.use((req, res, next) => {
  activeRequests.add(req);
  res.on('finish', () => activeRequests.delete(req));
  next();
});

let isShuttingDown = false;

app.get('/', (req, res) => {
  if (isShuttingDown) {
    res.status(503).send('Server shutting down');
    return;
  }
  res.send('Hello');
});

process.on('SIGTERM', async () => {
  isShuttingDown = true;
  
  // Stop accepting new connections
  server.close(async () => {
    // Close connections
    await db.close();
    process.exit(0);
  });
  
  // Wait 30s, then force exit
  setTimeout(() => {
    console.error('Shutdown timeout');
    process.exit(1);
  }, 30000);
});
```

## Testing Graceful Shutdown

### Manual Test
```bash
# Start server
node app.js

# In another terminal
kill -SIGTERM <pid>

# Observe: Connections closed gracefully, no errors
```

### Load Test
```bash
# Start server
node app.js

# Simulate load
ab -n 1000 -c 100 http://localhost:3000/

# While requests running, send SIGTERM
kill -SIGTERM <pid>

# Should complete all requests before exiting
```

## Docker Considerations

### Stop Signal
```dockerfile
# In Dockerfile
STOPSIGNAL SIGTERM

# Docker sends SIGTERM when container stops
# Your app has 10 seconds to gracefully shutdown
# Then Docker sends SIGKILL
```

### Handling Both
```javascript
let stopping = false;

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown); // Ctrl+C

async function shutdown() {
  if (stopping) return;
  stopping = true;
  
  // Cleanup
  process.exit(0);
}
```

## PM2 / Supervisor Integration

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'app',
    script: './app.js',
    max_memory_restart: '500M',
    kill_timeout: 5000, // 5 seconds to shutdown
  }]
};
```

## Best Practices

✅ Handle SIGTERM and SIGINT
✅ Stop accepting new requests first
✅ Close DB connections
✅ Flush buffers/logs
✅ Set timeout for forced exit
✅ Test graceful shutdown
✅ Document shutdown behavior
✅ Monitor shutdown logs
✅ Use health checks
✅ Drain request queues
""",

    "10-cluster-module-all-cpu-cores": """# Cluster Module - Using All CPU Cores Theory

## Why Cluster?

### Single Process
```
Default Node.js: Single-threaded
Resources: Using 1 of 8 CPU cores (12.5%)
Problem: Wasting potential
```

### Cluster
```
Master process
├─ Worker 1 (Core 1)
├─ Worker 2 (Core 2)
├─ Worker 3 (Core 3)
└─ ... (matches CPU cores)

Resources: Using ~80-90% of all cores
Throughput: ~8x improvement on 8-core system
```

## Cluster Architecture

### Master: IPC Hub
```
Listens for SIGTERM
Manages workers
Restarts dead workers
Handles admin tasks
```

### Workers: Do Real Work
```
Each worker runs identical Express/Koa app
Handle HTTP requests
Serve users
Process independently
```

## Basic Implementation

```javascript
const cluster = require('cluster');
const os = require('os');
const express = require('express');

if (cluster.isMaster) {
  // Master process
  const numCPUs = os.cpus().length;
  
  console.log(`Master ${process.pid} starting ${numCPUs} workers`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.pid} died`);
    cluster.fork(); // Restart
  });
} else {
  // Worker process
  const app = express();
  
  app.get('/', (req, res) => {
    res.send(`Handled by worker ${process.pid}`);
  });
  
  app.listen(3000);
  console.log(`Worker ${process.pid} started`);
}
```

## Load Balancing

### OS Automatically Balances
```
Port 3000 listened by all workers
OS kernel distributes incoming connections
Each new connection → round-robin to workers
Efficient distribution automatically
```

### Sticky Sessions
```
Problem: HTTP request → Worker A
         Same client → Worker B
         Session lost!

Solution: Sticky sessions
- Route same client to same worker
- Based on IP or session cookie
```

## Resilience

### Dead Worker Restart
```javascript
cluster.on('exit', (worker, code, signal) => {
  if (signal) {
    console.log(`Worker killed by ${signal}`);
  } else if (code !== 0) {
    console.log(`Worker exit code ${code}`);
  }
  
  // Always restart
  if (process.uptime() < 120) {
    console.log('Restarting too soon, waiting...');
    setTimeout(() => cluster.fork(), 5000);
  } else {
    cluster.fork();
  }
});
```

### Graceful Worker Reload
```javascript
function reloadWorkers() {
  const workers = Object.values(cluster.workers);
  
  for (const worker of workers) {
    worker.disconnect();
    worker.send('shutdown');
  }
  
  setTimeout(() => {
    for (let i = 0; i < os.cpus().length; i++) {
      cluster.fork();
    }
  }, 5000);
}
```

## Communication

### Master to Worker
```javascript
// Master
worker.send({ cmd: 'reload' });

// Worker
process.on('message', (msg) => {
  if (msg.cmd === 'reload') {
    reloadConfig();
  }
});
```

### Worker to Master
```javascript
// Worker
process.send({ status: 'ready', pid: process.pid });

// Master
cluster.on('message', (worker, msg) => {
  console.log(`Worker ${worker.id} says:`, msg);
});
```

## Performance Considerations

### Throughput
```
Single worker: 1000 requests/sec
4 workers: ~3800 requests/sec (diminishing returns)
8 workers: ~6500 requests/sec
```

### Memory
```
Each worker: Node.js process
Base: ~50MB per process
With app: ~100-200MB per process

8 workers: 800MB-1600MB total
Usually acceptable trade-off
```

## Shared State Problem

### ❌ Problem
```
Worker 1: cache['key'] = 'value1'
Worker 2: cache['key'] = ??? (empty)

Each worker has own memory space
No automatic sharing
```

### ✅ Solution: Shared Cache
```javascript
// Use Redis or Memcached
const redis = require('redis');
const client = redis.createClient();

// All workers use same Redis
await client.set('key', 'value');
const value = await client.get('key'); // All get same value
```

## Horizontal Scaling vs Clustering

### Clustering
```
- One machine, multiple cores
- IPC communication
- Faster
- Shared file system
```

### Horizontal Scaling
```
- Multiple machines
- Network communication (slower)
- Geo-distributed
- Needs load balancer (nginx)
```

## Zero-Downtime Deployment

### Rolling Restart
```javascript
// Restart workers one at a time
const workers = Object.values(cluster.workers);

for (const worker of workers) {
  worker.disconnect();
  
  // New worker started
  cluster.fork();
  
  // Wait for stability
  await delay(3000);
  
  // Continue to next
}
```

## Monitoring Workers

### Track Worker Health
```javascript
setInterval(() => {
  const workers = Object.values(cluster.workers);
  
  for (const worker of workers) {
    console.log(`Worker ${worker.id}: ${worker.state}`);
  }
  
  workers.forEach(worker => {
    if (worker.state === 'disconnected') {
      console.warn(`Worker ${worker.id} disconnected, restarting`);
      cluster.fork();
    }
  });
}, 5000);
```

## Best Practices

✅ Use number of CPU cores
✅ Restart dead workers
✅ Use shared external cache (Redis)
✅ Implement graceful shutdown
✅ Monitor worker health
✅ Test under load
✅ Rolling updates for deployment
✅ Set timeout on graceful disconnect
✅ Log worker lifecycle events
✅ Track requests per worker
""",

    "11-async-await-patterns": """# async/await Patterns Theory

## What is async/await?

Syntactic sugar over Promises.

```javascript
// Promise style
function getUser() {
  return fetch('/api/user')
    .then(r => r.json())
    .then(user => user);
}

// async/await style
async function getUser() {
  const r = await fetch('/api/user');
  const user = await r.json();
  return user;
}
```

## Async Function

### Returns Promise
```javascript
async function test() {
  return 42;
}

// Returns Promise<42>
test().then(result => console.log(result)); // 42
```

### Always Promise
```javascript
// Even if no await used
async function simple() {
  return 42;
}

// Equivalent to:
function simpleEquivalent() {
  return Promise.resolve(42);
}
```

## Await

### Waits for Promise
```javascript
async function test() {
  const user = await getUser(); // Pauses here
  console.log(user); // Resumes after promise resolves
}
```

### Unwraps Promise
```javascript
// Promise<number>
const promise = Promise.resolve(42);

// number
const value = await promise;
```

### Only Works in async
```javascript
// ❌ Invalid
const value = await promise;

// ✅ Valid
async function test() {
  const value = await promise;
}
```

## Error Handling

### try/catch
```javascript
async function getUser() {
  try {
    const response = await fetch('/api/user');
    const user = await response.json();
    return user;
  } catch (err) {
    console.error('Failed:', err.message);
    throw err;
  }
}
```

### Cleanup with finally
```javascript
async function operation() {
  try {
    const connection = await db.connect();
    const data = await connection.query();
    return data;
  } finally {
    await connection.close(); // Always runs
  }
}
```

## Parallel Execution

### Sequential (Slow)
```javascript
// Takes 2+ seconds
async function getDataSequential() {
  const user = await getUser();    // 1 second
  const posts = await getUserPosts(); // 1 second
  return { user, posts };           // 2 seconds
}
```

### Parallel (Fast)
```javascript
// Takes 1+ seconds
async function getDataParallel() {
  const [user, posts] = await Promise.all([
    getUser(),           // Starts immediately
    getUserPosts()       // Starts immediately
  ]);                    // Both ~1 second
  return { user, posts };
}
```

## Promise.all Patterns

### Basic
```javascript
async function test() {
  const [a, b, c] = await Promise.all([
    promise1,
    promise2,
    promise3
  ]);
}
```

### With Results
```javascript
async function test() {
  const results = await Promise.all(
    users.map(user => fetchUserData(user.id))
  );
  // All completed successfully
}
```

### Error Handling
```javascript
async function test() {
  try {
    await Promise.all([
      operation1(),
      operation2(), // If this fails
      operation3()  // operation3 still runs (not cancelled)
    ]);
  } catch (err) {
    // One failed, thrown here
  }
}
```

## Promise.race

### First Completes
```javascript
async function getWithTimeout() {
  const result = await Promise.race([
    fetch('/api/data'),
    delay(5000).then(() => {throw new Error('Timeout')})
  ]);
  return result;
}
```

## Modern Patterns

### Promise.allSettled
```javascript
async function test() {
  const results = await Promise.allSettled([
    promise1,
    promise2,
    promise3
  ]);
  
  // All complete (success or fail)
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      console.log(result.value);
    } else {
      console.error(result.reason);
    }
  });
}
```

### Promise.any
```javascript
async function test() {
  const result = await Promise.any([
    fetch('server1.com'),
    fetch('server2.com'),
    fetch('server3.com')
  ]);
  // First successful (ignores failures)
}
```

## Anti-Patterns

### ❌ Not Parallel
```javascript
async function bad() {
  const a = await fetchA();        // 1s
  const b = await fetchB();        // 1s
  const c = await fetchC();        // 1s
  return { a, b, c };              // 3s
}

// ✅ Parallel
async function good() {
  const [a, b, c] = await Promise.all([
    fetchA(), fetchB(), fetchC()    // 1s
  ]);
  return { a, b, c };
}
```

### ❌ Forgetting return
```javascript
async function test() {
  try {
    return await operation();
  } catch {}
  // Silently fails if operation throws
}

// ✅ Proper
async function test() {
  try {
    return await operation();
  } catch (err) {
    throw err; // Rethrow
  }
}
```

### ❌ Async Event Handler
```javascript
// ❌ Error swallowed
button.addEventListener('click', async () => {
  throw new Error('Oops');
  // Error lost
});

// ✅ Catch it
button.addEventListener('click', async () => {
  try {
    // operation
  } catch (err) {
    console.error(err);
  }
});
```

## Common Patterns

### Retry Logic
```javascript
async function retryWithBackoff(fn, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxAttempts - 1) throw err;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

### Map with Concurrency Control
```javascript
async function mapWithConcurrency(items, fn, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(fn)
    );
    results.push(...chunkResults);
  }
  return results;
}
```

### Timeout Wrapper
```javascript
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
}

// Usage
await withTimeout(fetch('/api/data'), 5000);
```

## Best Practices

✅ Use async/await for readability
✅ Parallelize independent operations
✅ Proper error handling with try/catch
✅ Avoid deep nesting
✅ Handle errors from Promise.all
✅ Don't await in loops (use Promise.all)
✅ Add timeouts to prevent hanging
✅ Return in try block
✅ Use finally for cleanup
✅ Test error paths
""",

    "12-express-routing-internals": """# Express Routing Internals Theory

## Express Router Architecture

Express routing has multiple layers.

```
HTTP Request
   ↓
App middleware
   ↓
Route matching (Express Router)
   ├─ Path matching
   ├─ Method matching
   └─ Parameter extraction
   ↓
Route middleware
   ↓
Route handler
   ↓
Response sent
```

## Route Definition

### Basic Route
```javascript
app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});

// Method: GET
// Path: /users/:id
// Handler: Function
```

### Parameters
```javascript
// /:id → req.params.id
app.get('/users/:id', (req, res) => {
  console.log(req.params.id); // "123"
});

// /:userId/posts/:postId
app.get('/:userId/posts/:postId', (req, res) => {
  console.log(req.params.userId);  // User ID
  console.log(req.params.postId);  // Post ID
});
```

## Route Matching

### Exact Match First
```javascript
app.get('/users', (req, res) => res.send('List'));
app.get('/users/:id', (req, res) => res.send('Single'));
app.get('/users/admin', (req, res) => res.send('Admin'));

// GET /users → "List"
// GET /users/admin → "ADMIN" (exact match wins)
// GET /users/123 → "Single"
```

### Pattern Matching
```javascript
// Literal
app.get('/api/users', handler); // Only /api/users

// Parameter
app.get('/api/:resource', handler); // /api/users, /api/posts

// Regex
app.get(/\/api\/\d+/, handler); // /api/123 but not /api/abc

// Optional
app.get('/files/:name?', handler); // /files or /files/document
```

## Middleware Stack

### Order Matters
```javascript
// ✅ Correct
app.use(authenticate);
app.get('/secret', handler);

// ❌ Wrong
app.get('/secret', handler);
app.use(authenticate);
// authenticate never runs for /secret
```

### Route-Level Middleware
```javascript
app.get(
  '/admin',
  authenticate,      // Runs first
  authorize('admin'), // Runs second
  (req, res) => {     // Handler
    res.send('Done');
  }
);
```

### Multiple Middleware
```javascript
// Array syntax
app.get('/route', [auth, validate, handler]);

// Inline
app.get('/route', auth, validate, handler);
```

## Router Nesting

### Sub-router
```javascript
const userRouter = express.Router();

userRouter.get('/', (req, res) => {
  res.send('All users');
});

userRouter.get('/:id', (req, res) => {
  res.send(`User ${req.params.id}`);
});

app.use('/api/users', userRouter);

// GET /api/users → "All users"
// GET /api/users/123 → "User 123"
```

### Advantages
```
✅ Modular routing
✅ Separate by feature
✅ Cleaner code
✅ Reusable routers
```

## Route Priority

### Registration Order
```javascript
// Registered first
app.get('/users/:id', handler1);

// Registered second
app.get('/users/admin', handler2);

// GET /users/admin → Matches FIRST route
// handler1 receives { id: 'admin' }
// handler2 never runs!

// Fix: Exact routes first
app.get('/users/admin', handler2);
app.get('/users/:id', handler1);
```

## Parameter Extraction

### URL Parameters
```javascript
app.get('/posts/:postId', (req, res) => {
  console.log(req.params.postId); // "123"
});
```

### Query String
```javascript
app.get('/search', (req, res) => {
  console.log(req.query.q); // "javascript"
});

// GET /search?q=javascript
```

### Request Body
```javascript
app.post('/users', (req, res) => {
  console.log(req.body.name); // "John"
});

// Requires body-parser middleware
```

## Route Methods

### All HTTP Methods
```javascript
app.get('/route', handler);      // GET
app.post('/route', handler);     // POST
app.put('/route', handler);      // PUT
app.patch('/route', handler);    // PATCH
app.delete('/route', handler);   // DELETE
app.options('/route', handler);  // OPTIONS

app.all('/route', handler);      // ANY method
```

## Next Function

### Passing to Next Handler
```javascript
const mw1 = (req, res, next) => {
  console.log('MW1');
  req.user = { id: 1 };
  next(); // Continue to next
};

const mw2 = (req, res, next) => {
  console.log('MW2');
  console.log(req.user.id); // 1
  next();
};

app.get('/route', mw1, mw2, (req, res) => {
  res.send('Done');
});

// Output:
// MW1
// MW2
// Done
```

### Skipping Routes
```javascript
app.get('/route1', (req, res, next) => {
  if (someCondition) {
    return next('route'); // Skip other routes
  }
  res.send('Route 1');
});

app.get('/route2', (req, res) => {
  res.send('Route 2');
});

// If condition true, goes to /route2
```

## Error Handling Routes

### Error Middleware
```javascript
// Must have 4 parameters (err, req, res, next)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// Must be last
```

## Route Caching

### Express Routes Cached
```javascript
// First request: Compile route
app.get('/users/:id', (req, res) => {
  res.send('Handling');
});

// Subsequent requests: Use cached route matcher
// Very fast (microseconds)
```

## RESTful Conventions

### Standard Pattern
```javascript
// List all
app.get('/api/users', getUsers);

// Get one
app.get('/api/users/:id', getUser);

// Create
app.post('/api/users', createUser);

// Update
app.put('/api/users/:id', updateUser);

// Delete
app.delete('/api/users/:id', deleteUser);
```

## Best Practices

✅ Define exact routes before parameters
✅ Use routers for large apps
✅ Place error handler last
✅ Handle all errors with try/catch
✅ Use consistent naming
✅ Document routes
✅ Return early to avoid extra work
✅ Use middleware for cross-cutting concerns
✅ Test route parameters
✅ Consider route performance
""",
}

def write(module_dir, content):
    path = f"{BASE}/{module_dir}/theory.md"
    with open(path, 'w') as f:
        f.write(content)
    chars = len(content)
    lines = len(content.split('\n'))
    print(f"✅ {module_dir} → {lines} lines ({chars} chars)")

for mod, content in THEORY_NODEJS.items():
    write(mod, content)

print(f"\n✅ All 12 Node.js internals theory.md files generated!")
