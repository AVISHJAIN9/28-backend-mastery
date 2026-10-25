# Filesystem APIs: All Patterns - Deep Dive

## Overview

The filesystem API is critical for file I/O operations. Node.js provides synchronous, callback-based, promise-based, and stream-based approaches. Understanding when to use each pattern is essential for performance and maintainability.

## Part 1: Synchronous vs Asynchronous

### Synchronous File Operations (Blocking)

```javascript
const fs = require('fs');

// Synchronous - blocks until complete
const data = fs.readFileSync('file.txt', 'utf8');
console.log(data);

// While this runs, NO other code executes
// Event loop is completely blocked
```

### Callback-Based Asynchronous (Most Common)

```javascript
const fs = require('fs');

// Non-blocking - returns immediately
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});

console.log('Reading file...'); // Logs BEFORE file is read
```

### Promise-Based API (fs/promises)

```javascript
const fs = require('fs').promises;

async function readFile() {
  try {
    const data = await fs.readFile('file.txt', 'utf8');
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

readFile();
```

### Streaming API (For Large Files)

```javascript
const fs = require('fs');

// Stream - memory efficient for large files
const stream = fs.createReadStream('huge-file.txt', { 
  encoding: 'utf8',
  highWaterMark: 64 * 1024 // 64KB chunks
});

stream.on('data', (chunk) => {
  console.log(`Received chunk: ${chunk.length} bytes`);
});

stream.on('end', () => {
  console.log('All data read');
});

stream.on('error', (err) => {
  console.error(err);
});
```

## Part 2: File Operations Patterns

### Reading Files

```javascript
const fs = require('fs');
const fsp = require('fs').promises;

// 1. Synchronous - AVOID in production
const data1 = fs.readFileSync('file.txt', 'utf8');

// 2. Callback
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});

// 3. Promise
fsp.readFile('file.txt', 'utf8').then(data => console.log(data));

// 4. Async/await
async function read() {
  const data = await fsp.readFile('file.txt', 'utf8');
  console.log(data);
}

// 5. Stream (for large files)
fs.createReadStream('file.txt').pipe(process.stdout);
```

### Writing Files

```javascript
const fs = require('fs');
const fsp = require('fs').promises;

// 1. Synchronous - BLOCKING
fs.writeFileSync('file.txt', 'content', 'utf8');

// 2. Callback
fs.writeFile('file.txt', 'content', 'utf8', (err) => {
  if (err) throw err;
  console.log('Written');
});

// 3. Promise based
fsp.writeFile('file.txt', 'content', 'utf8');

// 4. Append
fs.appendFile('file.txt', 'more content', (err) => {
  if (err) throw err;
});

// 5. Stream (for large data)
const writeStream = fs.createWriteStream('file.txt');
writeStream.write('content');
writeStream.end();
```

### Directory Operations

```javascript
const fs = require('fs');
const fsp = require('fs').promises;

// Create directory
fs.mkdirSync('mydir', { recursive: true });

// Async with promises
fsp.mkdir('mydir', { recursive: true });

// Read directory
const files = fs.readdirSync('mydir');
console.log(files);

// Async
fsp.readdir('mydir').then(files => console.log(files));

// Delete
fs.rmdirSync('mydir'); // Directory must be empty

// Recursive delete
fsp.rm('mydir', { recursive: true, force: true });
```

### File Metadata

```javascript
const fs = require('fs');
const fsp = require('fs').promises;

// Synchronous
const stats = fs.statSync('file.txt');
console.log(stats.size);      // bytes
console.log(stats.mtime);     // last modified time
console.log(stats.isFile());  // true/false
console.log(stats.isDirectory()); // true/false

// Promises
fsp.stat('file.txt').then(stats => {
  console.log(stats);
});

// Callback
fs.stat('file.txt', (err, stats) => {
  console.log(stats);
});

// Check if file exists (deprecated way, use stat)
fs.access('file.txt', fs.constants.F_OK, (err) => {
  if (err) console.log('File does not exist');
});
```

## Part 3: Stream Patterns

### Stream Types

```javascript
const fs = require('fs');

// 1. Read Stream
const readStream = fs.createReadStream('input.txt');

// 2. Write Stream
const writeStream = fs.createWriteStream('output.txt');

// 3. Transform Stream
const { Transform } = require('stream');
const uppercase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

// 4. Pipe (chaining)
fs.createReadStream('input.txt')
  .pipe(uppercase)
  .pipe(fs.createWriteStream('output.txt'));
```

### Stream Events

```javascript
const fs = require('fs');

const stream = fs.createReadStream('file.txt');

stream.on('data', (chunk) => {
  console.log(`Chunk: ${chunk.length} bytes`);
});

stream.on('end', () => {
  console.log('Stream ended');
});

stream.on('error', (err) => {
  console.error('Stream error:', err);
});

stream.on('pause', () => {
  console.log('Stream paused');
});

stream.on('resume', () => {
  console.log('Stream resumed');
});

// Manual pause/resume
stream.pause();
setTimeout(() => stream.resume(), 1000);
```

### Backpressure Handling

```javascript
const fs = require('fs');

const readable = fs.createReadStream('huge-file.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('data', (chunk) => {
  // Writing might be slow
  const canContinue = writable.write(chunk);

  if (!canContinue) {
    console.log('Backpressure! Pausing read');
    readable.pause();
  }
});

writable.on('drain', () => {
  console.log('Drain event - resuming read');
  readable.resume();
});

// Better: Use pipe (handles backpressure automatically)
readable.pipe(writable);
```

## Part 4: Common Use Cases

### 1. Reading Configuration Files

