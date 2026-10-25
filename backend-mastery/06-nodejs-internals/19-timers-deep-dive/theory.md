# Timers: Deep Dive Theory

## What Are Node.js Timers?

Timers are the mechanism to schedule code execution for later. They're crucial to Node.js's asynchronous nature.

### Three Main Timer Functions

```javascript
// 1. setTimeout - Execute once after delay
setTimeout(() => console.log('done'), 1000);

// 2. setInterval - Execute repeatedly at interval
setInterval(() => console.log('tick'), 1000);

// 3. setImmediate - Execute ASAP (check phase)
setImmediate(() => console.log('immediate'));
```

## Timer Internals

### How setTimeout Works

```javascript
// setTimeout doesn't actually wait 1000ms
// Instead, it registers callback in timer heap
// Event loop checks: "Has 1000ms passed?"

setTimeout(() => {
  console.log('done'); // Runs in timers phase
}, 1000);

// Meanwhile, other code can run
console.log('start');
```

### Timer Precision

```javascript
// Timers are NOT precise!
const start = Date.now();
setTimeout(() => {
  const actual = Date.now() - start;
  console.log(`Expected: 100ms, Actual: ${actual}ms`);
}, 100);

// Output: Expected: 100ms, Actual: 107ms
// Driftcaused by event loop load
```

### Timer Precision Factors

```
1. System Load
   - Heavy CPU usage delays timers
   - Other tasks scheduled

2. Event Loop Phases
   - Timers phase might be busy
   - Poll phase might hold callback

3. Granularity
   - Linux: ~1ms granularity
   - Windows: ~15ms granularity

4. JavaScript Execution
   - Previous callback still running
   - Can't interrupt current code
```

## setTimeout vs setInterval

### setTimeout - One Time

```javascript
// Executes exactly once
const timeout = setTimeout(() => {
  console.log('This runs once');
}, 1000);

// Can cancel before it runs
clearTimeout(timeout);
```

### setInterval - Repeated

```javascript
// Executes every 1000ms indefinitely
const interval = setInterval(() => {
  console.log('This repeats');
}, 1000);

// Must manually stop it
clearInterval(interval);
```

### Interval Skew

```javascript
// Intervals can skew if callback takes time
const start = Date.now();
let count = 0;

setInterval(() => {
  count++;
  if (count > 5) return;
  
  // Simulate work
  for (let i = 0; i < 100000000; i++) {}
  
  console.log(`Interval ${count}: ${Date.now() - start}ms`);
}, 100);

// Intervals drift further apart each time
```

## setImmediate

### What is setImmediate?

Executes in the Check phase (after poll phase).

```javascript
setImmediate(() => {
  console.log('Check phase');
});

setTimeout(() => {
  console.log('Timers phase');
}, 0);

// Output:
// Timers phase
// Check phase
```

### Event Loop Reminder

```
┌─────────────────┐
│  Timers phase   │ ← setTimeout runs here
├─────────────────┤
│  Pending I/O    │
├─────────────────┤
│  Poll phase     │ ← Main I/O waiting
├─────────────────┤
│  Check phase    │ ← setImmediate runs here
├─────────────────┤
│ Close callbacks │
└─────────────────┘
```

### setTimeout(fn, 0) vs setImmediate

```javascript
// setImmediate is slightly faster
console.time('setImmediate');
setImmediate(() => console.timeEnd('setImmediate'));

console.time('setTimeout');
setTimeout(() => console.timeEnd('setTimeout'), 0);

// setImmediate typically faster in I/O context
```

## Microtasks vs Macrotasks

### The Queue Hierarchy

```
1. Execute current script
2. Execute ALL microtasks
   - Promise.then / .catch / .finally
   - queueMicrotask()
   - process.nextTick() [Node.js specific]
3. Execute ONE macrotask
   - setTimeout
   - setInterval
   - setImmediate
   - I/O
4. Back to step 2
```

### Visual Example

