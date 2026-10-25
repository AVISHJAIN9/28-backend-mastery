# Debugging & Inspector Theory

## What is Node.js Inspector?

The Inspector module connects Node.js to Chrome DevTools via the Chrome DevTools Protocol (CDP), enabling real-time debugging, profiling, and execution analysis.

### The Chrome DevTools Protocol

```
Node.js Process
    ↓
Inspector Protocol (WebSocket)
    ↓
Chrome DevTools Frontend
    ↓
Visual debugging, profiling, performance analysis
```

## Starting the Inspector

### 1. Basic Debugging

```bash
# Start with default inspector port (9229)
node --inspect server.js

# Output:
# Debugger listening on ws://127.0.0.1:9229/...
# For help, see: https://nodejs.org/en/docs/inspector
```

### 2. Custom Port

```bash
# Use specific port
node --inspect=9000 server.js

# Or with IP binding
node --inspect=0.0.0.0:9229 server.js
```

### 3. Break on Start

```bash
# Break execution immediately at first line
node --inspect-brk server.js

# Useful for debugging startup code
# Also works: node --debug-brk=9229 server.js
```

## Connecting to Chrome DevTools

### Step 1: Start Node with Inspector

```bash
node --inspect server.js
# Debugger listening on ws://127.0.0.1:9229/...
```

### Step 2: Open Chrome DevTools

1. Open Chrome
2. Navigate to: `chrome://inspect`
3. Click "Inspect" under your Node.js process

### Alternative: Direct Access

```javascript
// Node.js will print DevTools URL
// Open that URL directly in browser
```

## Inspector API

### Using The Inspector Module

```javascript
const inspector = require('inspector');

// Get connection URL
const url = inspector.url();
console.log('Connect to:', url);

// Check if inspector is open
if (inspector.url()) {
  console.log('Debugger connected');
}

// Create session for programmatic access
const session = new inspector.Session();
session.connect();

// Send commands to debugger
session.post('Debugger.enable', (err, result) => {
  if (err) {
    console.error('Failed to enable debugger');
  } else {
    console.log('Debugger enabled');
  }
});
```

## Debugging Patterns

### 1. Basic Breakpoint Simulation

```javascript
// Simulate breakpoint with console logging
function debugFunction(value) {
  console.log('DEBUG: Breakpoint at start, value =', value);
  
  let result = value * 2;
  console.log('DEBUG: After calculation, result =', result);
  
  return result;
}

debugFunction(42);
// DEBUG: Breakpoint at start, value = 42
// DEBUG: After calculation, result = 84
```

### 2. Conditional Breakpoint

```javascript
// Break only under certain conditions
function processData(data) {
  if (data.id > 100) {
    console.log('DEBUG: Suspicious ID, breakpoint triggered');
    debugger; // Can use actual debugger statement
  }
  
  return data.id * 2;
}

// In DevTools, this stops execution when condition is true
```

### 3. Watch Expression

```javascript
let state = { count: 0, active: true };

function updateState() {
  state.count++;
  
  // Monitor changes with logging
  console.log('STATE:', JSON.stringify(state));
  
  if (state.count > 10) {
    state.active = false;
  }
}
```

## Profiling Techniques

### 1. CPU Profiling

```javascript
const inspector = require('inspector');
const fs = require('fs');

function startCPUProfile(filename) {
  const session = new inspector.Session();
  session.connect();

  const fileName = filename + '.cpuprofile';
  
  session.post('Profiler.enable', () => {
    session.post('Profiler.startPreciseCoverage', () => {
      console.log('CPU profiling started');
    });
  });

  // Stop after 10 seconds
  setTimeout(() => {
    session.post('Profiler.stopPreciseCoverage', (err, data) => {
      if (!err) {
        fs.writeFileSync(fileName, JSON.stringify(data));
        console.log(`Profile saved to ${fileName}`);
      }
      session.disconnect();
    });
  }, 10000);
}

startCPUProfile('cpu-profile');
```

### 2. Memory Profiling

```javascript
// Simple memory tracking
function trackMemory() {
  setInterval(() => {
    const usage = process.memoryUsage();
    console.log('Memory Stats:');
    console.log(`  HeapUsed: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  HeapTotal: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
  }, 5000);
}

trackMemory();
```

### 3. Heap Snapshots

```javascript
// Trigger heap snapshot manually
function captureHeapSnapshot() {
  const inspector = require('inspector');
  const fs = require('fs');
  const session = new inspector.Session();
  
  session.connect();
  session.post('HeapProfiler.enable', () => {
    session.post('HeapProfiler.takeHeapSnapshot', (err, data) => {
      if (!err) {
        fs.writeFileSync('heap-snapshot.heapsnapshot', JSON.stringify(data));
        console.log('Heap snapshot saved');
      }
      session.disconnect();
    });
  });
}

captureHeapSnapshot();
```

## Performance Analysis

### 1. CPU Usage Tracking

```javascript
// Track CPU usage over time
function trackCPUUsage() {
  let lastUsage = process.cpuUsage();
  
  setInterval(() => {
    const usage = process.cpuUsage();
    const userDiff = usage.user - lastUsage.user;
    const systemDiff = usage.system - lastUsage.system;
    
    console.log('CPU Usage (µs):');
    console.log(`  User: ${userDiff}`);
    console.log(`  System: ${systemDiff}`);
    
    lastUsage = usage;
  }, 1000);
}

trackCPUUsage();
```

### 2. Memory Leak Detection

```javascript
// Detect growing heap
function detectMemoryLeak() {
  const samples = [];
  
  setInterval(() => {
    const usage = process.memoryUsage();
    samples.push(usage.heapUsed);
    
    // Keep last 60 samples (1 minute)
    if (samples.length > 60) {
      samples.shift();
    }
    
    // Check for consistent growth
    if (samples.length > 10) {
      let increasing = true;
      for (let i = 1; i < samples.length; i++) {
        if (samples[i] <= samples[i - 1]) {
          increasing = false;
          break;
        }
      }
      
      if (increasing) {
        console.warn('⚠️ Potential memory leak detected');
      }
    }
  }, 1000);
}

