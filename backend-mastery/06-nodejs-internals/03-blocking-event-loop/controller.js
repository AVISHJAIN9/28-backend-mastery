/**
 * Blocking Event Loop Controller
 * Demonstrates how blocking operations stall the event loop
 */

const eventLoopMetrics = {
  blockingOperations: 0,
  processedRequests: 0,
  eventLoopBlockTime: 0,
};

// ============================================
// CPU-Intensive Blocking Operation
// ============================================

exports.demonstrateBlocking = (req, res) => {
  const iterations = parseInt(req.query.iterations) || 1000000000;
  const startTime = Date.now();
  const startHRTime = process.hrtime.bigint();

  console.log(`\n=== BLOCKING OPERATION: ${iterations} iterations ===`);

  // CPU-intensive loop - BLOCKS the event loop
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    sum += Math.sqrt(i) * Math.PI;
  }

  const endTime = Date.now();
  const endHRTime = process.hrtime.bigint();
  const blockTime = endTime - startTime;
  const blockTimeNs = endHRTime - startHRTime;

  eventLoopMetrics.blockingOperations++;
  eventLoopMetrics.eventLoopBlockTime += blockTime;

  res.json({
    operation: 'blocking_cpu_intensive',
    iterations,
    result: sum,
    blockTimeMs: blockTime,
    blockTimeNs: blockTimeNs.toString(),
    warning: 'During this time, NO other requests or timers can execute!',
  });
};

// ============================================
// Non-Blocking with setImmediate
// ============================================

exports.demonstrateNonBlockingImmediate = (req, res) => {
  const iterations = parseInt(req.query.iterations) || 1000000000;
  const chunkSize = parseInt(req.query.chunkSize) || 100000000;
  const startTime = Date.now();
  const results = {
    operation: 'non_blocking_setImmediate',
    iterations,
    chunkSize,
    chunks: 0,
    executionLog: [],
  };

  console.log(`\n=== NON-BLOCKING WITH setImmediate ===`);

  let sum = 0;
  let currentIndex = 0;

  results.executionLog.push('Start processing');

  const processChunk = () => {
    const endIndex = Math.min(currentIndex + chunkSize, iterations);

    for (let i = currentIndex; i < endIndex; i++) {
      sum += Math.sqrt(i) * Math.PI;
    }

    results.chunks++;
    currentIndex = endIndex;

    if (currentIndex < iterations) {
      // Defer next chunk to allow other operations
      setImmediate(processChunk);
    } else {
      const blockTime = Date.now() - startTime;
      results.totalTimeMs = blockTime;
      results.result = sum;
      results.executionLog.push(`Completed ${results.chunks} chunks`);

      res.json(results);
    }
  };

  processChunk();
};

// ============================================
// Non-Blocking with setTimeout
// ============================================

exports.demonstrateNonBlockingTimeout = (req, res) => {
  const iterations = parseInt(req.query.iterations) || 1000000000;
  const chunkSize = parseInt(req.query.chunkSize) || 100000000;
  const delay = parseInt(req.query.delay) || 0;
  const startTime = Date.now();
  const results = {
    operation: 'non_blocking_setTimeout',
    iterations,
    chunkSize,
    delay,
    chunks: 0,
    executionLog: [],
  };

  console.log(`\n=== NON-BLOCKING WITH setTimeout ===`);

  let sum = 0;
  let currentIndex = 0;

  results.executionLog.push('Start processing');

  const processChunk = () => {
    const endIndex = Math.min(currentIndex + chunkSize, iterations);

    for (let i = currentIndex; i < endIndex; i++) {
      sum += Math.sqrt(i) * Math.PI;
    }

    results.chunks++;
    currentIndex = endIndex;

    if (currentIndex < iterations) {
      setTimeout(processChunk, delay);
    } else {
      const blockTime = Date.now() - startTime;
      results.totalTimeMs = blockTime;
      results.result = sum;
      results.executionLog.push(`Completed ${results.chunks} chunks with ${delay}ms delay`);

      res.json(results);
    }
  };

  processChunk();
};

// ============================================
// Non-Blocking with Promise.resolve
// ============================================