```javascript
console.log('1. Start');

setTimeout(() => console.log('2. setTimeout'), 0);

Promise.resolve()
  .then(() => console.log('3. Promise'));

setImmediate(() => console.log('4. setImmediate'));

console.log('5. End');

// Output order:
// 1. Start
// 5. End
// 3. Promise  ← Microtask runs before macrotask
// 2. setTimeout
// 4. setImmediate
```

## Timer.unref() and Timer.ref()

### The Problem

```javascript
// This process NEVER exits!
setInterval(() => {
  console.log('tick');
}, 1000);

// JavaScript keeps running waiting for interval
// Press Ctrl+C to stop
```

### The Solution: unref()

```javascript
// This process WILL exit after 3 seconds
const timer = setInterval(() => {
  console.log('tick');
}, 1000);

// "Don't keep process alive for this timer"
timer.unref();

setTimeout(() => {
  console.log('Exit now');
  process.exit(0);
}, 3000);

// Process exits at 3 seconds, even though interval still "pending"
```

### Real-World: Keep-Alive Checker

```javascript
function createKeepAlive(interval = 5000) {
  const timer = setInterval(() => {
    console.log('Server still alive');
  }, interval);

  // Don't keep process alive just for this timer
  timer.unref();

  return timer;
}

// Process can exit normally even with timer running
const keepAlive = createKeepAlive(5000);

// Process will exit if no other work to do
setTimeout(() => console.log('All done'), 2000);
```

### Ref'ing Back

```javascript
const timer = setInterval(() => {
  console.log('tick');
}, 1000);

// Make timer unreferenced
timer.unref();
console.log('Timer unreferenced');

// Later, make it referenced again
timer.ref();
console.log('Timer referenced again - keeps process alive');
```

## process.nextTick()

### Different from setImmediate

```javascript
console.log('start');

process.nextTick(() => console.log('nextTick'));
setImmediate(() => console.log('setImmediate'));

console.log('end');

// Output:
// start
// end
// nextTick  ← Runs BEFORE anything else
// setImmediate
```

### nextTick vs Promise.then

```javascript
console.log('1');

process.nextTick(() => console.log('2'));
Promise.resolve().then(() => console.log('3'));
process.nextTick(() => console.log('4'));

// Output: 1, 2, 4, 3
// nextTick has separate queue from Promises
```

## Timer Precision Patterns

### Measuring Real Timing

```javascript
function measureTimerDrift(delay, iterations) {
  return new Promise((resolve) => {
    const results = [];
    let count = 0;

    function scheduleNext() {
      const start = Date.now();
      setTimeout(() => {
        const actual = Date.now() - start;
        results.push({
          expected: delay,
          actual,
          drift: actual - delay
        });
        
        count++;
        if (count < iterations) {
          scheduleNext();
        } else {
          resolve(results);
        }
      }, delay);
    }

    scheduleNext();
  });
}

// Usage
measureTimerDrift(100, 10).then(results => {
  console.log('Timer Drift Analysis');
  results.forEach((r, i) => {
    console.log(`${i}: ${r.actual}ms (drift: ${r.drift}ms)`);
  });
});
```

### Adaptive Timing

```javascript
function adaptiveTimer(callback, targetDelay) {
  let lastTime = Date.now();
  let cumulativeDrift = 0;

  function adaptiveCallback() {
    const now = Date.now();
    const actualDelay = now - lastTime;
    const drift = actualDelay - targetDelay;
    
    cumulativeDrift += drift;
    
    callback({
      actualDelay,
      drift,
      cumulativeDrift
    });

    lastTime = now;
    
    // Adjust next timer to compensate for drift
    const nextDelay = Math.max(1, targetDelay - cumulativeDrift);
    setTimeout(adaptiveCallback, nextDelay);
  }

  setTimeout(adaptiveCallback, targetDelay);
}

// Usage - maintains ~100ms interval despite drift
adaptiveTimer((timing) => {
  console.log(`Actual: ${timing.actualDelay}ms, Drift: ${timing.drift}ms`);
}, 100);
```

## Timer Leaks

### Creating Leaks

