require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Readable, Writable, Transform, PassThrough } = require('stream');
const fs = require('fs');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3022;

// ==================== Middleware ====================

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Stream Demo Routes ====================

// Readable stream demo
app.get('/api/streams/readable-demo', (req, res) => {
  const data = [];
  const readable = Readable.from(['chunk1', 'chunk2', 'chunk3']);
  
  readable.on('data', (chunk) => {
    data.push(chunk.toString());
  });
  
  readable.on('end', () => {
    res.json({ success: true, stream: 'readable', data });
  });
});

// Writable stream demo
app.post('/api/streams/writable-demo', (req, res) => {
  const { chunks } = req.body;
  const written = [];
  
  const writable = new Writable({
    write(chunk, encoding, callback) {
      written.push(chunk.toString());
      callback();
    }
  });
  
  chunks.forEach(chunk => {
    writable.write(chunk);
  });
  
  writable.end(() => {
    res.json({ success: true, stream: 'writable', written });
  });
});

// Transform stream demo
app.post('/api/streams/transform-demo', (req, res) => {
  const { items } = req.body;
  const transformed = [];
  
  const transform = new Transform({
    transform(chunk, encoding, callback) {
      // Transform: uppercase all characters
      this.push(chunk.toString().toUpperCase());
      callback();
    }
  });
  
  transform.on('data', (chunk) => {
    transformed.push(chunk.toString());
  });
  
  items.forEach(item => {
    transform.write(item);
  });
  
  transform.end(() => {
    res.json({ success: true, stream: 'transform', transformed });
  });
});

// Backpressure demo
app.post('/api/streams/backpressure-demo', (req, res) => {
  const { dataSize, writeSize } = req.body;
  const metrics = {
    pauseCount: 0,
    resumeCount: 0,
    bytesWritten: 0,
    bytesRead: 0
  };
  
  // Create a slow writable stream (simulating bottleneck)
  const slowWriter = new Writable({
    write(chunk, encoding, callback) {
      metrics.bytesRead += chunk.length;
      // Simulate slow write (1ms per chunk)
      setTimeout(callback, 1);
    }
  });
  
  // Create readable stream
  const readable = Readable.from(function* () {
    for (let i = 0; i < dataSize; i++) {
      yield Buffer.alloc(writeSize);
    }
  }());
  
  // Handle backpressure
  readable.on('pause', () => metrics.pauseCount++);
  readable.on('resume', () => metrics.resumeCount++);
  
  readable.on('data', (chunk) => {
    metrics.bytesWritten += chunk.length;
    const canContinue = slowWriter.write(chunk);
    
    // If writable buffer is full, pause reading
    if (!canContinue) {
      readable.pause();
    }
  });
  
  slowWriter.on('drain', () => {
    readable.resume();
  });
  
  readable.on('end', () => {
    res.json({ success: true, metrics });
  });
});

// Pipe with backpressure
app.post('/api/streams/pipe-demo', (req, res) => {
  const { itemCount } = req.body;
  const items = [];
  
  const readable = Readable.from(
    (function* () {
      for (let i = 0; i < itemCount; i++) {
        yield `Item ${i}\n`;
      }
    })()
  );
  
  const writable = new Writable({
    write(chunk, encoding, callback) {
      items.push(chunk.toString());
      callback();
    }
  });
  
  readable.pipe(writable).on('finish', () => {
    res.json({ success: true, itemCount: items.length, items: items.slice(0, 5) });
  });
});

// Object mode stream
app.post('/api/streams/object-mode', (req, res) => {
  const { objects } = req.body;
  const processed = [];
  
  const objectStream = Readable.from(objects, { objectMode: true });
  
  objectStream.on('data', (obj) => {
    processed.push({
      ...obj,
      processed: true,
      timestamp: new Date().toISOString()
    });
  });
  
  objectStream.on('end', () => {
    res.json({ success: true, processed });
  });
});

// highWaterMark demo
app.post('/api/streams/highwater-mark', (req, res) => {
  const { highWaterMark } = req.body;
  const metrics = {
    highWaterMark,
    bufferSizes: [],
    pauseEvents: 0
  };
  
  let chunks = 0;
  const readable = Readable.from(function* () {
    for (let i = 0; i < 100; i++) {
      yield Buffer.alloc(1000);
    }
  }(), { highWaterMark });
  
  const writable = new Writable({ highWaterMark })({
    write(chunk, encoding, callback) {
      chunks++;
      // Simulate slow processing
      setTimeout(callback, Math.random() * 10);
    }
  });
  
  readable.on('pause', () => {
    metrics.pauseEvents++;
  });
  
  readable.pipe(writable).on('finish', () => {
    metrics.chunksProcessed = chunks;
    res.json({ success: true, metrics });
  });
});

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: '22 Stream Internals & Backpressure',
    category: '06 Nodejs Internals',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '22 Stream Internals & Backpressure',
    module: '06-nodejs-internals - 22',
    description: 'Stream internals, backpressure, readable/writable patterns',
    version: '1.0.0',
    category: '06 Nodejs Internals',
    endpoints: {
      health: '/health',
      readableDemo: 'GET /api/streams/readable-demo',
      writableDemo: 'POST /api/streams/writable-demo',
      transformDemo: 'POST /api/streams/transform-demo',
      backpressureDemo: 'POST /api/streams/backpressure-demo',
      pipeDemo: 'POST /api/streams/pipe-demo',
      objectMode: 'POST /api/streams/object-mode',
      highWaterMark: 'POST /api/streams/highwater-mark'
    }
  });
});

// ==================== Server Start ====================

app.listen(HTTP_PORT, () => {
  console.log(`[22-stream-internals-backpressure] listening on http://localhost:${HTTP_PORT}`);
  console.log(`[22-stream-internals-backpressure] API base: http://localhost:${HTTP_PORT}/api`);
});

module.exports = app;
