const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3003;

// Module 3: Blocking Event Loop Detection & Solutions

// Route: Run blocking demo
app.post('/api/blocking/cpu-blocking-demo', (req, res) => {
  const duration = req.body.duration || 2000; // ms
  const startTime = Date.now();

  // Simulate CPU-blocking operation
  let sum = 0;
  while (Date.now() - startTime < duration) {
    sum += Math.random();
  }

  res.json({
    blocked: true,
    duration: Date.now() - startTime,
    message: 'This blocked the event loop!'
  });
});

// Route: Non-blocking alternative using Worker
app.post('/api/blocking/async-demo', (req, res) => {
  const duration = req.body.duration || 2000;

  // Simulate non-blocking by yielding
  let processed = 0;
  let chunks = 0;

  function processChunk() {
    if (processed < duration) {
      let sum = 0;
      const endTime = Date.now() + 100; // 100ms chunks
      while (Date.now() < endTime) {
        sum += Math.random();
      }
      processed = Date.now() - (Date.now() - processed);
      chunks++;
      setImmediate(processChunk);
    } else {
      res.json({
        blocked: false,
        chunks,
        duration: Date.now() - (Date.now() - duration),
        message: 'Event loop remained responsive!'
      });
    }
  }

  processChunk();
});

// Route: Detect event loop lag
let eventLoopLag = 0;
let lastCheck = Date.now();

const checkLag = () => {
  const now = Date.now();
  const lag = now - lastCheck - 1000;
  eventLoopLag = Math.max(0, lag);
  lastCheck = now;
};

setInterval(checkLag, 1000);

app.get('/api/blocking/lag', (req, res) => {
  res.json({
    lagMs: eventLoopLag,
    healthy: eventLoopLag < 50,
    warning: eventLoopLag > 100
  });
});

// Route: Blocking patterns examples
app.get('/api/blocking/patterns', (req, res) => {
  res.json({
    blockingPatterns: [
      {
        name: 'Synchronous File I/O',
        code: "fs.readFileSync('large-file.txt')",
        impact: 'Blocks entire event loop during read'
      },
      {
        name: 'Heavy Computation',
        code: 'for (let i = 0; i < 1e9; i++) sum += i;',
        impact: 'CPU blocks event loop for seconds'
      },
      {
        name: 'JSON.parse on Large Data',
        code: 'JSON.parse(hugeJsonString)',
        impact: 'Single-threaded parsing blocks'
      },
      {
        name: 'Synchronous Regex',
        code: 'largeString.match(complexRegex)',
        impact: 'Backtracking can block'
      },
      {
        name: 'Tight Loop',
        code: 'while(true) { doWork(); }',
        impact: 'Obvious blocking'
      }
    ],
    solutions: [
      {
        name: 'Use Async APIs',
        code: "fs.readFile('file.txt', callback)",
        benefit: 'Non-blocking'
      },
      {
        name: 'Break Into Chunks',
        code: 'for (let i=0; i<n; i++) { await work(); }',
        benefit: 'Event loop continues'
      },
      {
        name: 'Worker Threads',
        code: 'new Worker()',
        benefit: 'Separate thread'
      },
      {
        name: 'Stream Large Data',
        code: 'fs.createReadStream()',
        benefit: 'Progressive processing'
      },
      {
        name: 'Use setImmediate',
        code: 'setImmediate(() => heavyWork())',
        benefit: 'Yields between operations'
      }
    ]
  });
});

// Route: Monitor event loop health
let requests = [];
let avgResponseTime = 0;

app.get('/api/blocking/health', (req, res) => {
  const timestamp = Date.now();
  requests.push(timestamp);

  // Keep only last 10 requests
  requests = requests.filter(t => timestamp - t < 10000);

  // Calculate average gap between requests
  if (requests.length > 1) {
    let gaps = 0;
    for (let i = 1; i < requests.length; i++) {
      gaps += requests[i] - requests[i - 1];
    }
    avgResponseTime = gaps / (requests.length - 1);
  }

  res.json({
    requestsPerSecond: requests.length,
    avgResponseTimeMs: avgResponseTime.toFixed(2),
    healthy: avgResponseTime < 100,
    eventLoopLagMs: eventLoopLag
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Blocking Event Loop server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  POST /api/blocking/cpu-blocking-demo - Demonstrate blocking');
  console.log('  POST /api/blocking/async-demo - Non-blocking solution');
  console.log('  GET /api/blocking/lag - Current event loop lag');
  console.log('  GET /api/blocking/patterns - Blocking patterns');
  console.log('  GET /api/blocking/health - Event loop health');
});

module.exports = app;
