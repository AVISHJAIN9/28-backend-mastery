require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3019;

// ==================== Middleware ====================

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Timer State ====================

const timerState = {
  timers: new Map(),
  executions: []
};

// ==================== Routes ====================

// Test setTimeout precision
app.post('/api/timers/test-precision', (req, res) => {
  const { count, delay } = req.body;
  const results = [];
  const start = Date.now();

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const actual = Date.now() - start;
      results.push({ expected: delay, actual, drift: actual - delay });
    }, delay);
  }

  // Wait for all timers to complete
  setTimeout(() => {
    res.json({
      success: true,
      count: count,
      expectedDelay: delay,
      results,
      avgDrift: results.reduce((sum, r) => sum + r.drift, 0) / results.length
    });
  }, delay + 50);
});

// Test setImmediate
app.get('/api/timers/test-immediate', (req, res) => {
  const order = [];
  
  setTimeout(() => order.push('setTimeout'), 0);
  setImmediate(() => order.push('setImmediate'));
  Promise.resolve().then(() => order.push('Promise'));
  
  setImmediate(() => {
    res.json({ success: true, executionOrder: order });
  });
});

// Test timer.unref()
app.post('/api/timers/test-unref', (req, res) => {
  const delay = req.body.delay || 5000;
  const timerId1 = setTimeout(() => {
    timerState.executions.push('ref-timer-completed');
  }, delay);

  const timerId2 = setTimeout(() => {
    timerState.executions.push('unref-timer-would-complete');
  }, delay);
  
  timerId2.unref();

  timerState.timers.set(`ref-${Date.now()}`, { timer: timerId1, type: 'ref', delay });
  timerState.timers.set(`unref-${Date.now()}`, { timer: timerId2, type: 'unref', delay });

  res.json({
    success: true,
    message: 'Created ref and unref timers',
    canExit: 'App can exit if only unref timers remain',
    executedSoFar: timerState.executions
  });
});

// Test interval behavior
app.get('/api/timers/test-interval', (req, res) => {
  const count = [];
  let iterations = 0;
  const maxIterations = 5;

  const intervalId = setInterval(() => {
    iterations++;
    count.push({ iteration: iterations, timestamp: Date.now() });
    
    if (iterations >= maxIterations) {
      clearInterval(intervalId);
    }
  }, 100);

  setTimeout(() => {
    res.json({
      success: true,
      message: 'Interval test completed',
      iterations: count,
      totalDuration: count[count.length - 1].timestamp - count[0].timestamp
    });
  }, 600);
});

// Test microtasks vs macrotasks
app.get('/api/timers/microtasks-vs-macrotasks', (req, res) => {
  const order = [];

  order.push('start');
  
  setTimeout(() => {
    order.push('setTimeout');
  }, 0);

  setImmediate(() => {
    order.push('setImmediate');
  });

  Promise.resolve()
    .then(() => order.push('Promise.then 1'))
    .then(() => order.push('Promise.then 2'));

  queueMicrotask(() => {
    order.push('queueMicrotask');
  });

  order.push('end');

  setImmediate(() => {
    res.json({ success: true, executionOrder: order });
  });
});

// Test timer memory usage
app.post('/api/timers/test-memory', (req, res) => {
  const { count } = req.body;
  const timers = [];

  const before = process.memoryUsage().heapUsed;
  
  for (let i = 0; i < count; i++) {
    timers.push(
      setTimeout(() => {}, 1000 * 60) // 1 minute timers
    );
  }

  const after = process.memoryUsage().heapUsed;
  const memoryIncrease = (after - before) / 1024 / 1024; // MB

  // Cleanup
  timers.forEach(t => clearTimeout(t));

  res.json({
    success: true,
    timerCount: count,
    memoryIncreaseMB: memoryIncrease.toFixed(2),
    averagePerTimer: ((memoryIncrease * 1024) / count).toFixed(2) + ' KB'
  });
});

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: '19 Timers Deep Dive',
    category: '06 Nodejs Internals',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '19 Timers Deep Dive',
    module: '06-nodejs-internals - 19',
    description: 'Timer internals, precision, unref/ref patterns',
    version: '1.0.0',
    category: '06 Nodejs Internals',
    endpoints: {
      health: '/health',
      testPrecision: 'POST /api/timers/test-precision',
      testImmediate: 'GET /api/timers/test-immediate',
      testUnref: 'POST /api/timers/test-unref',
      testInterval: 'GET /api/timers/test-interval',
      microtasksMacrotasks: 'GET /api/timers/microtasks-vs-macrotasks',
      testMemory: 'POST /api/timers/test-memory'
    }
  });
});

// ==================== Server Start ====================

app.listen(HTTP_PORT, () => {
  console.log(`[19-timers-deep-dive] listening on http://localhost:${HTTP_PORT}`);
  console.log(`[19-timers-deep-dive] API base: http://localhost:${HTTP_PORT}/api`);
});

module.exports = app;
