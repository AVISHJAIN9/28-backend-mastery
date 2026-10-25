const express = require('express');
const v8 = require('v8');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3008;

// Module 8: Memory Leaks Patterns

let globalCache = [];
let listenerLeaks = [];
let promiseRejects = [];

// Route: Detect memory leak pattern
app.post('/api/memory/patterns', (req, res) => {
  const { pattern } = req.body;

  try {
    switch (pattern) {
      case 'global-accumulation': {
        // Memory leak: Global variable accumulating
        const data = new Array(1e6).fill('leak');
        globalCache.push(data);

        res.json({
          pattern: 'Global Accumulation',
          issue: 'Array growing indefinitely in global scope',
          problem: globalCache.length + ' items in cache',
          solution: 'Use WeakMap, implement cache eviction, or limit size'
        });
        break;
      }

      case 'event-listener': {
        // Memory leak: Listeners not removed
        const emitter = new (require('events'));
        const listener = () => { };
        emitter.on('data', listener);
        listenerLeaks.push({ emitter, listener });

        res.json({
          pattern: 'Event Listener Leak',
          issue: 'Listeners not removed after use',
          leakCount: listenerLeaks.length,
          solution: 'Always use removeListener() or once()'
        });
        break;
      }

      case 'detached-dom': {
        // Memory leak pattern explanation
        res.json({
          pattern: 'Detached DOM (Node)',
          issue: 'Holding references to removed objects',
          nodeExample: 'Keeping reference to deleted stream objects',
          solution: 'Clear references, use try-finally for cleanup'
        });
        break;
      }

      case 'set-interval': {
        // Memory leak: setInterval never cleared
        setInterval(() => {
          promiseRejects.push(Math.random());
        }, 100);

        res.json({
          pattern: 'Uncleared Interval',
          issue: 'setInterval running forever',
          intervalCount: 1,
          solution: 'Always clearInterval() when done'
        });
        break;
      }

      case 'promise-rejection': {
        // Memory leak: Unhandled promise rejections
        Promise.reject('unhandled');

        res.json({
          pattern: 'Unhandled Promise Rejection',
          issue: 'Promises stored internally',
          solution: 'Always .catch() or use try-catch with async-await'
        });
        break;
      }

      default:
        res.json({ error: 'Unknown pattern' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route: Get memory stats
app.get('/api/memory/stats', (req, res) => {
  const mem = process.memoryUsage();
  
  res.json({
    rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
    heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    external: (mem.external / 1024 / 1024).toFixed(2) + ' MB',
    arrayBuffers: (mem.arrayBuffers / 1024 / 1024).toFixed(2) + ' MB',
    cleanupNeeded: {
      globalCacheItems: globalCache.length,
      listenerLeaks: listenerLeaks.length,
      unhandledRejections: promiseRejects.length
    }
  });
});

// Route: Cleanup
app.post('/api/memory/cleanup', (req, res) => {
  const before = process.memoryUsage();

  // Clear leaks
  globalCache = [];
  listenerLeaks = [];
  promiseRejects = [];

  const after = process.memoryUsage();

  res.json({
    memoryFreedMB: ((before.heapUsed - after.heapUsed) / 1024 / 1024).toFixed(2),
    message: 'Cleanup completed',
    collectGarbage: 'Consider running garbage collection'
  });
});

// Route: Common memory leak patterns
app.get('/api/memory/leak-patterns', (req, res) => {
  res.json({
    patterns: [
      {
        name: 'Global Variables Accumulation',
        cause: 'Variables at global scope storing data indefinitely',
        example: 'globalArray.push(largeObject)',
        fix: 'Use function scope, WeakMap, or implement cleanup'
      },
      {
        name: 'Forgotten Timers',
        cause: 'setInterval/setTimeout never cleared',
        example: 'setInterval(fn, 1000) without clearInterval',
        fix: 'Store reference and clear when done'
      },
      {
        name: 'Event Listener Leaks',
        cause: 'Listeners never removed',
        example: 'emitter.on() without matching off()',
        fix: 'Use emitter.once() or always remove'
      },
      {
        name: 'Circular References',
        cause: 'Objects reference each other preventing GC',
        example: 'parent.child = child; child.parent = parent',
        fix: 'Use WeakMap for back-references'
      },
      {
        name: 'Cached References',
        cause: 'Cache never purged',
        example: 'cache[key] = value stored forever',
        fix: 'Use LRU cache or TTL'
      },
      {
        name: 'Unhandled Promises',
        cause: 'Rejected promises never handled',
        example: 'Promise.reject() without .catch()',
        fix: 'Always handle errors'
      }
    ]
  });
});

// Route: Profiling tips
app.get('/api/memory/profiling', (req, res) => {
  res.json({
    tools: [
      'clinic.js - Real-time monitoring',
      'node-inspect - Debugger integration',
      'heapdump - Create heap snapshots',
      'autocannon - Load testing',
      'NODE_DEBUG=* - Environment variable'
    ],
    heapSnapshot: v8.writeHeapSnapshot(),
    monitoring: {
      step1: 'Get baseline memory',
      step2: 'Run suspicious code',
      step3: 'Trigger garbage collection',
      step4: 'Compare memory usage'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Memory Leaks server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  POST /api/memory/patterns - Pattern demonstrations');
  console.log('  GET /api/memory/stats - Current memory stats');
  console.log('  POST /api/memory/cleanup - Cleanup');
  console.log('  GET /api/memory/leak-patterns - Common patterns');
  console.log('  GET /api/memory/profiling - Profiling tools');
});

module.exports = app;
