const express = require('express');
const { AsyncLocalStorage } = require('async_hooks');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3005;

// Module 5: Async Local Storage

// Create ALS instance
const userContext = new AsyncLocalStorage();
const requestContext = new AsyncLocalStorage();

let executionLog = [];

// Route: Basic ALS demonstration
app.post('/api/als/basic-demo', (req, res) => {
  executionLog = [];

  const userId = req.body.userId || 'user-123';
  
  userContext.run({ userId, requestId: Math.random() }, async () => {
    log(`User ${userId} request started`);

    // Simulate async operations
    await new Promise(r => setTimeout(r, 10));
    
    // Access context from within async operation
    const context = userContext.getStore();
    log(`Accessed context in async: ${context.userId}`);

    // Nested async operation
    await performNestedOperation();

    res.json({ execution: executionLog });
  });
});

async function performNestedOperation() {
  const context = userContext.getStore();
  log(`Nested operation - User: ${context.userId}`);
  
  await new Promise(r => setTimeout(r, 10));
  
  log(`Nested operation - User still: ${context.userId}`);
}

// Route: Multiple request isolation
app.post('/api/als/isolation', async (req, res) => {
  const requests = req.body.requests || 3;
  const results = [];

  // Simulate concurrent requests with different contexts
  const promises = Array(requests).fill(0).map((_, i) => {
    return new Promise((resolve) => {
      userContext.run({ userId: `user-${i}`, requestId: i }, async () => {
        const ctx = userContext.getStore();
        await new Promise(r => setTimeout(r, Math.random() * 100));
        
        const ctx2 = userContext.getStore();
        results.push({
          requestId: i,
          correctContext: ctx.userId === ctx2.userId,
          value: ctx2.userId
        });
        resolve();
      });
    });
  });

  await Promise.all(promises);
  res.json({ isolation: results });
});

// Route: Common use case - Request IDs
app.post('/api/als/request-tracking', (req, res) => {
  executionLog = [];
  const requestId = req.body.requestId || Math.random().toString(36);

  requestContext.run(requestId, async () => {
    log(`Request ${requestId} started`);
    
    // Simulate database call
    await simulateDatabaseCall('users');
    
    // Simulate API call with automatic request ID
    await simulateApiCall('/api/endpoint');
    
    res.json({
      requestId,
      logs: executionLog,
      allIncludeRequestId: executionLog.every(l => l.includes(requestId))
    });
  });
});

async function simulateDatabaseCall(table) {
  const requestId = requestContext.getStore();
  log(`[${requestId}] Database query: SELECT * FROM ${table}`);
  await new Promise(r => setTimeout(r, 10));
}

async function simulateApiCall(endpoint) {
  const requestId = requestContext.getStore();
  log(`[${requestId}] API call to ${endpoint}`);
  await new Promise(r => setTimeout(r, 10));
}

// Route: Compare with and without ALS
app.get('/api/als/comparison', (req, res) => {
  res.json({
    withoutALS: {
      approach: 'Pass context through all functions',
      downside: 'Function signatures get messy',
      example: 'function doWork(userId, context) { ... }'
    },
    withALS: {
      approach: 'Store context in AsyncLocalStorage',
      benefit: 'Clean function signatures',
      example: 'function doWork() { const ctx = storage.getStore(); }'
    }
  });
});

// Route: Memory implications
app.post('/api/als/memory-test', async (req, res) => {
  const iterations = req.body.iterations || 1000;
  const results = [];

  const initialMem = process.memoryUsage().heapUsed;

  for (let i = 0; i < iterations; i++) {
    await new Promise((resolve) => {
      userContext.run({ userId: `user-${i}` }, () => {
        results.push(userContext.getStore());
        resolve();
      });
    });
  }

  const finalMem = process.memoryUsage().heapUsed;

  res.json({
    iterations,
    memoryIncreaseMB: ((finalMem - initialMem) / 1024 / 1024).toFixed(2),
    avgPerContextMB: (((finalMem - initialMem) / 1024 / 1024) / iterations).toFixed(4)
  });
});

function log(message) {
  executionLog.push(message);
}

app.listen(PORT, () => {
  console.log(`🚀 AsyncLocalStorage server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  POST /api/als/basic-demo - Basic ALS demo');
  console.log('  POST /api/als/isolation - Request isolation');
  console.log('  POST /api/als/request-tracking - Request tracking');
  console.log('  GET /api/als/comparison - Comparison with/without ALS');
  console.log('  POST /api/als/memory-test - Memory implications');
});

module.exports = app;
