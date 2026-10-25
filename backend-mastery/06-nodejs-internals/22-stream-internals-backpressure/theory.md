# Streams & Backpressure: Deep Dive Theory

## What Are Node.js Streams?

Streams are objects that handle reading data from sources or writing data to destinations in chunks, instead of loading the entire content into memory.

### The 4 Types of Streams

```
1. Readable - Read data from source (fs.createReadStream)
2. Writable - Write data to destination (fs.createWriteStream)
3. Transform - Modify data during streaming (zlib.createGzip)
4. Duplex  - Both readable and writable (net.Socket)
```

### Stream Benefits

```
✓ Memory efficient - process large files
✓ Performance - start processing immediately
✓ Composable - chain operations with pipe()
✓ Backpressure handling - automatic flow control
✓ Perfect for: file I/O, network, compression
```

## Readable Streams

### Creating Readable Streams

```javascript
const { Readable } = require('stream');

// From data array
const readable = Readable.from(['a', 'b', 'c']);

// From generator
const readable2 = Readable.from(function* () {
  for (let i = 0; i < 1000; i++) {
    yield `Line ${i}\n`;
  }
});

// Custom readable
const readable3 = new Readable({
  read() {
    // Called when consumer wants data
    this.push('chunk');
    this.push(null); // signals end
  }
});
```

### Reading Modes

```javascript
const fs = require('fs');
const readable = fs.createReadStream('large-file.txt');

// Mode 1: flowing mode (automatic)
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes`);
});

// Mode 2: paused mode (explicit)
readable.pause();
setTimeout(() => {
  readable.resume();
}, 5000);

// Mode 3: manual reading
readable.read(16 * 1024); // read 16KB at a time
```

## Writable Streams

### Creating Writable Streams

```javascript
const { Writable } = require('stream');

// To file
const writable = fs.createWriteStream('output.txt');

// Custom writable
const writable2 = new Writable({
  write(chunk, encoding, callback) {
    // Process chunk
    console.log('Writing:', chunk.toString());
    // Must call callback when done
    callback();
  }
});

// With options
const writable3 = new Writable({
  write(chunk, encoding, callback) {
    // ...
  },
  highWaterMark: 64 * 1024 // buffer size
});
```

### Writing Data

```javascript
const writable = new Writable({
  write(chunk, encoding, callback) {
    console.log(chunk.toString());
    callback();
  }
});

// Write data
writable.write('Hello ');
writable.write('World ');
writable.write('!');
writable.end(); // signals no more data

// Handle writes
writable.on('finish', () => {
  console.log('All writes finished');
});
```

## Transform Streams

### Transform Pattern

```javascript
const { Transform } = require('stream');

// Uppercase transformer
const uppercase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

// Usage
process.stdin.pipe(uppercase).pipe(process.stdout);
```

### Common Transforms

```javascript
const { Transform, pipeline } = require('stream');

// 1. JSON parsing
const jsonParser = new Transform({
  transform(chunk, encoding, callback) {
    try {
      const json = JSON.parse(chunk);
      this.push(JSON.stringify(json, null, 2));
      callback();
    } catch (e) {
      callback(e);
    }
  }
});

// 2. CSV to JSON
const csvToJson = new Transform({
  transform(chunk, encoding, callback) {
    const lines = chunk.toString().trim().split('\n');
    const headers = lines[0].split(',');
    const objects = lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, idx) => {
        obj[header] = values[idx];
        return obj;
      }, {});
    });
    this.push(JSON.stringify(objects));
    callback();
  }
});

// 3. Compression
const zlib = require('zlib');
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'));
```

## Backpressure: The Core Concept

### What is Backpressure?

```
Readable stream writes faster than Writable stream can handle
→ Buffer fills up
→ Consumer signals "slow down"
→ Producer should pause reading

Without handling: Memory exhaustion!
```

### Visual Example

```
┌──────────────┐         Buffer          ┌──────────────┐
│   Readable   │────→ [############]  ──→ │   Writable   │
│ (26MB/sec)   │     (capacity 64KB)      │  (1MB/sec)   │
└──────────────┘    [OVERFLOW!]           └──────────────┘

Solution:
- Readable pauses when buffer full
- Writable sends 'drain' event when buffer emptied
- Readable resumes on drain
```

### Handling Backpressure

```javascript
const readable = fs.createReadStream('large-file.txt');
const writable = fs.createWriteStream('output.txt');

let isWritable = true;

readable.on('data', (chunk) => {
  // write() returns false if buffer is full
  isWritable = writable.write(chunk);
  
  if (!isWritable) {
    // Buffer full, pause reading
    readable.pause();
    console.log('Paused - backpressure building');
  }
});

// 'drain' fires when buffer empties
writable.on('drain', () => {
  readable.resume();
  console.log('Resumed - buffer drained');
});
```

## Piping: Automatic Backpressure

### The Pipe Solution

```javascript
// Pipe handles backpressure automatically!
fs.createReadStream('input.txt')
  .pipe(fs.createWriteStream('output.txt'));

// Equivalent to:
const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('data', (chunk) => {
  if (!writable.write(chunk)) {
    readable.pause();
  }
});

writable.on('drain', () => {
  readable.resume();
});
```

### Pipeline (Modern Approach)

```javascript
const { pipeline } = require('stream');

pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('input.gz'),
  (err) => {
    if (err) console.error('Pipeline failed:', err);
    else console.log('Pipeline succeeded');
  }
);
```

## Advanced Stream Concepts

### 1. highWaterMark

Controls internal buffer size (default: 16KB for objects, 64KB for bytes).

```javascript
const readable = fs.createReadStream('file.txt', {
  highWaterMark: 256 * 1024 // 256KB buffer
});

