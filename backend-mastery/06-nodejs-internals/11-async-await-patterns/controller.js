/**
 * Async/Await Patterns Controller
 * Demonstrates async/await patterns and best practices
 */

// ============================================
// Basic Async/Await Pattern
// ============================================

exports.basicAsyncPattern = async (req, res) => {
  const results = {
    operation: 'basic_async_pattern',
    steps: [],
  };

  console.log('\n=== BASIC ASYNC/AWAIT ===');

  results.steps.push('1. Function declared as async');

  // Simulated async operation
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  results.steps.push('2. Before first await');
  await delay(100);
  results.steps.push('3. After first await');
  await delay(100);
  results.steps.push('4. After second await');

  results.status = 'completed';
  res.json(results);
};

// ============================================
// Sequential Execution
// ============================================

exports.sequentialExecution = async (req, res) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const results = {
    operation: 'sequential_execution',
    operations: [],
    startTime: Date.now(),
  };

  console.log('\n=== SEQUENTIAL EXECUTION ===');

  // Each operation waits for the previous
  await delay(100);
  results.operations.push({ order: 1, time: Date.now() - results.startTime });

  await delay(100);
  results.operations.push({ order: 2, time: Date.now() - results.startTime });

  await delay(100);
  results.operations.push({ order: 3, time: Date.now() - results.startTime });

  results.totalTime = Date.now() - results.startTime;
  results.pattern = 'Sequential - ~300ms total';

  res.json(results);
};

// ============================================
// Parallel Execution with Promise.all
// ============================================

exports.parallelExecution = async (req, res) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const results = {
    operation: 'parallel_execution',
    operations: [],
    startTime: Date.now(),
  };

  console.log('\n=== PARALLEL EXECUTION WITH Promise.all ===');

  // All operations run in parallel
  const promises = [
    delay(100).then(() => ({ task: 1, delay: 100 })),
    delay(100).then(() => ({ task: 2, delay: 100 })),
    delay(100).then(() => ({ task: 3, delay: 100 })),
  ];

  results.operations = await Promise.all(promises);
  results.totalTime = Date.now() - results.startTime;
  results.pattern = 'Parallel - ~100ms total (instead of 300ms)';

  res.json(results);
};

// ============================================
// Error Handling Patterns
// ============================================

exports.errorHandling = async (req, res) => {
  const results = {
    operation: 'error_handling_patterns',
    patterns: {
      tryCatch: null,
      promiseCatch: null,
      optional: null,
    },
  };

  console.log('\n=== ERROR HANDLING PATTERNS ===');

  // Pattern 1: Try-Catch
  try {
    await new Promise((_, reject) => setTimeout(() => reject(new Error('Operation failed')), 50));
  } catch (err) {
    results.patterns.tryCatch = { error: err.message, handled: true };
  }

  // Pattern 2: Promise.catch()
  results.patterns.promiseCatch = await new Promise(async (resolve) => {
    await new Promise((_, reject) => setTimeout(() => reject(new Error('Promise failed')), 50)).catch(
      (err) => {
        resolve({ error: err.message, handled: true });
      }
    );
  });

  // Pattern 3: Optional chaining with nullish coalescing
  const optional = { data: null };
  results.patterns.optional = optional?.data ?? 'Default value';

  results.status = 'completed';
  res.json(results);
};

// ============================================
// Async Iteration
// ============================================

exports.asyncIteration = async (req, res) => {
  const count = parseInt(req.query.count) || 5;
  const results = {
    operation: 'async_iteration',
    count,
    items: [],
  };

  console.log(`\n=== ASYNC ITERATION (${count} items) ===`);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // For-of loop with async/await
  for (let i = 1; i <= count; i++) {
    await delay(50);
    results.items.push({
      index: i,
      timestamp: new Date().toISOString(),
    });
  }

  results.status = 'completed';
  results.totalTime = count * 50;

  res.json(results);
};

// ============================================
// Race Condition
// ============================================

exports.raceCondition = async (req, res) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const results = {
    operation: 'promise_race',
    competitors: [],
  };

  console.log('\n=== PROMISE.RACE ===');

  const promises = [
    delay(300).then(() => 'Task 1 (300ms)'),
    delay(100).then(() => 'Task 2 (100ms) - WINNER'),
    delay(200).then(() => 'Task 3 (200ms)'),
  ];

  const winner = await Promise.race(promises);
  results.winner = winner;
  results.explanation = 'First promise to resolve/reject wins';

  res.json(results);
};

// ============================================
// Pipeline Pattern
// ============================================

exports.pipelinePattern = async (req, res) => {
  const results = {
    operation: 'pipeline_pattern',
    stages: [],
  };

  console.log('\n=== PIPELINE PATTERN ===');

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Stage 1: Fetch data
  const data = await (async () => {
    results.stages.push('Stage 1: Fetching data');
    await delay(100);
    return { id: 1, value: 'data' };
  })();

  // Stage 2: Transform data
  const transformed = await (async () => {
    results.stages.push('Stage 2: Transforming data');
    await delay(100);
    return { ...data, transformed: true };
  })();

  // Stage 3: Validate
  const validated = await (async () => {
    results.stages.push('Stage 3: Validating');
    await delay(100);
    return { ...transformed, validated: true };
  })();

  results.finalResult = validated;
  results.status = 'completed';

  res.json(results);
};