detectMemoryLeak();
```

### 3. Event Loop Lag

```javascript
// Measure event loop blocking
function measureEventLoopLag() {
  let lastCheck = Date.now();
  
  setInterval(() => {
    const now = Date.now();
    const expectedInterval = 100;
    const actualInterval = now - lastCheck;
    const lag = actualInterval - expectedInterval;
    
    if (lag > 10) {
      console.warn(`Event loop lag: ${lag}ms`);
    }
    
    lastCheck = now;
  }, 100);
}

measureEventLoopLag();
```

## Breakpoint Debugging

### 1. Debugger Statement

```javascript
const url = new URL('http://example.com');

debugger; // Execution pauses here if debugger is open

console.log(url.hostname); // Resumes from here
```

### 2. Conditional Debugger

```javascript
function criticalFunction(value) {
  // Only break on specific conditions
  if (value < 0 || value > 1000) {
    debugger;
  }
  
  return value * 2;
}

criticalFunction(-5); // Pauses
criticalFunction(50); // Doesn't pause
```

### 3. Try-Catch Debugging

```javascript
// Break on caught exceptions
try {
  const result = riskyOperation();
} catch (error) {
  debugger; // Allows inspection of error
  console.error('Error occurred:', error.message);
}
```

## Advanced Debugging

### 1. Stack Trace Analysis

```javascript
// Capture current stack
function getCurrentStack() {
  const obj = {};
  Error.captureStackTrace(obj, getCurrentStack);
  return obj.stack;
}

function levelA() {
  levelB();
}

function levelB() {
  levelC();
}

function levelC() {
  console.log(getCurrentStack());
  // Shows execution path: levelA -> levelB -> levelC
}

levelA();
```

### 2. Function Tracing

```javascript
// Trace all function calls
function traceCall(fn, name) {
  return function(...args) {
    console.log(`→ ${name} called with:`, args);
    const result = fn.apply(this, args);
    console.log(`← ${name} returned:`, result);
    return result;
  };
}

const add = traceCall((a, b) => a + b, 'add');
const multiply = traceCall((a, b) => a * b, 'multiply');

add(2, 3);         // → add called with: [2, 3]
multiply(4, 5);    // → multiply called with: [4, 5]
```

### 3. Performance Monitoring

```javascript
// Measure function execution time
function withTiming(fn, name) {
  return async function(...args) {
    const start = performance.now();
    
    try {
      const result = await fn.apply(this, args);
      const duration = performance.now() - start;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`${name} failed after ${duration.toFixed(2)}ms:`, error.message);
      throw error;
    }
  };
}

async function slowFunction() {
  await new Promise(r => setTimeout(r, 100));
  return 'result';
}

const measured = withTiming(slowFunction, 'slowFunction');
measured(); // slowFunction took 100.23ms
```

## Common Debugging Patterns

### 1. Silent Error Handler

```javascript
// Avoid swallowing errors - log them
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', err.stack);
  }
  
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
```

### 2. Request Logging

```javascript
// Track all requests
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});
```

### 3. Memory Snapshot Before/After

```javascript
// Compare memory usage
function withMemoryTracking(fn, name) {
  return async function(...args) {
    const before = process.memoryUsage();
    
    const result = await fn.apply(this, args);
    
    const after = process.memoryUsage();
    const heapDiff = (after.heapUsed - before.heapUsed) / 1024 / 1024;
    
    console.log(`${name} heap change: ${heapDiff.toFixed(2)} MB`);
    return result;
  };
}
```

## Debugging Tools

### 1. Console Methods

```javascript
// Basic logging
console.log('info:', value);

// Group related output
console.group('Database');
console.log('Query:', sql);
console.log('Result:', rows);
console.groupEnd();

// Table format
console.table([
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 }
]);

// Assert conditions
console.assert(count > 0, 'Count must be positive');

// Time tracking
console.time('operation');
doWork();
console.timeEnd('operation'); // Logs elapsed time
```

### 2. Custom Logger

```javascript
class Logger {
  constructor(namespace) {
    this.namespace = namespace;
  }

  log(...args) {
    console.log(`[${this.namespace}]`, ...args);
  }

  error(...args) {
    console.error(`[${this.namespace}] ERROR`, ...args);
  }

  debug(...args) {
    if (process.env.DEBUG) {
      console.log(`[${this.namespace}] DEBUG`, ...args);
    }
  }
}

const logger = new Logger('MyApp');
logger.log('Starting');
logger.error('Failed');
logger.debug('Details');
```

## Debugging Best Practices

### 1. Never Log Sensitive Data

```javascript
// BAD
console.log('User:', user); // Might include password, token

// GOOD
console.log('User:', { id: user.id, email: user.email });
```

### 2. Use Appropriate Log Levels

```javascript
const levels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = levels.INFO;

function log(msg, level) {
  if (level <= currentLevel) {
    console.log(msg);
  }
}
```

### 3. Structure Logs for Analysis

```javascript
// Structured logging
function logEvent(event, data) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    data,
    pid: process.pid
  }));
}

logEvent('user_login', { userId: 123 });
logEvent('api_call', { endpoint: '/api/users', duration: 45 });
```

## Summary

Inspector provides powerful debugging capabilities:
- Chrome DevTools integration
- CPU and memory profiling
- Real-time breakpoint debugging
- Performance analysis
- Memory leak detection

Always use in development, properly configure for production, and maintain sensitive information boundaries.
