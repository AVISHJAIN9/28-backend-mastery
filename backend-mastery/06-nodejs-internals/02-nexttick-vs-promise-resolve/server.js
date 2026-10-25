const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3002;

// Track execution order
let executionLog = [];
let isRunning = false;

// Route: Run execution order demo
app.post('/api/microtasks/run-demo', (req, res) => {
  if (isRunning) {
    return res.status(429).json({ error: 'Demo already running' });
  }

  isRunning = true;
  executionLog = [];
  const demoType = req.body.type || 'basic';

  try {
    switch (demoType) {
      case 'basic':
        runBasicDemo();
        break;
      case 'mixed':
        runMixedDemo();
        break;
      case 'nested':
        runNestedDemo();
        break;
      case 'promise-vs-nexttick':
        runPromiseVsNextTick();
        break;
      case 'setimmediate-comparison':
        runSetImmediateComparison();
        break;
      default:
        runBasicDemo();
    }

    // Give async operations time to complete
    setTimeout(() => {
      isRunning = false;
      res.json({ 
        execution: executionLog,
        type: demoType,
        timestamp: new Date().toISOString()
      });
    }, 100);
  } catch (error) {
    isRunning = false;
    res.status(500).json({ error: error.message });
  }
});

// Route: Get metrics
app.get('/api/microtasks/metrics', (req, res) => {
  res.json({
    isRunning,
    logSize: executionLog.length,
    lastExecution: executionLog.length > 0 ? executionLog[executionLog.length - 1] : null
  });
});

// Demo 1: Basic execution order
function runBasicDemo() {
  log('Step 1: Console.log');

  setTimeout(() => {
    log('Step 5: setTimeout (macrotask)');
  }, 0);

  Promise.resolve()
    .then(() => log('Step 3: Promise.then (microtask)'));

  process.nextTick(() => {
    log('Step 2: process.nextTick');
  });

  log('Step 1.5: Console.log (sync)');
}

// Demo 2: Mixed microtasks and macrotasks
function runMixedDemo() {
  log('START');

  process.nextTick(() => {
    log('nextTick 1');
    Promise.resolve().then(() => log('Promise inside nextTick'));
  });

  Promise.resolve()
    .then(() => {
      log('Promise 1');
      process.nextTick(() => log('nextTick inside Promise'));
    })
    .then(() => log('Promise 2'));

  setTimeout(() => {
    log('setTimeout 1');
  }, 0);

  setImmediate(() => {
    log('setImmediate');
  });

  log('END (sync)');
}

// Demo 3: Deeply nested
function runNestedDemo() {
  log('Script start');

  // Deep nesting
  process.nextTick(() => {
    log('nextTick Level 1');
    process.nextTick(() => {
      log('nextTick Level 2');
      process.nextTick(() => {
        log('nextTick Level 3');
      });
    });
  });

  Promise.resolve()
    .then(() => {
      log('Promise Level 1');
      return Promise.resolve();
    })
    .then(() => {
      log('Promise Level 2');
      return Promise.resolve();
    })
    .then(() => {
      log('Promise Level 3');
    });

  log('Script end');
}

// Demo 4: Promise vs nextTick comparison
function runPromiseVsNextTick() {
  log('=== Promise vs nextTick ===');

  const iterations = 3;

  for (let i = 1; i <= iterations; i++) {
    process.nextTick(() => {
      log(`nextTick ${i}`);
    });

    Promise.resolve().then(() => {
      log(`Promise ${i}`);
    });
  }

  log('Main execution done');
}

// Demo 5: setImmediate comparison
function runSetImmediateComparison() {
  log('=== Comparison: nextTick vs Promise vs setImmediate ===');

  process.nextTick(() => log('nextTick 1'));
  setTimeout(() => log('setTimeout'), 0);
  Promise.resolve().then(() => log('Promise 1'));
  setImmediate(() => log('setImmediate 1'));

  process.nextTick(() => log('nextTick 2'));
  Promise.resolve().then(() => log('Promise 2'));
  setImmediate(() => log('setImmediate 2'));

  log('Sync code done');
}

// Helper: Log execution
function log(message) {
  executionLog.push({
    message,
    timestamp: Date.now(),
    order: executionLog.length + 1
  });
}

// Route: Learning resources
app.get('/api/microtasks/explanation', (req, res) => {
  res.json({
    microtasks: {
      definition: 'Tasks queued in the microtask queue (Promise callbacks, process.nextTick)',
      timing: 'Execute after current execution context but BEFORE next event loop phase',
      priority: 'Execute AFTER nextTick but BEFORE macrotasks'
    },
    nextTick: {
      definition: 'process.nextTick queues a callback to execute as soon as the current operation completes',
      timing: 'Runs before the event loop continues',
      priority: 'Highest priority - even before Promises!'
    },
    macrotasks: {
      definition: 'setTimeout, setInterval, setImmediate, I/O operations',
      timing: 'Execute during event loop phases',
      priority: 'Lower priority than microtasks'
    },
    executionOrder: [
      '1. Synchronous code',
      '2. process.nextTick callbacks',
      '3. Microtasks (Promises)',
      '4. Event loop phases (timers, I/O, etc)',
      '5. setImmediate'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Microtasks server running on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  POST /api/microtasks/run-demo - Run execution order demo');
  console.log('  GET /api/microtasks/metrics - Get current metrics');
  console.log('  GET /api/microtasks/explanation - Get learning resources');
});

module.exports = app;
