/**
 * AsyncLocalStorage Controller
 * Demonstrates context management across async operations
 */

const { AsyncLocalStorage } = require('async_hooks');

// Create AsyncLocalStorage instances
const userStorage = new AsyncLocalStorage();
const requestIdStorage = new AsyncLocalStorage();
const correlationIdStorage = new AsyncLocalStorage();

// ============================================
// Basic AsyncLocalStorage Demo
// ============================================

exports.demonstrateBasicStorage = (req, res) => {
  const userId = req.query.userId || 'user-' + Date.now();
  const results = {
    operation: 'basic_async_local_storage',
    userId,
    executionTrace: [],
  };

  console.log(`\n=== ASYNC LOCAL STORAGE: ${userId} ===`);

  userStorage.run(userId, async () => {
    results.executionTrace.push(`1. Started with userId: ${userStorage.getStore()}`);

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));

    results.executionTrace.push(`2. After Promise: ${userStorage.getStore()}`);

    // Nested async operation
    setTimeout(() => {
      results.executionTrace.push(`3. In setTimeout: ${userStorage.getStore()}`);
    }, 20);

    // Process.nextTick
    process.nextTick(() => {
      results.executionTrace.push(`4. In nextTick: ${userStorage.getStore()}`);

      setTimeout(() => {
        res.json(results);
      }, 50);
    });
  });
};

// ============================================
// Request Context Tracking
// ============================================

exports.trackRequestContext = (req, res) => {
  const requestId = 'req-' + Date.now();
  const results = {
    operation: 'request_context_tracking',
    requestId,
    operations: [],
  };

  console.log(`\n=== REQUEST CONTEXT: ${requestId} ===`);

  requestIdStorage.run(requestId, async () => {
    // Simulate multiple async operations
    const op1 = new Promise((resolve) => {
      setTimeout(() => {
        results.operations.push({
          name: 'Database Query',
          requestId: requestIdStorage.getStore(),
          duration: 50,
        });
        resolve();
      }, 50);
    });

    const op2 = new Promise((resolve) => {
      setTimeout(() => {
        results.operations.push({
          name: 'Cache Lookup',
          requestId: requestIdStorage.getStore(),
          duration: 30,
        });
        resolve();
      }, 30);
    });

    const op3 = new Promise((resolve) => {
      setTimeout(() => {
        results.operations.push({
          name: 'External API Call',
          requestId: requestIdStorage.getStore(),
          duration: 100,
        });
        resolve();
      }, 100);
    });

    await Promise.all([op1, op2, op3]);

    results.summary = {
      totalOperations: results.operations.length,
      allSameContext: results.operations.every((op) => op.requestId === requestId),
    };

    res.json(results);
  });
};

// ============================================
// Nested Context Isolation
// ============================================

exports.demonstrateNestedContexts = (req, res) => {
  const results = {
    operation: 'nested_context_isolation',
    contexts: [],
  };

  console.log(`\n=== NESTED CONTEXT ISOLATION ===`);

  userStorage.run('user-1', async () => {
    results.contexts.push({
      level: 1,
      userId: userStorage.getStore(),
      timestamp: Date.now(),
    });

    // Nested context
    userStorage.run('user-2', async () => {
      results.contexts.push({
        level: 2,
        userId: userStorage.getStore(),
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      results.contexts.push({
        level: 2.5,
        userId: userStorage.getStore(),
        note: 'Still in nested context',
      });
    });

    // Back to outer context
    results.contexts.push({
      level: 3,
      userId: userStorage.getStore(),
      note: 'Returned to outer context',
    });

    setTimeout(() => {
      res.json(results);
    }, 50);
  });
};

// ============================================
// Error Context Propagation
// ============================================

exports.demonstrateErrorContext = async (req, res) => {
  const requestId = 'req-error-' + Date.now();
  const results = {
    operation: 'error_context_propagation',
    requestId,
    errorLog: [],
  };

  console.log(`\n=== ERROR CONTEXT: ${requestId} ===`);

  requestIdStorage.run(requestId, async () => {
    try {
      // Simulate operation that fails
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Simulated error'));
        }, 20);
      });
    } catch (err) {
      results.errorLog.push({
        error: err.message,
        requestId: requestIdStorage.getStore(),
        timestamp: new Date().toISOString(),
        context: {
          preserved: requestIdStorage.getStore() === requestId,
        },
      });
    }

    // Continue processing even after error
    requestIdStorage.run(requestId, async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));

      results.errorLog.push({
        status: 'Recovered',
        requestId: requestIdStorage.getStore(),
        continueProcessing: true,
      });

      res.json(results);
    });
  });
};

// ============================================
// Performance Context Tracking
// ============================================

exports.trackContextPerformance = (req, res) => {
  const depth = parseInt(req.query.depth) || 5;
  const results = {
    operation: 'context_performance',
    depth,
    measurements: [],
  };

  console.log(`\n=== CONTEXT PERFORMANCE (depth: ${depth}) ===`);

  const startTime = process.hrtime.bigint();

  const processLevel = (level) => {
    if (level > depth) {
      results.measurements.push({
        level: 'end',
        duration: ((process.hrtime.bigint() - startTime) / 1000000n).toString() + ' ms',
      });

      res.json(results);
      return;
    }

    requestIdStorage.run(`level-${level}`, () => {
      results.measurements.push({
        level,
        store: requestIdStorage.getStore(),
      });

      setImmediate(() => processLevel(level + 1));
    });
  };

  processLevel(1);
};
