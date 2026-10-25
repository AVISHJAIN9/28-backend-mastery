const express = require('express');
const { Worker } = require('worker_threads');
const path = require('path');
const os = require('os');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3006;

// Module 6: Worker Threads

// Route: Heavy computation in worker
app.post('/api/workers/compute', (req, res) => {
  const { iterations = 1e8 } = req.body;
  const numWorkers = req.body.workers || os.cpus().length;

  const startTime = Date.now();
  let completedWorkers = 0;
  let totalResult = 0;

  const workPerWorker = Math.ceil(iterations / numWorkers);

  for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker('./worker-compute.js', {
      workerData: {
        start: i * workPerWorker,
        end: Math.min((i + 1) * workPerWorker, iterations)
      }
    });

    worker.on('message', (result) => {
      totalResult += result;
      completedWorkers++;

      if (completedWorkers === numWorkers) {
        const duration = Date.now() - startTime;
        res.json({
          result: totalResult,
          workers: numWorkers,
          durationMs: duration,
          efficient: true
        });
      }
    });

    worker.on('error', () => {
      worker.terminate();
    });
  }
});

// Route: Compare main thread vs workers
app.post('/api/workers/comparison', (req, res) => {
  const { iterations = 1e8 } = req.body;

  // Main thread computation
  const mainStart = Date.now();
  let sum = 0;
  for (let i = 0; i < iterations; i++) {
    sum += Math.random();
  }
  const mainDuration = Date.now() - mainStart;

  res.json({
    mainThreadMs: mainDuration,
    recommendation: 'Use workers for CPU-heavy tasks',
    blockingNote: `Main thread was blocked for ${mainDuration}ms`,
    nonBlockingNote: 'Worker threads allow event loop to continue'
  });
});

// Route: Worker pool management
app.get('/api/workers/pool-info', (req, res) => {
  res.json({
    cpuCores: os.cpus().length,
    recommendedPoolSize: Math.max(2, os.cpus().length - 1),
    bestPractices: [
      'Create pool of reusable workers',
      'Queue tasks if more work than workers',
      'Terminate workers when done',
      'Handle errors gracefully'
    ]
  });
});

// Route: Resource sharing
app.post('/api/workers/shared-memory', (req, res) => {
  const { size = 1e6 } = req.body;

  try {
    // Create shared memory
    const sharedBuffer = new SharedArrayBuffer(size);
    const view = new Int32Array(sharedBuffer);

    res.json({
      bufferSize: size,
      sharedMemory: 'Created',
      note: 'Can be sent to workers for efficient communication'
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
      note: 'SharedArrayBuffer may be restricted by browser COOP/COEP'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Worker Threads server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  POST /api/workers/compute - Heavy computation in workers');
  console.log('  POST /api/workers/comparison - Main thread vs workers');
  console.log('  GET /api/workers/pool-info - Worker pool info');
  console.log('  POST /api/workers/shared-memory - Shared memory demo');
});

module.exports = app;