exports.demonstrateNonBlockingPromise = async (req, res) => {
  const iterations = parseInt(req.query.iterations) || 1000000000;
  const chunkSize = parseInt(req.query.chunkSize) || 100000000;
  const startTime = Date.now();
  const results = {
    operation: 'non_blocking_promises',
    iterations,
    chunkSize,
    chunks: 0,
  };

  console.log(`\n=== NON-BLOCKING WITH PROMISES ===`);

  let sum = 0;
  let currentIndex = 0;

  const processChunk = () => {
    return new Promise((resolve) => {
      const endIndex = Math.min(currentIndex + chunkSize, iterations);

      for (let i = currentIndex; i < endIndex; i++) {
        sum += Math.sqrt(i) * Math.PI;
      }

      results.chunks++;
      currentIndex = endIndex;

      if (currentIndex < iterations) {
        // Yield control via microtask
        Promise.resolve().then(processChunk).then(resolve);
      } else {
        resolve();
      }
    });
  };

  await processChunk();

  results.totalTimeMs = Date.now() - startTime;
  results.result = sum;

  res.json(results);
};

// ============================================
// Event Loop Responsiveness Test
// ============================================

exports.testEventLoopResponsiveness = (req, res) => {
  const testDuration = parseInt(req.query.duration) || 5000;
  const results = {
    operation: 'event_loop_responsiveness',
    testDurationMs: testDuration,
    measurements: [],
  };

  console.log(`\n=== EVENT LOOP RESPONSIVENESS TEST: ${testDuration}ms ===`);

  const startTime = Date.now();
  let lastCheck = Date.now();

  const measure = () => {
    const now = Date.now();
    const elapsed = now - lastCheck;

    results.measurements.push({
      timestamp: now - startTime,
      lagMs: elapsed,
      status: elapsed < 10 ? 'healthy' : elapsed < 50 ? 'acceptable' : 'degraded',
    });

    lastCheck = now;

    if (now - startTime < testDuration) {
      setImmediate(measure);
    } else {
      const avgLag =
        results.measurements.reduce((sum, m) => sum + m.lagMs, 0) / results.measurements.length;
      const maxLag = Math.max(...results.measurements.map((m) => m.lagMs));

      results.statistics = {
        measurementCount: results.measurements.length,
        averageLagMs: avgLag.toFixed(2),
        maxLagMs: maxLag,
        isHealthy: avgLag < 50,
      };

      res.json(results);
    }
  };

  measure();
};

// ============================================
// Comparison: Blocking vs Non-Blocking
// ============================================

exports.compareBlockingVsNonBlocking = async (req, res) => {
  const iterations = 100000000;
  const results = {
    operation: 'comparison_blocking_vs_nonblocking',
    iterations,
    comparison: {},
  };

  console.log(`\n=== COMPARISON: Blocking vs Non-Blocking ===`);

  // Blocking approach
  const blockStart = process.hrtime.bigint();
  let sum1 = 0;
  for (let i = 0; i < iterations; i++) {
    sum1 += Math.sqrt(i);
  }
  const blockEnd = process.hrtime.bigint();

  results.comparison.blocking = {
    timeMs: ((blockEnd - blockStart) / 1000000n).toString(),
    result: sum1,
  };

  // Non-blocking approach via chunks
  const nonBlockStart = process.hrtime.bigint();
  let sum2 = 0;
  const chunkSize = 10000000;

  for (let start = 0; start < iterations; start += chunkSize) {
    const end = Math.min(start + chunkSize, iterations);
    for (let i = start; i < end; i++) {
      sum2 += Math.sqrt(i);
    }
    // In real scenario, this would be async
    await Promise.resolve();
  }

  const nonBlockEnd = process.hrtime.bigint();

  results.comparison.nonBlocking = {
    timeMs: ((nonBlockEnd - nonBlockStart) / 1000000n).toString(),
    result: sum2,
  };

  results.explanation = 'Non-blocking may take longer but allows event loop to handle other requests';

  res.json(results);
};

// ============================================
// Metrics Endpoint
// ============================================

exports.getMetrics = (req, res) => {
  res.json({
    operation: 'metrics',
    eventLoopMetrics,
    timestamp: new Date().toISOString(),
  });
};
