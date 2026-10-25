# Process & Environment Details - Deep Dive

## Overview
The Node.js process object and environment variables are critical for production-ready applications. Understanding system resources, signals, memory, and configuration is essential.

## Part 1: The process Object

### process.env - Environment Variables

```javascript
// Access environment variables
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT || 5432; // Default value
const apiKey = process.env.API_KEY;

// Set at runtime
process.env.NODE_ENV = 'production';

// All as object
console.log(process.env);
// { PATH: '...', NODE_ENV: 'development', DB_HOST: 'localhost', ... }
```

### process.argv - Command Line Arguments

```javascript
// node app.js arg1 arg2 --flag=value

console.log(process.argv);
// [
//   '/usr/bin/node',
//   '/path/to/app.js',
//   'arg1',
//   'arg2',
//   '--flag=value'
// ]

const args = process.argv.slice(2);
console.log(args); // ['arg1', 'arg2', '--flag=value']
```

### process.cwd() - Current Working Directory

```javascript
// Get current working directory
const currentDir = process.cwd();
console.log(currentDir); // /home/user/project

// Change directory
process.chdir('/tmp');
console.log(process.cwd()); // /tmp
```

### process.pid & process.ppid

```javascript
// Process ID
console.log('Process ID:', process.pid); // 12345

// Parent process ID
console.log('Parent PID:', process.ppid); // 12344

// Use for logging, debugging
echo `Server running as PID ${process.pid}`;
```

### process.platform & process.arch

```javascript
// Operating system
console.log(process.platform);
// 'linux', 'darwin' (macOS), 'win32' (Windows)

if (process.platform === 'win32') {
  console.log('Running on Windows');
}

// CPU architecture
console.log(process.arch);
// 'x64', 'arm64', 'x86', etc.
```

### process.version & process.versions

```javascript
// Node.js version
console.log(process.version); // v16.14.0

// All component versions
console.log(process.versions);
// {
//   node: '16.14.0',
//   v8: '9.2.195.43',
//   uv: '1.42.0',
//   zlib: '1.2.11',
//   ...
// }
```

## Part 2: Memory Management

### process.memoryUsage()

```javascript
const mem = process.memoryUsage();

console.log(mem);
// {
//   rss: 52428800,        // Resident Set Size
//   heapTotal: 8388608,   // Total heap size
//   heapUsed: 6291456,    // Heap actually used
//   external: 1048576,    // Memory for C++ objects
//   arrayBuffers: 524288  // Memory in ArrayBuffers
// }

console.log('Heap used: ' + Math.round(mem.heapUsed / 1024 / 1024) + ' MB');
```

### Memory Leak Detection

```javascript
// Monitor memory growth
setInterval(() => {
  const mem = process.memoryUsage();
  const heapMB = Math.round(mem.heapUsed / 1024 / 1024);
  console.log(`Heap: ${heapMB}MB`);
}, 5000);

// Trigger garbage collection (requires --expose-gc flag)
if (global.gc) {
  global.gc();
  console.log('Garbage collection triggered');
}
```

## Part 3: CPU & System Resources

### os Module for System Info

```javascript
const os = require('os');

// CPU information
const cpus = os.cpus();
console.log(`CPU cores: ${cpus.length}`);
console.log(`CPU model: ${cpus[0].model}`);

// System memory
const totalMem = os.totalmem();
const freeMem = os.freemem();
console.log(`Total: ${totalMem / 1024 / 1024 / 1024}GB`);
console.log(`Free: ${freeMem / 1024 / 1024 / 1024}GB`);

// Load average (Unix only)
const loadavg = os.loadavg();
console.log(`Load (1m): ${loadavg[0]}`); // 1 minute

// Uptime
console.log(`Uptime: ${os.uptime() / 60 / 60} hours`);
```

## Part 4: Process Signals

### Handling Signals

```javascript
// SIGTERM - Graceful shutdown signal
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// SIGINT - Ctrl+C
process.on('SIGINT', () => {
  console.log('\\nKeyboard interrupt (Ctrl+C)');
  process.exit(0);
});

// Uncaught Exception
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Unhandled Promise Rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
```

## Part 5: Exit Codes

### Standard Exit Codes

```javascript
// Success
process.exit(0);

// Generic error
process.exit(1);

// Misuse of shell command
process.exit(2);

// Fatal signal "11" (Segmentation fault)
process.exit(11);
```

## Part 6: Standard I/O Streams

### stdout, stderr, stdin

```javascript
// Write to stdout
process.stdout.write('Output: ');
process.stdout.write(value + '\\n');

// Write to stderr
process.stderr.write('Error: ');
process.stderr.write(error + '\\n');

// Read from stdin
process.stdin.on('data', (chunk) => {
  console.log('Input:', chunk.toString());
});

process.stdin.on('end', () => {
  console.log('No more input');
  process.exit(0);
});

// Get write status (buffering)
const canContinue = process.stdout.write(largeString);
if (!canContinue) {
  console.log('Stdout buffer full, pausing');
}
```

## Part 7: Graceful Shutdown Pattern

### Best Practice Implementation

```javascript
let isShuttingDown = false;

async function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('Graceful shutdown initiated');
  
  // Stop accepting new requests
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Close database connections
  await db.close();
  console.log('Database closed');

  // Close cache connections
  await cache.disconnect();
  console.log('Cache disconnected');

  // Force exit after timeout
  setTimeout(() => {
    console.log('Force exit after timeout');
    process.exit(1);
  }, 30000); // 30 seconds
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

## Summary

- **process.env:** Access configuration and secrets
- **process.argv:** Parse command-line arguments
- **process.memoryUsage():** Monitor heap usage
- **os module:** Get system resources
- **Signals:** Handle graceful shutdown
- **Exit codes:** Use meaningful error codes
- **Streams:** Work with stdin/stdout/stderr
