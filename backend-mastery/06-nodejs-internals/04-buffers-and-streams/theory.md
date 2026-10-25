# Buffers and Streams Theory

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
