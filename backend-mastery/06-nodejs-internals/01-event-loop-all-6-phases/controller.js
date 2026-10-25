/**
 * Event Loop - All 6 Phases Controller
 * Demonstrates the event loop phases with practical examples
 */

const EventEmitter = require('events');
const util = require('util');

// Track event loop metrics
let metrics = {
  timersExecuted: 0,
  pendingCallbacksExecuted: 0,
  pollCallbacksExecuted: 0,
  checkCallbacksExecuted: 0,
  closeCallbacksExecuted: 0,
  nextTickCallbacks: 0,
  promiseResolvedCallbacks: 0,
};

// ============================================
// Phase 1: Timers Phase
// ============================================

exports.demonstrateTimersPhase = (req, res) => {
  const results = [];

  console.log('\n=== TIMERS PHASE ===');
  results.push('Starting timers phase demonstration...');

  // setTimeout callbacks execute in timers phase
  setTimeout(() => {
    metrics.timersExecuted++;
    console.log('1. setTimeout 0ms executed');
    results.push('✅ setTimeout with 0ms delay executed in timers phase');
  }, 0);

  setTimeout(() => {
    metrics.timersExecuted++;
    console.log('2. setTimeout 10ms executed');
  }, 10);

  // setInterval (queued in timers phase)
  const intervalId = setInterval(() => {
    metrics.timersExecuted++;
    console.log('3. setInterval tick');
    clearInterval(intervalId);
  }, 20);

  // Immediate callback to show results
  setImmediate(() => {
    results.push(`Total timers executed: ${metrics.timersExecuted}`);
    res.json({
      phase: 'timers',
      results,
      metrics,
    });
  });
};

// ============================================
// Phase 2 & 3: Pending & Idle Callbacks
// ============================================

exports.demonstratePendingCallbacks = (req, res) => {
  const results = [];

  console.log('\n=== PENDING CALLBACKS & I/O ===');

  // Simulate I/O operation
  const fs = require('fs');

  // This callback will be deferred to pending callbacks phase
  fs.readFile(__filename, (err, data) => {
    if (!err) {
      metrics.pollCallbacksExecuted++;
      console.log('File read I/O callback executed');
      results.push('✅ File I/O callback executed');
    }
  });

  // Show results after I/O completes
  setTimeout(() => {
    res.json({
      phase: 'pending_callbacks_and_poll',
      results,
      metrics,
    });
  }, 50);
};

// ============================================
// Phase 4: Poll Phase (main I/O handling)
// ============================================

exports.demonstratePollPhase = (req, res) => {
  const results = [];

  console.log('\n=== POLL PHASE ===');
  results.push('Poll phase happens after timers');
  results.push('Waits for I/O events and executes callbacks');
  results.push('Can block until timeout or events arrive');

  // The poll phase keeps the event loop alive
  // If no timers set, it can block indefinitely
  // If timers set, it blocks only until next timer

  res.json({
    phase: 'poll',
    explanation: 'Poll phase is where the event loop spends most time',
    results,
  });
};

// ============================================
// Phase 5: Check Phase (setImmediate)
// ============================================

exports.demonstrateCheckPhase = (req, res) => {
  const results = [];

  console.log('\n=== CHECK PHASE ===');

  // setImmediate callbacks execute in check phase
  setImmediate(() => {
    metrics.checkCallbacksExecuted++;
    console.log('setImmediate callback 1 (check phase)');
    results.push('✅ setImmediate executes in check phase');
  });

  setImmediate(() => {
    metrics.checkCallbacksExecuted++;
    console.log('setImmediate callback 2');
  });

  // setTimeout runs before setImmediate in next cycle
  setTimeout(() => {
    res.json({
      phase: 'check',
      results,
      metrics,
    });
  }, 50);
};

// ============================================
// Phase 6: Close Phase
// ============================================

exports.demonstrateClosePhase = (req, res) => {
  const net = require('net');
  const results = [];

  console.log('\n=== CLOSE PHASE ===');

  // Create a server to demonstrate close callbacks
  const server = net.createServer(() => {});

  server.on('close', () => {
    metrics.closeCallbacksExecuted++;
    console.log('Server close callback executed');
    results.push('✅ Server close callback executed in close phase');

    res.json({
      phase: 'close',
      results,
      metrics,
      explanation: 'Close phase executes callbacks from closed handles',
    });
  });

  server.listen(0, () => {
    server.close();
  });
};

// ============================================
// Execution Order Demonstration
// ============================================

exports.demonstrateExecutionOrder = (req, res) => {
  const executionOrder = [];

  console.log('\n=== EXECUTION ORDER DEMONSTRATION ===');

  // 1. Synchronous code (runs immediately)
  executionOrder.push('1. Synchronous code');
  console.log('1. Synchronous code');

  // 2. process.nextTick (highest priority, runs before promises)
  process.nextTick(() => {
    metrics.nextTickCallbacks++;
    executionOrder.push('2. process.nextTick #1');
    console.log('2. process.nextTick #1');
  });

  process.nextTick(() => {
    metrics.nextTickCallbacks++;
    executionOrder.push('3. process.nextTick #2');
    console.log('3. process.nextTick #2');
  });

  // 3. Promise (microtask queue, after nextTick)
  Promise.resolve()
    .then(() => {
      metrics.promiseResolvedCallbacks++;
      executionOrder.push('4. Promise #1');
      console.log('4. Promise #1');
    })
    .then(() => {
      metrics.promiseResolvedCallbacks++;
      executionOrder.push('5. Promise #2');
      console.log('5. Promise #2');
    });

  // 4. setTimeout (timers phase, later)
  setTimeout(() => {
    metrics.timersExecuted++;
    executionOrder.push('6. setTimeout 0ms');
    console.log('6. setTimeout 0ms');
  }, 0);

  // 5. setImmediate (check phase, after poll)
  setImmediate(() => {
    metrics.checkCallbacksExecuted++;
    executionOrder.push('7. setImmediate');
    console.log('7. setImmediate');

    // Return results after all phases
    res.json({
      executionOrder,
      expectedOrder: [
        'Synchronous code',
        'process.nextTick (both)',
        'Promise (both)',
        'setTimeout',
        'setImmediate',
      ],
      metrics,
    });
  });
};

