# Event Loop - All 6 Phases Theory

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
