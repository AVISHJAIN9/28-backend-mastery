/**
 * process.nextTick vs Promise.resolve Controller
 * Demonstrates microtask queue behavior and execution order
 */

// ============================================
// Basic Execution Order Demonstration
// ============================================

exports.demonstrateBasicOrder = (req, res) => {
  const executionOrder = [];

  console.log('\n=== BASIC MICROTASK ORDER ===');

  executionOrder.push('1. Synchronous code starts');

  // Macrotask
  setTimeout(() => {
    executionOrder.push('4. setTimeout (macrotask)');
  }, 0);

  // Microtask 1: nextTick
  process.nextTick(() => {
    executionOrder.push('2. process.nextTick (microtask)');
  });

  // Microtask 2: Promise
  Promise.resolve().then(() => {
    executionOrder.push('3. Promise.resolve (microtask)');
  });

  // Synchronous end
  executionOrder.push('1. Synchronous code ends');

  setImmediate(() => {
    res.json({
      phase: 'basic_order',
      executionOrder,
      explanation:
        'Synchronous code runs first, then ALL microtasks (nextTick + Promises), then macrotasks (setTimeout)',
    });
  });
};

// ============================================
// Nested Callbacks Demonstration
// ============================================

exports.demonstrateNestedCallbacks = (req, res) => {
  const executionOrder = [];

  console.log('\n=== NESTED MICROTASKS ===');

  executionOrder.push('Start');

  process.nextTick(() => {
    executionOrder.push('nextTick 1');

    process.nextTick(() => {
      executionOrder.push('nextTick 1 -> nested nextTick');
    });

    Promise.resolve().then(() => {
      executionOrder.push('nextTick 1 -> nested Promise');
    });
  });

  Promise.resolve()
    .then(() => {
      executionOrder.push('Promise 1');

      Promise.resolve().then(() => {
        executionOrder.push('Promise 1 -> nested Promise');
      });

      process.nextTick(() => {
        executionOrder.push('Promise 1 -> nested nextTick');
      });
    })
    .then(() => {
      executionOrder.push('Promise 1 -> chained Promise');
    });

  setTimeout(() => {
    res.json({
      phase: 'nested_callbacks',
      executionOrder,
      explanation:
        'nextTick callbacks execute before Promise callbacks within the same phase. Chained Promises are also microtasks.',
    });
  }, 50);
};

// ============================================
// Queue Flush Demonstration
// ============================================

exports.demonstrateQueueFlushing = (req, res) => {
  const executionOrder = [];

  console.log('\n=== MICROTASK QUEUE FLUSHING ===');

  executionOrder.push('1. Script start');

  // Add multiple nextTick callbacks
  for (let i = 1; i <= 3; i++) {
    process.nextTick(() => {
      executionOrder.push(`nextTick callback ${i}`);
    });
  }

  // Add multiple Promise callbacks
  for (let i = 1; i <= 3; i++) {
    Promise.resolve().then(() => {
      executionOrder.push(`Promise callback ${i}`);
    });
  }

  executionOrder.push('2. Script end');

  setImmediate(() => {
    res.json({
      phase: 'queue_flushing',
      executionOrder,
      explanation: 'The entire microtask queue is drained before moving to the next macrotask phase',
    });
  });
};

// ============================================
// Performance Comparison
// ============================================

exports.comparePerformance = (req, res) => {
  const iterations = parseInt(req.query.iterations) || 10000;
  const results = {};

  console.log('\n=== PERFORMANCE COMPARISON ===');

  // nextTick performance
  const start1 = process.hrtime.bigint();
  let count1 = 0;

  const nextTickTest = () => {
    count1++;
    if (count1 < iterations) {
      process.nextTick(nextTickTest);
    } else {
      const end1 = process.hrtime.bigint();
      results.nextTick = {
        iterations,
        timeNs: (end1 - start1).toString(),
        timeMs: ((end1 - start1) / 1000000n).toString(),
      };

      // Promise performance
      const start2 = process.hrtime.bigint();
      let count2 = 0;

      const promiseTest = () => {
        count2++;
        if (count2 < iterations) {
          Promise.resolve().then(promiseTest);
        } else {
          const end2 = process.hrtime.bigint();
          results.promise = {
            iterations,
            timeNs: (end2 - start2).toString(),
            timeMs: ((end2 - start2) / 1000000n).toString(),
          };

          res.json({
            phase: 'performance_comparison',
            results,
            explanation: `Compared performance of ${iterations} iterations each`,
          });
        }
      };

      promiseTest();
    }
  };

  nextTickTest();
};