```javascript
const fs = require('fs');
const fsp = require('fs').promises;

// JSON config
async function loadConfig() {
  try {
    const data = await fsp.readFile('config.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Config not found, using defaults');
    return {};
  }
}

// Watch for changes
fs.watchFile('config.json', () => {
  console.log('Config changed!');
  loadConfig();
});
```

### 2. Logging to Files

```javascript
const fs = require('fs');

// Append to log file
function log(message) {
  const timestamp = new Date().toISOString();
  const line = `${timestamp} ${message}\n`;
  
  fs.appendFile('app.log', line, (err) => {
    if (err) console.error(err);
  });
}

log('Application started');

// Better: Use write stream for multiple logs
const logStream = fs.createWriteStream('app.log', { flags: 'a' });
logStream.write('Log entry 1\n');
logStream.write('Log entry 2\n');
logStream.end('Final entry\n');
```

### 3. Copying Files

```javascript
const fs = require('fs');
const fsp = require('fs').promises;

// Small file
const data = fs.readFileSync('source.txt');
fs.writeFileSync('dest.txt', data);

// Large file - use stream
fs.createReadStream('source.txt')
  .pipe(fs.createWriteStream('dest.txt'));

// Or use util.promisify
const { pipeline } = require('stream/promises');
async function copy() {
  await pipeline(
    fs.createReadStream('source.txt'),
    fs.createWriteStream('dest.txt')
  );
}
```

### 4. Recursive Directory Processing

```javascript
const fs = require('fs');
const path = require('path');
const fsp = require('fs').promises;

async function walkDir(dir) {
  const files = await fsp.readdir(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = await fsp.stat(fullPath);
    
    if (stats.isDirectory()) {
      await walkDir(fullPath); // Recursive
    } else {
      console.log('File:', fullPath);
    }
  }
}
```

### 5. Watching Files for Changes

```javascript
const fs = require('fs');

// Watch file
fs.watchFile('file.txt', (curr, prev) => {
  if (curr.mtime > prev.mtime) {
    console.log('File changed!');
  }
});

// Watch directory (recursive)
fs.watch('src', { recursive: true }, (eventType, filename) => {
  console.log(`${eventType} in ${filename}`);
});

// Stop watching
const watcher = fs.watch('file.txt', () => {});
watcher.close();
```

## Part 5: Performance Patterns

### When to Use Sync vs Async

```javascript
// ✅ Sync OK: Startup/initialization
const config = JSON.parse(fs.readFileSync('config.json'));

// ❌ Sync BAD: Request handler (blocks all users)
app.get('/data', (req, res) => {
  const data = fs.readFileSync('huge-file.txt'); // 💀 Blocks everyone!
  res.send(data);
});

// ✅ Async GOOD
app.get('/data', async (req, res) => {
  const data = await fsp.readFile('huge-file.txt');
  res.send(data);
});
```

### Stream for Large Files

```javascript
// ❌ Bad: Load entire file to memory
fs.readFile('huge.bin', (err, data) => {
  process.send(data); // 5GB file = 5GB memory!
});

// ✅ Good: Stream in chunks
fs.createReadStream('huge.bin')
  .on('data', (chunk) => {
    process.send(chunk); // Process chunks
  });
```

### Buffer Management

```javascript
const fs = require('fs');

// Control chunk size
const stream = fs.createReadStream('file.txt', {
  highWaterMark: 256 * 1024 // 256KB chunks instead of default 64KB
});

// Smaller for streaming to slow clients
const slowStream = fs.createReadStream('file.txt', {
  highWaterMark: 16 * 1024 // 16KB chunks
});
```

## Part 6: Error Handling

### Proper Error Handling

```javascript
const fs = require('fs');
const fsp = require('fs').promises;

// Callback
fs.readFile('file.txt', (err, data) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('File not found');
    } else if (err.code === 'EACCES') {
      console.error('Permission denied');
    } else {
      console.error('Unknown error:', err);
    }
    return;
  }
  console.log(data);
});

// Promises
fsp.readFile('file.txt')
  .catch(err => {
    if (err.code === 'ENOENT') {
      console.error('File not found');
    }
    throw err;
  });

// Async/await
async function read() {
  try {
    const data = await fsp.readFile('file.txt');
    return data;
  } catch (err) {
    console.error('Error:', err.code);
    throw err;
  }
}
```

## Part 7: Security Patterns

### Path Traversal Prevention

```javascript
const path = require('path');
const fsp = require('fs').promises;

const UPLOAD_DIR = '/uploads';

async function secureRead(filename) {
  // Prevent ../../../etc/passwd attacks
  const fullPath = path.resolve(UPLOAD_DIR, filename);
  
  if (!fullPath.startsWith(path.resolve(UPLOAD_DIR))) {
    throw new Error('Invalid path');
  }
  
  return fsp.readFile(fullPath);
}
```

### File Permission Checks

```javascript
const fs = require('fs');
const fsp = require('fs').promises;

async function hasReadAccess(filepath) {
  try {
    await fsp.access(filepath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

// Check ownership
async function getOwnershipInfo(filepath) {
  const stats = await fsp.stat(filepath);
  return {
    uid: stats.uid,      // Owner user ID
    gid: stats.gid,      // Owner group ID
    mode: stats.mode     // Permissions (octal)
  };
}
```

## Summary

- **Synchronous:** Use only at startup
- **Callbacks:** Traditional, still widely used
- **Promises:** Modern, better error handling
- **Async/await:** Cleanest syntax
- **Streams:** Essential for large files
- **Backpressure:** Important for performance
- **Error codes:** Check err.code for specific errors
- **Security:** Validate paths, check permissions