// Higher = more memory, better throughput
// Lower = less memory, more context switching
```

### 2. Object Mode

Streams objects instead of bytes.

```javascript
const { Readable, Writable } = require('stream');

const objReadable = new Readable({
  objectMode: true,
  read() {
    this.push({ id: 1, name: 'Alice' });
    this.push({ id: 2, name: 'Bob' });
    this.push(null);
  }
});

const objWritable = new Writable({
  objectMode: true,
  write(obj, encoding, callback) {
    console.log('Received object:', obj);
    callback();
  }
});

objReadable.pipe(objWritable);
```

### 3. Error Handling

```javascript
const readable = fs.createReadStream('file.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('error', (err) => {
  console.error('Read error:', err);
});

writable.on('error', (err) => {
  console.error('Write error:', err);
});

// Better: use pipeline
const { pipeline } = require('stream');
pipeline(
  readable,
  writable,
  (err) => {
    if (err) console.error('Pipeline error:', err);
  }
);
```

## Real-World Examples

### Example 1: Process Large File

```javascript
const fs = require('fs');
const { Transform } = require('stream');

// Read, transform, write without loading entire file
fs.createReadStream('large.json', { encoding: 'utf8' })
  .pipe(new Transform({
    transform(chunk, encoding, callback) {
      const lines = chunk.toString().split('\n');
      const transformed = lines
        .filter(line => line.trim())
        .map(line => line.toUpperCase());
      this.push(transformed.join('\n'));
      callback();
    }
  }))
  .pipe(fs.createWriteStream('output.json'));
```

### Example 2: Compress Files

```javascript
const zlib = require('zlib');
const fs = require('fs');

fs.createReadStream('file.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('file.txt.gz'))
  .on('finish', () => console.log('Compressed!'));
```

### Example 3: Stream API Response

```javascript
const express = require('express');
const app = express();

app.get('/large-file', (req, res) => {
  // Streams file without loading into memory
  const fileStream = fs.createReadStream('large-file.bin');
  
  res.setHeader('Content-Type', 'application/octet-stream');
  
  fileStream.on('error', (err) => {
    res.status(500).send('Error reading file');
  });
  
  fileStream.pipe(res);
});
```

### Example 4: Duplex Stream (Network Socket)

```javascript
const net = require('net');

const server = net.createServer((socket) => {
  // socket is Duplex - both readable and writable
  
  // Echo server
  socket.pipe(socket);
  
  // Or with transform
  socket
    .pipe(new Transform({
      transform(chunk, encoding, callback) {
        this.push(chunk.toString().toUpperCase());
        callback();
      }
    }))
    .pipe(socket);
});

server.listen(3000);
```

## Performance Patterns

### Pattern 1: Batch Processing with Backpressure

```javascript
const { Transform } = require('stream');

const batchTransform = new Transform({
  objectMode: true,
  highlightWaterMark: 100,
  
  _batch: [],
  
  async transform(obj, encoding, callback) {
    this._batch.push(obj);
    
    if (this._batch.length >= 10) {
      try {
        const result = await processBatch(this._batch);
        this._batch = [];
        this.push(result);
        callback();
      } catch (err) {
        callback(err);
      }
    } else {
      callback();
    }
  },
  
  async flush(callback) {
    if (this._batch.length > 0) {
      try {
        const result = await processBatch(this._batch);
        this.push(result);
        callback();
      } catch (err) {
        callback(err);
      }
    } else {
      callback();
    }
  }
});
```

### Pattern 2: Throttled Writing

```javascript
function throttledWrite(writable, data, delayMs) {
  writable.write(data);
  
  return new Promise(resolve => {
    setTimeout(resolve, delayMs);
  });
}

// Usage
async function writeThrottled() {
  for (const item of items) {
    await throttledWrite(writable, item, 100);
  }
}
```

## Debug Backpressure

```javascript
const readable = fs.createReadStream('large.txt');
const writable = fs.createWriteStream('output.txt');

let pauses = 0;
let resumes = 0;

readable.on('pause', () => {
  pauses++;
  console.log(`Paused (total: ${pauses})`);
});

readable.on('resume', () => {
  resumes++;
  console.log(`Resumed (total: ${resumes})`);
});

writable.on('drain', () => {
  console.log('Drain event fired');
});

readable.pipe(writable);
```

## Key Takeaways

1. **Readable**: Source of data
2. **Writable**: Destination for data
3. **Transform**: Modifies data in transit
4. **Backpressure**: Automatic flow control
5. **Pipe**: Handles backpressure by default
6. **Pipeline**: Modern safe piping
7. **highWaterMark**: Tune for your use case
8. **Error handling**: Always listen to errors

Streams are essential for Node.js performance!
