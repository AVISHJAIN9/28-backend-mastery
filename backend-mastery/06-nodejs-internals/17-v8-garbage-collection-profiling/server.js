const express = require('express');
const v8 = require('v8');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3017;

// Module 17: V8, Garbage Collection & Profiling

// Route: Heap statistics
app.get('/api/v8/heap-stats', (req, res) => {
  const heapStats = v8.getHeapStatistics();
  const heapSpaces = v8.getHeapSpaceStatistics();

  res.json({
    total: {
      limitMB: (heapStats.heap_size_limit / 1024 / 1024).toFixed(2),
      executableMB: (heapStats.total_executable_size / 1024 / 1024).toFixed(2)
    },
    spaces: heapSpaces.map(space => ({
      name: space.space_name,
      physicalSizeMB: (space.physical_size / 1024 / 1024).toFixed(2),
      usedSizeMB: (space.space_used_size / 1024 / 1024).toFixed(2),
      availableSizeMB: (space.space_available_size / 1024 / 1024).toFixed(2)
    }))
  });
});

// Route: Heap snapshot
app.post('/api/v8/heap-snapshot', (req, res) => {
  try {
    const filename = v8.writeHeapSnapshot();
    res.json({
      created: true,
      filename,
      use: 'Analyze with Chrome DevTools',
      location: process.cwd(),
      note: 'Snapshot can be large for memory-heavy apps'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: GC information
app.post('/api/v8/gc-demo', (req, res) => {
  const before = process.memoryUsage();

  // Create temporary objects
  let tempArray = [];
  for (let i = 0; i < 100000; i++) {
    tempArray.push({ data: 'temp' + i });
  }

  // Clear reference
  tempArray = null;

  // Force GC if available (only works with --expose-gc)
  if (global.gc) {
    global.gc();
    const after = process.memoryUsage();

    res.json({
      gcAvailable: true,
      note: 'Run with: node --expose-gc app.js',
      beforeHeapMB: (before.heapUsed / 1024 / 1024).toFixed(2),
      afterHeapMB: (after.heapUsed / 1024 / 1024).toFixed(2),
      freedMB: ((before.heapUsed - after.heapUsed) / 1024 / 1024).toFixed(2)
    });
  } else {
    res.json({
      gcAvailable: false,
      instruction: 'Run with --expose-gc flag to see GC behavior'
    });
  }
});

// Route: GC types and behavior
app.get('/api/v8/gc-types', (req, res) => {
  res.json({
    scavenge: {
      name: 'Scavenge (Minor GC)',
      description: 'Quick collection of young objects',
      frequency: 'Frequent (100ms)',
      pause: '1-10ms',
      target: 'New space'
    },
    markSweep: {
      name: 'Mark-Sweep (Major GC)',
      description: 'Full heap collection',
      frequency: 'Rare (seconds)',
      pause: '10-100ms',
      target: 'Old space'
    },
    compact: {
      name: 'Compaction',
      description: 'Defragment heap memory',
      frequency: 'Automatic',
      pause: '10-50ms',
      target: 'Fragmented areas'
    },
    incremental: {
      name: 'Incremental GC',
      description: 'Pause-based collection',
      advantage: 'Reduces pause times',
      pauses: 'Multiple short pauses'
    }
  });
});

// Route: V8 optimization
app.get('/api/v8/optimization', (req, res) => {
  res.json({
    techniques: [
      {
        name: 'Hidden Classes',
        description: 'V8 groups objects with same structure',
        benefit: 'Faster property access',
        tip: 'Keep object shapes consistent'
      },
      {
        name: 'Inline Caching',
        description: 'Cache object property locations',
        benefit: 'Property lookup optimization',
        tip: 'Avoid changing object shapes'
      },
      {
        name: 'Just-In-Time (JIT)',
        description: 'Compile hot code to machine code',
        benefit: '10-100x speedup',
        tip: 'Profile to find hot paths'
      },
      {
        name: 'Deoptimization',
        description: 'Revert to interpreter if assumptions fail',
        benefit: 'Correctness over speed',
        tip: 'Avoid polymorphic call sites'
      }
    ]
  });
});

// Route: Memory leak detection
app.post('/api/v8/potential-leaks', (req, res) => {
  res.json({
    commonPatterns: [
      {
        pattern: 'Global accumulation',
        cause: 'Array/object growing in global scope',
        detection: 'Heap snapshot growth over time',
        fix: 'Implement cleanup or limits'
      },
      {
        pattern: 'Forgotten timers',
        cause: 'setInterval never cleared',
        detection: 'Timer queue keeps growing',
        fix: 'Store and clear intervals'
      },
      {
        pattern: 'Circular references',
        cause: 'Objects reference each other',
        detection: 'Reference cycles in heap',
        fix: 'Use WeakMap for back-refs'
      },
      {
        pattern: 'Event listeners',
        cause: 'Listeners never removed',
        detection: 'Listener count growing',
        fix: 'Always remove listeners'
      }
    ]
  });
});

// Route: Profiling strategies
app.get('/api/v8/profiling', (req, res) => {
  res.json({
    tools: {
      nodeProfiler: 'node --prof app.js',
      chromeDevTools: 'node --inspect app.js',
      cpuProfile: 'node --prof app.js then process with prof-process',
      heapSnapshots: 'v8.writeHeapSnapshot() in code'
    },
    steps: [
      '1. Identify bottleneck (CPU vs memory)',
      '2. Get baseline metrics',
      '3. Run workload',
      '4. Collect profile',
      '5. Analyze results',
      '6. Make optimization',
      '7. Measure improvement'
    ]
  });
});

// Route: Code generation optimization
app.get('/api/v8/codegen-tips', (req, res) => {
  res.json({
    doThis: [
      'Keep functions similar for hidden classes',
      'Initialize objects consistently',
      'Avoid polymorphic function arguments',
      'Use monomorphic call sites',
      'Preallocate array sizes',
      'Avoid sparse arrays'
    ],
    avoidThis: [
      'Changing properties after creation',
      'Mixing types in same variable',
      'Complex prototype chains',
      'Assignment patterns that confuse V8',
      'Dynamic property names',
      'Frequent property deletion'
    ]
  });
});

// Route: Memory profiling
app.post('/api/v8/memory-profile', (req, res) => {
  const before = process.memoryUsage();
  
  // Create objects to measure
  const objects = [];
  for (let i = 0; i < 10000; i++) {
    objects.push({
      id: i,
      name: 'object' + i,
      data: new Array(100).fill(Math.random())
    });
  }

  const after = process.memoryUsage();

  res.json({
    objectsCreated: 10000,
    heapDelta: ((after.heapUsed - before.heapUsed) / 1024).toFixed(2) + ' KB',
    perObject: (((after.heapUsed - before.heapUsed) / 10000) / 1024).toFixed(3) + ' KB',
    rss: {
      before: (before.rss / 1024 / 1024).toFixed(2) + ' MB',
      after: (after.rss / 1024 / 1024).toFixed(2) + ' MB'
    }
  });
});

// Route: Performance measurement
app.post('/api/v8/performance-measure', async (req, res) => {
  const { operation = 'array' } = req.body;
  
  const start = process.hrtime.bigint();

  if (operation === 'array') {
    const arr = [];
    for (let i = 0; i < 1e6; i++) {
      arr.push(i);
    }
  } else if (operation === 'object') {
    const obj = {};
    for (let i = 0; i < 1e6; i++) {
      obj[i] = i;
    }
  } else if (operation === 'json') {
    const data = JSON.stringify(new Array(1e5).fill({ id: 1, name: 'test' }));
    JSON.parse(data);
  }

  const end = process.hrtime.bigint();
  const durationNs = end - start;
  const durationMs = Number(durationNs) / 1e6;

  res.json({
    operation,
    durationMs: durationMs.toFixed(2),
    note: 'High-resolution timing'
  });
});

// Route: V8 command line flags
app.get('/api/v8/cli-flags', (req, res) => {
  res.json({
    profiling: [
      '--prof: CPU profiling',
      '--inspect: Debugger',
      '--track-heap-objects: Heap tracking',
      '--expose-gc: Force garbage collection',
      '--trace-gc: Log GC events'
    ],
    optimization: [
      '--max-old-space-size=X: Set max heap',
      '--max-semi-space-size=X: Scavenge area',
      '--opt: Force optimization',
      '--no-opt: Disable optimization'
    ],
    examples: {
      profile: 'node --prof app.js',
      debug: 'node --inspect app.js',
      heap: 'node --track-heap-objects app.js',
      gc: 'node --expose-gc app.js',
      memory: 'node --max-old-space-size=2048 app.js'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 V8 & GC server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  GET /api/v8/heap-stats - Heap statistics');
  console.log('  POST /api/v8/heap-snapshot - Take snapshot');
  console.log('  POST /api/v8/gc-demo - GC demonstration');
  console.log('  GET /api/v8/gc-types - GC types');
  console.log('  GET /api/v8/optimization - Optimization');
  console.log('  POST /api/v8/potential-leaks - Leak patterns');
  console.log('  GET /api/v8/profiling - Profiling');
  console.log('  GET /api/v8/codegen-tips - Code generation');
  console.log('  POST /api/v8/memory-profile - Memory profiling');
  console.log('  POST /api/v8/performance-measure - Perf measure');
  console.log('  GET /api/v8/cli-flags - CLI flags');
});

module.exports = app;
