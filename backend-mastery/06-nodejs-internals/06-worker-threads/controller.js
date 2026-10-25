/**
 * Worker Threads Controller
 * Demonstrates CPU-intensive work in worker threads
 */

const { Worker } = require('worker_threads');
const path = require('path');

// ============================================
// Single Worker Execution
// ============================================

exports.runWorkerTask = (req, res) => {
  const { task = 'fibonacci', value = 40 } = req.query;
  const startTime = Date.now();
  const results = {
    operation: 'single_worker',
    task,
    value: parseInt(value),
  };

  console.log(`\n=== WORKER THREAD: ${task}(${value}) ===`);

  const worker = new Worker('./worker.js', { resourceLimits: { maxOldSpaceSize: 128 } });

  worker.on('message', (result) => {
    results.result = result;
    results.timeMs = Date.now() - startTime;
    results.status = 'completed';
    worker.terminate();
    res.json(results);
  });

  worker.on('error', (err) => {
    results.error = err.message;
    results.status = 'error';
    worker.terminate();
    res.status(500).json(results);
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      results.exitCode = code;
    }
  });

  worker.postMessage({ task, value: parseInt(value) });
};

// ============================================
// Worker Pool Pattern
// ============================================

class WorkerPool {
  constructor(poolSize = 4) {
    this.poolSize = poolSize;
    this.workers = [];
    this.queue = [];
    this.activeWorkers = 0;

    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker('./worker.js');
      this.workers.push(worker);
    }
  }

  async execute(task, value) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, value, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    if (this.queue.length === 0 || this.activeWorkers >= this.poolSize) {
      return;
    }

    const { task, value, resolve, reject } = this.queue.shift();
    const worker = this.workers[this.activeWorkers % this.poolSize];

    this.activeWorkers++;

    const messageHandler = (result) => {
      this.activeWorkers--;
      resolve(result);
      worker.off('message', messageHandler);
      worker.off('error', errorHandler);
      this.processQueue();
    };

    const errorHandler = (err) => {
      this.activeWorkers--;
      reject(err);
      worker.off('message', messageHandler);
      worker.off('error', errorHandler);
      this.processQueue();
    };

    worker.on('message', messageHandler);
    worker.on('error', errorHandler);
    worker.postMessage({ task, value });
  }

  terminate() {
    this.workers.forEach((worker) => worker.terminate());
  }
}

const pool = new WorkerPool(4);

exports.runWorkerPool = async (req, res) => {
  const { tasks = 5 } = req.query;
  const taskCount = parseInt(tasks);
  const results = {
    operation: 'worker_pool',
    poolSize: 4,
    taskCount,
    tasks: [],
  };

  console.log(`\n=== WORKER POOL: ${taskCount} tasks ===`);

  const startTime = Date.now();

  try {
    const taskPromises = [];
    for (let i = 0; i < taskCount; i++) {
      const task = pool.execute('fibonacci', 30 + i).then((result) => ({
        taskId: i,
        result,
        status: 'completed',
      }));
      taskPromises.push(task);
    }

    results.tasks = await Promise.all(taskPromises);
    results.totalTimeMs = Date.now() - startTime;
    results.status = 'completed';

    res.json(results);
  } catch (err) {
    results.error = err.message;
    results.status = 'error';
    res.status(500).json(results);
  }
};

// ============================================
// Comparison: Worker vs Main Thread
// ============================================

exports.compareWorkerVsMain = (req, res) => {
  const { value = 35 } = req.query;
  const num = parseInt(value);
  const results = {
    operation: 'comparison_worker_vs_main',
    value: num,
    mainThread: {},
    worker: {},
  };

  console.log(`\n=== COMPARISON: Worker vs Main Thread (fibonacci ${num}) ===`);

  // Main thread calculation
  const mainStart = process.hrtime.bigint();
  let result1 = 0;
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
  result1 = fibonacci(num);
  const mainEnd = process.hrtime.bigint();
  results.mainThread = {
    result: result1,
    timeMs: ((mainEnd - mainStart) / 1000000n).toString(),
    blockingNote: 'Event loop was blocked during execution',
  };

  // Worker thread calculation
  const worker = new Worker('./worker.js');
  const workerStart = Date.now();

  worker.on('message', (result) => {
    results.worker = {
      result,
      timeMs: Date.now() - workerStart,
      nonBlockingNote: 'Event loop was not blocked',
    };

    results.analysis = {
      timelineNote: `Main thread was faster but it blocked the event loop for ${results.mainThread.timeMs}ms`,
      recommendation: 'Use workers for long-running tasks to keep event loop responsive',
    };

    worker.terminate();
    res.json(results);
  });

  worker.postMessage({ task: 'fibonacci', value: num });
};
