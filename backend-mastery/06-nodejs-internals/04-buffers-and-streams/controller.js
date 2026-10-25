/**
 * Buffers and Streams Controller
 * Demonstrates Buffer operations and streaming patterns
 */

const fs = require('fs');
const path = require('path');
const { Transform, PassThrough } = require('stream');

// ============================================
// Buffer Creation and Operations
// ============================================

exports.demonstrateBufferBasics = (req, res) => {
  const size = parseInt(req.query.size) || 1024;
  const results = {
    operation: 'buffer_basics',
    demonstrations: [],
  };

  console.log(`\n=== BUFFER BASICS (${size} bytes) ===`);

  // Buffer.alloc - Create buffer filled with zeros
  const buf1 = Buffer.alloc(size);
  results.demonstrations.push({
    method: 'Buffer.alloc()',
    size: buf1.length,
    memory: `${(buf1.length / 1024).toFixed(2)} KB`,
  });

  // Buffer.allocUnsafe - Faster but uninitialized
  const buf2 = Buffer.allocUnsafe(size);
  results.demonstrations.push({
    method: 'Buffer.allocUnsafe()',
    size: buf2.length,
    note: 'Faster but contains old data',
  });

  // Buffer.from() - From string
  const str = 'Hello, World!';
  const buf3 = Buffer.from(str, 'utf8');
  results.demonstrations.push({
    method: 'Buffer.from(string)',
    original: str,
    bufferSize: buf3.length,
    hex: buf3.toString('hex'),
  });

  // Buffer concatenation
  const buf4 = Buffer.from('Part1');
  const buf5 = Buffer.from('Part2');
  const combined = Buffer.concat([buf4, buf5]);
  results.demonstrations.push({
    method: 'Buffer.concat()',
    part1: buf4.toString(),
    part2: buf5.toString(),
    combined: combined.toString(),
    size: combined.length,
  });

  // Buffer comparison
  const buf6 = Buffer.from('abc');
  const buf7 = Buffer.from('abc');
  const buf8 = Buffer.from('def');
  results.demonstrations.push({
    method: 'Buffer comparison',
    'abc === abc': buf6.equals(buf7),
    'abc === def': buf6.equals(buf8),
  });

  res.json(results);
};

// ============================================
// Buffer Encoding Conversions
// ============================================

exports.demonstrateBufferEncoding = (req, res) => {
  const encoding = req.query.encoding || 'utf8';
  const text = 'Node.js Buffer Encoding';
  const results = {
    operation: 'buffer_encoding',
    originalText: text,
    conversions: {},
  };

  console.log(`\n=== BUFFER ENCODING: ${encoding.toUpperCase()} ===`);

  const buffer = Buffer.from(text);

  // Convert to different encodings
  ['utf8', 'hex', 'base64', 'ascii'].forEach((enc) => {
    try {
      results.conversions[enc] = buffer.toString(enc);
    } catch (e) {
      results.conversions[enc] = `Error: ${e.message}`;
    }
  });

  // Size comparison
  results.sizeComparison = {
    utf8: Buffer.from(text, 'utf8').length,
    hex: Buffer.from(text, 'utf8').toString('hex').length,
    base64: Buffer.from(text, 'utf8').toString('base64').length,
  };

  res.json(results);
};

// ============================================
// Stream Demonstration
// ============================================

exports.demonstrateStreams = (req, res) => {
  const chunkSize = parseInt(req.query.chunkSize) || 1024;
  const results = {
    operation: 'stream_demonstration',
    chunkSize,
    chunks: [],
    totalBytes: 0,
  };

  console.log(`\n=== STREAMS DEMONSTRATION (chunk size: ${chunkSize}) ===`);

  // Create readable stream from string
  const { Readable } = require('stream');

  const data = 'This is streaming data '.repeat(100);
  const readable = Readable.from([data]);

  readable.on('data', (chunk) => {
    results.chunks.push({
      size: chunk.length,
      preview: chunk.toString().substring(0, 50),
    });
    results.totalBytes += chunk.length;
  });

  readable.on('end', () => {
    results.streamStatistics = {
      totalChunks: results.chunks.length,
      totalBytes: results.totalBytes,
      averageChunkSize: (results.totalBytes / results.chunks.length).toFixed(2),
    };

    res.json(results);
  });

  readable.on('error', (err) => {
    results.error = err.message;
    res.status(500).json(results);
  });
};

// ============================================
// Transform Stream
// ============================================