// ============================================
// Event Loop Lag Detection
// ============================================

exports.demonstrateEventLoopLag = (req, res) => {
  const results = [];
  let lastTime = Date.now();
  const samples = [];

  console.log('\n=== EVENT LOOP LAG DETECTION ===');

  // Simulate blocking operation
  function blockEventLoop(durationMs) {
    const start = Date.now();
    while (Date.now() - start < durationMs) {
      // Busy wait - blocks event loop
    }
  }

  // Heavy synchronous work
  console.log('Starting heavy computation...');
  blockEventLoop(100); // Block for 100ms

  // Check how much delay there was
  const now = Date.now();
  const actualDelay = now - lastTime;

  results.push(`Requested blocking: 100ms`);
  results.push(`Actual elapsed: ${actualDelay}ms`);
  results.push(`Event loop blocked roughly: ${actualDelay - 100}ms`);

  // Measure lag with setImmediate
  const lagStart = Date.now();
  setImmediate(() => {
    const lagEnd = Date.now();
    const lag = lagEnd - lagStart;

    results.push(`\nEvent loop lag: ${lag}ms`);
    results.push(lag > 10 ? '⚠️ Significant lag detected' : '✅ Lag within acceptable range');

    res.json({
      blockingTest: results,
      metrics,
    });
  });
};

// ============================================
// Microtasks vs Macrotasks
// ============================================

exports.demonstrateMicrovsMacro = (req, res) => {
  const execution = [];

  console.log('\n=== MICROTASKS VS MACROTASKS ===');

  execution.push('Start');

  // Macrotask
  setTimeout(() => {
    execution.push('setTimeout (macrotask)');
  }, 0);

  // Microtask (multiple)
  Promise.resolve().then(() => {
    execution.push('Promise.then #1 (microtask)');
  });

  Promise.resolve().then(() => {
    execution.push('Promise.then #2 (microtask)');
  });

  // Macrotask
  setImmediate(() => {
    execution.push('setImmediate (macrotask)');
  });

  // Microtask
  process.nextTick(() => {
    execution.push('process.nextTick (microtask)');
  });

  execution.push('End (synchronous)');

  // Get results after event loop cycles
  setImmediate(() => {
    setImmediate(() => {
      res.json({
        execution,
        explanation: {
          microtasks: 'Execute between phases (nextTick, promises)',
          macrotasks: 'Execute in phases (timers, I/O, check, close)',
          priority: 'Microtasks run BEFORE next macrotask',
        },
      });
    });
  });
};

// ============================================
// Blocking Detection Middleware
// ============================================

let lastCheck = Date.now();
const lagHistory = [];

exports.monitorEventLoopLag = () => {
  return (req, res, next) => {
    const now = Date.now();
    const expectedDelay = 1000; // Check every 1000ms
    const actualDelay = now - lastCheck;
    const lag = actualDelay - expectedDelay;

    if (lag > 100) {
      console.warn(`⚠️ Event loop lag detected: ${lag}ms`);
    }

    lagHistory.push({
      timestamp: new Date(),
      lag: Math.max(0, lag),
    });

    // Keep only last 100 measurements
    if (lagHistory.length > 100) {
      lagHistory.shift();
    }

    lastCheck = now;
    next();
  };
};

// ============================================
// Get Metrics
// ============================================

exports.getMetrics = (req, res) => {
  const avgLag =
    lagHistory.length > 0
      ? (lagHistory.reduce((sum, m) => sum + m.lag, 0) / lagHistory.length).toFixed(2)
      : 0;

  res.json({
    metrics,
    eventLoopHealth: {
      averageLag: `${avgLag}ms`,
      lagSamples: lagHistory.length,
      recentLag: lagHistory.length > 0 ? lagHistory[lagHistory.length - 1].lag : 0,
      health: avgLag < 10 ? '✅ Healthy' : avgLag < 50 ? '⚠️ Acceptable' : '❌ Concerning',
    },
    timestamp: new Date(),
  });
};

// ============================================
// Reset Metrics
// ============================================

exports.resetMetrics = (req, res) => {
  metrics = {
    timersExecuted: 0,
    pendingCallbacksExecuted: 0,
    pollCallbacksExecuted: 0,
    checkCallbacksExecuted: 0,
    closeCallbacksExecuted: 0,
    nextTickCallbacks: 0,
    promiseResolvedCallbacks: 0,
  };

  lagHistory.length = 0;

  res.json({
    message: 'Metrics reset',
    timestamp: new Date(),
  });
};