// ============================================
// Error Handling in Microtasks
// ============================================

exports.demonstrateErrorHandling = (req, res) => {
  const executionOrder = [];
  const errors = [];

  console.log('\n=== ERROR HANDLING IN MICROTASKS ===');

  executionOrder.push('Script start');

  // Unhandled nextTick error
  process.nextTick(() => {
    executionOrder.push('nextTick before error');
    throw new Error('nextTick error');
  });

  // This still executes because error is in different callback
  process.nextTick(() => {
    executionOrder.push('nextTick after error (still runs)');
  });

  // Promise rejection
  Promise.reject('Promise rejection').catch((err) => {
    errors.push(`Caught promise error: ${err}`);
    executionOrder.push('Promise rejection caught');
  });

  executionOrder.push('Script end');

  // Unhandled exception handler
  process.on('uncaughtException', (err) => {
    errors.push(`Uncaught exception: ${err.message}`);
    process.removeAllListeners('uncaughtException');
  });

  setTimeout(() => {
    res.json({
      phase: 'error_handling',
      executionOrder,
      errors,
      explanation: 'nextTick errors throw immediately, Promise rejections can be caught',
    });
  }, 100);
};

// ============================================
// Microtask Queue Depth Analysis
// ============================================

exports.analyzeMicrotaskQueueDepth = (req, res) => {
  const depth = parseInt(req.query.depth) || 5;
  const results = {
    depth,
    executionOrder: [],
    statistics: {
      totalCallbacks: 0,
      nextTickCount: 0,
      promiseCount: 0,
    },
  };

  console.log(`\n=== MICROTASK QUEUE DEPTH: ${depth} ===`);

  results.executionOrder.push('Start');

  // Create nested microtasks
  let nextTickCount = 0;
  let promiseCount = 0;

  const addNextTickLevel = (level) => {
    process.nextTick(() => {
      nextTickCount++;
      results.executionOrder.push(`nextTick level ${level}`);

      if (level < depth) {
        addNextTickLevel(level + 1);
      }
    });
  };

  const addPromiseLevel = (level) => {
    Promise.resolve().then(() => {
      promiseCount++;
      results.executionOrder.push(`Promise level ${level}`);

      if (level < depth) {
        addPromiseLevel(level + 1);
      }
    });
  };

  addNextTickLevel(1);
  addPromiseLevel(1);

  results.executionOrder.push('End');

  setImmediate(() => {
    results.statistics.totalCallbacks = nextTickCount + promiseCount;
    results.statistics.nextTickCount = nextTickCount;
    results.statistics.promiseCount = promiseCount;

    res.json({
      phase: 'microtask_queue_depth',
      results,
      explanation: 'Demonstrates how deeply nested microtasks affect execution order',
    });
  });
};

// ============================================
// Real-World Example: Request Handling
// ============================================

exports.realWorldExample = (req, res) => {
  const timeline = [];

  console.log('\n=== REAL-WORLD REQUEST HANDLING ===');

  timeline.push('1. Request received');

  // Express middleware (synchronous)
  timeline.push('2. Express middleware (sync)');

  // Database query with callback
  process.nextTick(() => {
    timeline.push('3. DB query callback (nextTick)');
  });

  // Promise-based operation
  Promise.resolve()
    .then(() => {
      timeline.push('4. Async operation (Promise)');
    })
    .then(() => {
      timeline.push('5. Chained async operation');
    });

  // HTTP response
  setTimeout(() => {
    timeline.push('6. Response sent (macrotask)');

    res.json({
      phase: 'real_world_example',
      timeline,
      explanation: 'Shows how request handling involves both microtasks and macrotasks',
    });
  }, 10);
};