exports.demonstrateTransformStream = (req, res) => {
  const results = {
    operation: 'transform_stream',
    transformations: [],
  };

  console.log(`\n=== TRANSFORM STREAM ===`);

  // Create a transform stream that uppercases text
  const uppercaseTransform = new Transform({
    transform(chunk, encoding, callback) {
      this.push(chunk.toString().toUpperCase());
      callback();
    },
  });

  const { Readable } = require('stream');
  const source = Readable.from(['hello', ' ', 'world']);

  source.pipe(uppercaseTransform).on('data', (chunk) => {
    results.transformations.push(chunk.toString());
  });

  setTimeout(() => {
    results.result = results.transformations.join('');
    res.json(results);
  }, 100);
};

// ============================================
// Pipeline Pattern
// ============================================

exports.demonstratePipeline = (req, res) => {
  const { pipeline } = require('stream');
  const { Transform, PassThrough } = require('stream');
  const results = {
    operation: 'pipeline_pattern',
    stages: [],
  };

  console.log(`\n=== PIPELINE PATTERN ===`);

  // Create multiple transform streams
  const uppercase = new Transform({
    transform(chunk, encoding, callback) {
      results.stages.push(`Stage 1: ${chunk.toString()}`);
      callback(null, chunk.toString().toUpperCase());
    },
  });

  const reverse = new Transform({
    transform(chunk, encoding, callback) {
      const reversed = chunk.toString().split('').reverse().join('');
      results.stages.push(`Stage 2: ${reversed}`);
      callback(null, reversed);
    },
  });

  const addPrefix = new Transform({
    transform(chunk, encoding, callback) {
      const prefixed = `[PROCESSED] ${chunk.toString()}`;
      results.stages.push(`Stage 3: ${prefixed}`);
      callback(null, prefixed);
    },
  });

  const { Readable } = require('stream');
  const source = Readable.from(['hello world']);
  const dest = new PassThrough();

  dest.on('data', (chunk) => {
    results.finalResult = chunk.toString();
  });

  pipeline(source, uppercase, reverse, addPrefix, dest, (err) => {
    if (err) {
      results.error = err.message;
      res.status(500).json(results);
    } else {
      res.json(results);
    }
  });
};

// ============================================
// Backpressure Handling
// ============================================

exports.demonstrateBackpressure = (req, res) => {
  const { Readable, Writable } = require('stream');
  const results = {
    operation: 'backpressure_handling',
    events: [],
    drainCalls: 0,
  };

  console.log(`\n=== BACKPRESSURE HANDLING ===`);

  const readable = Readable.from(Array.from({ length: 100 }, (_, i) => `data-${i}`));

  const writable = new Writable({
    highWaterMark: 10,
    write(chunk, encoding, callback) {
      results.events.push({
        type: 'write',
        data: chunk.toString(),
      });
      setTimeout(callback, 50);
    },
  });

  readable.on('pause', () => {
    results.events.push({ type: 'pause' });
  });

  writable.on('drain', () => {
    results.drainCalls++;
    results.events.push({ type: 'drain' });
  });

  readable.pipe(writable);

  writable.on('finish', () => {
    results.statistics = {
      totalEvents: results.events.length,
      drainCalls: results.drainCalls,
    };
    res.json(results);
  });
};

// ============================================
// Memory Efficiency Comparison
// ============================================

exports.compareMemoryUsage = (req, res) => {
  const size = 10 * 1024 * 1024; // 10 MB
  const results = {
    operation: 'memory_efficiency_comparison',
    size: `${size / (1024 * 1024)} MB`,
    approaches: {},
  };

  console.log(`\n=== MEMORY EFFICIENCY: Loading ${size / (1024 * 1024)} MB file ===`);

  const initialMemory = process.memoryUsage();

  // Approach 1: Load entire file into memory
  const allData = Buffer.alloc(size);
  const memoryAfterBuffer = process.memoryUsage();
  results.approaches.bufferAlloc = {
    heapUsedMB: ((memoryAfterBuffer.heapUsed - initialMemory.heapUsed) / (1024 * 1024)).toFixed(2),
    external: ((memoryAfterBuffer.external - initialMemory.external) / (1024 * 1024)).toFixed(2),
    note: 'Entire file loaded at once',
  };

  // Approach 2: Stream processing
  const memoryBeforeStream = process.memoryUsage();
  const { Readable } = require('stream');
  const chunks = [];
  const readable = Readable.from(Buffer.alloc(size));

  readable.on('data', (chunk) => {
    // Process and discard
    chunks.length = 0;
  });

  readable.on('end', () => {
    const memoryAfterStream = process.memoryUsage();
    results.approaches.streams = {
      heapUsedMB: ((memoryAfterStream.heapUsed - memoryBeforeStream.heapUsed) / (1024 * 1024)).toFixed(
        2
      ),
      external: ((memoryAfterStream.external - memoryBeforeStream.external) / (1024 * 1024)).toFixed(2),
      note: 'Data processed in chunks',
    };

    results.recommendation = 'Use streams for large files to reduce memory footprint';
    res.json(results);
  });
};
