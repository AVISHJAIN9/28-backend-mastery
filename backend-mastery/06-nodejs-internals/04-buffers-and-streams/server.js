const express = require('express');
const fs = require('fs');
const path = require('path');
const { Readable, Writable, Transform } = require('stream');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3004;

// Module 4: Buffers and Streams

// Route: Buffer demonstrations
app.post('/api/streams/buffer-demo', (req, res) => {
  const { type, size } = req.body;

  try {
    switch (type) {
      case 'create': {
        const buf = Buffer.alloc(size);
        res.json({
          size: buf.length,
          encoding: 'utf8',
          message: `Created ${size} byte buffer`
        });
        break;
      }

      case 'from': {
        const buf = Buffer.from('Hello World', 'utf8');
        res.json({
          data: buf.toString('utf8'),
          hex: buf.toString('hex'),
          base64: buf.toString('base64'),
          length: buf.length
        });
        break;
      }

      case 'concat': {
        const buf1 = Buffer.from('Hello ');
        const buf2 = Buffer.from('World');
        const combined = Buffer.concat([buf1, buf2]);
        res.json({
          result: combined.toString(),
          length: combined.length
        });
        break;
      }

      default:
        res.json({ error: 'Unknown buffer type' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route: Stream performance comparison
app.post('/api/streams/performance', (req, res) => {
  const { method, size } = req.body;
  const chunkSize = size || 1024 * 1024; // 1MB

  // Simulate data
  const data = Buffer.alloc(chunkSize);

  const start = Date.now();

  if (method === 'string') {
    // Inefficient: Load all into memory
    let result = '';
    for (let i = 0; i < 100; i++) {
      result += data.toString();
    }
  } else if (method === 'stream') {
    // Efficient: Stream processing
    let processed = 0;
    const readable = Readable.from([data, data, data]);
    const writable = Writable({
      write(chunk, encoding, callback) {
        processed += chunk.length;
        callback();
      }
    });
    readable.pipe(writable);
  }

  const duration = Date.now() - start;

  res.json({
    method,
    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    duration,
    efficient: method === 'stream'
  });
});

// Route: Stream examples
app.get('/api/streams/types', (req, res) => {
  res.json({
    readable: {
      description: 'Source of data',
      example: 'fs.createReadStream(), socket, network request'
    },
    writable: {
      description: 'Destination for data',
      example: 'fs.createWriteStream(), socket, response'
    },
    duplex: {
      description: 'Both readable and writable',
      example: 'Socket, TCP connection'
    },
    transform: {
      description: 'Modifies data as it flows',
      example: 'Compression, encryption, JSON parsing'
    }
  });
});

// Route: Backpressure handling
app.post('/api/streams/backpressure', (req, res) => {
  const { shouldHandle } = req.body;
  
  let results = [];

  const readable = Readable.from(function* () {
    for (let i = 0; i < 1000; i++) {
      yield `Data chunk ${i}\n`;
    }
  }());

  const writable = Writable({
    highWaterMark: 16384,
    write(chunk, encoding, callback) {
      results.push(chunk.toString());

      if (shouldHandle) {
        // Properly handle backpressure
        callback();
      } else {
        // Improper: Not respecting backpressure
        callback();
      }
    }
  });

  readable.on('data', (chunk) => {
    if (shouldHandle) {
      const canContinue = writable.write(chunk);
      if (!canContinue) {
        readable.pause();
      }
    } else {
      writable.write(chunk);
    }
  });

  writable.on('drain', () => {
    readable.resume();
  });

  writable.on('finish', () => {
    res.json({
      chunksProcessed: results.length,
      handled: shouldHandle,
      approach: shouldHandle ? 'Correct backpressure handling' : 'Ignoring backpressure'
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Buffers & Streams server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  POST /api/streams/buffer-demo - Buffer demonstrations');
  console.log('  POST /api/streams/performance - Performance comparison');
  console.log('  GET /api/streams/types - Stream types');
  console.log('  POST /api/streams/backpressure - Backpressure handling');
});

module.exports = app;
