# Worker Threads Theory

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