```javascript
// LEAK: Interval never stopped
setInterval(() => {
  console.log('leaked');
}, 100);

// LEAK: Timer references accumulate
const timers = [];
for (let i = 0; i < 1000000; i++) {
  timers.push(setTimeout(() => {}, 1000));
}
// Memory leak - all timers kept in memory
```

### Preventing Leaks

```javascript
// GOOD: Store and clean up
const timers = [];

function startTimers() {
  for (let i = 0; i < 100; i++) {
    timers.push(setTimeout(() => {}, 1000));
  }
}

function cleanup() {
  timers.forEach(t => clearTimeout(t));
  timers.length = 0;
}

startTimers();
// Later...
cleanup();
```

### Automatic Cleanup

```javascript
class TimerManager {
  constructor() {
    this.timers = [];
  }

  setTimeout(fn, delay) {
    const id = setTimeout(fn, delay);
    this.timers.push(id);
    return id;
  }

  setInterval(fn, delay) {
    const id = setInterval(fn, delay);
    this.timers.push(id);
    return id;
  }

  clearAll() {
    this.timers.forEach(id => {
      clearTimeout(id);
      clearInterval(id);
    });
    this.timers = [];
  }
}

// Usage
const tm = new TimerManager();
tm.setTimeout(() => console.log('done'), 1000);
tm.setInterval(() => console.log('tick'), 100);

// Cleanup all
tm.clearAll();
```

## Performance Optimization

### Batch Timers

```javascript
// BAD: Many quick timers
for (let i = 0; i < 1000; i++) {
  setTimeout(() => doWork(i), 100);
}

// GOOD: Single timer with work queue
const queue = Array.from({ length: 1000 }, (_, i) => i);
const timer = setInterval(() => {
  const batch = queue.splice(0, 10);
  batch.forEach(doWork);
  
  if (queue.length === 0) {
    clearInterval(timer);
  }
}, 100);
```

### RequestAnimationFrame Alternative

```javascript
// Browser-like for Node - immediate async execution
function scheduleWork(fn) {
  setImmediate(fn);
}

// Vs immediate but not blocking
function scheduleAsync(fn) {
  Promise.resolve().then(fn);
}
```

## Common Mistakes

### Mistake 1: Expecting Precise Timing

```javascript
// WRONG - Assumes timers are precise
setTimeout(() => {
  console.log('exactly 100ms passed');
}, 100);
// Actual: 102-110ms depending on load

// RIGHT - Measure actual timing
const start = Date.now();
setTimeout(() => {
  const actual = Date.now() - start;
  console.log(`Expected 100, got ${actual}`);
}, 100);
```

### Mistake 2: Forgetting to Clear Intervals

```javascript
// WRONG - Interval never stops
setInterval(() => {
  console.log('forever');
}, 100);

// RIGHT
const id = setInterval(() => {
  console.log('controlled');
}, 100);

// Later...
clearInterval(id);
```

### Mistake 3: Storing Timers Wrong

```javascript
// WRONG - Only stores last timer
for (let i = 0; i < 10; i++) {
  const id = setTimeout(() => {}, 1000);
}
// Can't access any but last timer

// RIGHT - Store all
const timers = [];
for (let i = 0; i < 10; i++) {
  timers.push(setTimeout(() => {}, 1000));
}
```

## Timer Summary

| Feature | setTimeout | setInterval | setImmediate | process.nextTick |
|---------|-----------|-------------|--------------|-----------------|
| Execution | Once | Repeated | Check phase | After current script |
| Precise | No | No (drifts) | No | N/A |
| Clearable | Yes | Yes | No | N/A |
| unref() | Yes | Yes | No | No |
| Use Case | Delayed task | Polling | I/O check | Deferred sync |

## Key Takeaways

1. Timers are NOT precise - affected by event loop load
2. Use setImmediate for I/O-related work, setTimeout for delays
3. Use unref() for timers that shouldn't keep process alive
4. Always clear intervals to prevent leaks
5. Understand microtasks (Promises) vs macrotasks (timers)
6. Measure actual timing, don't assume precision
