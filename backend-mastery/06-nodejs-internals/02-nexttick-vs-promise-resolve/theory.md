# process.nextTick vs Promise.then() Theory

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
