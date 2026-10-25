require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const inspector = require('inspector');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3020;

// ==================== Middleware ====================

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Inspector State ====================

const debugState = {
  profiles: [],
  startTime: Date.now(),
  callCount: 0,
  errors: []
};

// ==================== Routes ====================

// Get inspector info
app.get('/api/debug/inspector-info', (req, res) => {
  const info = inspector.url();
  res.json({
    success: true,
    inspectorUrl: info,
    pid: process.pid,
    version: process.version,
  });
});

// Simple profiling endpoint
app.post('/api/debug/cpu-intensive', (req, res) => {
  const { iterations } = req.body;
  
  debugState.callCount++;
  const start = Date.now();
  
  // Simulate CPU work
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  
  const duration = Date.now() - start;
  
  res.json({
    success: true,
    iterations,
    duration,
    result: result.toFixed(2)
  });
});

// Memory usage endpoint
app.get('/api/debug/memory-usage', (req, res) => {
  const usage = process.memoryUsage();
  
  res.json({
    success: true,
    memory: {
      heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      rss: (usage.rss / 1024 / 1024).toFixed(2) + ' MB',
      external: (usage.external / 1024 / 1024).toFixed(2) + ' MB'
    }
  });
});

// Performance metrics
app.get('/api/debug/performance', (req, res) => {
  const uptime = process.uptime();
  const usage = process.cpuUsage();
  
  res.json({
    success: true,
    uptime: uptime.toFixed(2) + 's',
    cpu: {
      user: usage.user,
      system: usage.system
    },
    memory: process.memoryUsage(),
    pid: process.pid
  });
});

// Test breakpoint simulation
app.post('/api/debug/breakpoint-test', (req, res) => {
  const { value } = req.body;
  
  // Simulate breakpoint by inspecting code path
  let status = 'initialized';
  
  if (value > 100) {
    status = 'large value';
  } else if (value > 50) {
    status = 'medium value';
  } else {
    status = 'small value';
  }
  
  res.json({
    success: true,
    status,
    value,
    timestamp: new Date().toISOString()
  });
});

// Simulate slow function for profiling
app.post('/api/debug/slow-function', (req, res) => {
  const { duration } = req.body;
  const start = Date.now();
  
  // Simulate work
  while (Date.now() - start < duration) {
    // Busy work
    for (let i = 0; i < 1000000; i++) {}
  }
  
  res.json({
    success: true,
    actualDuration: Date.now() - start,
    requestedDuration: duration
  });
});

// Error tracking
app.post('/api/debug/trigger-error', (req, res) => {
  const { errorType } = req.body;
  
  try {
    if (errorType === 'reference') {
      const x = nonexistent.value;
    } else if (errorType === 'type') {
      const arr = [];
      arr.push.call(null, 'invalid');
    } else {
      throw new Error(`Custom error: ${errorType}`);
    }
  } catch (error) {
    debugState.errors.push({
      type: errorType,
      message: error.message,
      timestamp: new Date()
    });
    
    res.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Get debug statistics
app.get('/api/debug/stats', (req, res) => {
  res.json({
    success: true,
    uptime: Date.now() - debugState.startTime,
    callCount: debugState.callCount,
    errorCount: debugState.errors.length,
    errors: debugState.errors
  });
});

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: '20 Debugging & Inspector',
    category: '06 Nodejs Internals',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '20 Debugging & Inspector',
    module: '06-nodejs-internals - 20',
    description: 'Chrome DevTools protocol, breakpoints, profiling',
    version: '1.0.0',
    category: '06 Nodejs Internals',
    endpoints: {
      health: '/health',
      inspectorInfo: 'GET /api/debug/inspector-info',
      cpuIntensive: 'POST /api/debug/cpu-intensive',
      memoryUsage: 'GET /api/debug/memory-usage',
      performance: 'GET /api/debug/performance',
      breakpointTest: 'POST /api/debug/breakpoint-test',
      slowFunction: 'POST /api/debug/slow-function',
      triggerError: 'POST /api/debug/trigger-error',
      stats: 'GET /api/debug/stats'
    },
    debugTip: 'Run with: node --inspect server.js, then open chrome://inspect'
  });
});

// ==================== Server Start ====================

app.listen(HTTP_PORT, () => {
  console.log(`[20-debugging-inspector] listening on http://localhost:${HTTP_PORT}`);
  console.log(`[20-debugging-inspector] API base: http://localhost:${HTTP_PORT}/api`);
  console.log(`[20-debugging-inspector] Debug with: node --inspect server.js`);
  console.log(`[20-debugging-inspector] Then open: chrome://inspect`);
});

module.exports = app;
