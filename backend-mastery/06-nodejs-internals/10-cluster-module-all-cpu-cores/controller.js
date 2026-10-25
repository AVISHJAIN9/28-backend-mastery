/**
 * Cluster Module Controller
 * Demonstrates clustering and multi-core utilization
 */

const os = require('os');
const cluster = require('cluster');

// Track cluster metrics
let requestsHandled = 0;
let tasksCompleted = 0;

// ============================================
// Cluster Information
// ============================================

exports.getClusterInfo = (req, res) => {
  const results = {
    operation: 'cluster_info',
    isMaster: cluster.isPrimary,
    isWorker: cluster.isWorker,
    workerId: cluster.worker?.id,
    cpuCores: os.cpus().length,
  };

  if (cluster.isPrimary) {
    results.workers = Object.values(cluster.workers)
      .map((w) => ({
        id: w.id,
        pid: w.process.pid,
        state: w.state,
      }))
      .filter(Boolean);
  } else {
    results.assignedTo = `Worker ${cluster.worker.id}`;
  }

  res.json(results);
};

// ============================================
// Load Distribution Simulation
// ============================================

exports.handleLoadDistribution = (req, res) => {
  requestsHandled++;

  const results = {
    operation: 'load_distribution',
    workerId: cluster.worker?.id || 'master',
    requestNumber: requestsHandled,
    pid: process.pid,
    timestamp: new Date().toISOString(),
  };

  // Simulate request processing
  setTimeout(() => {
    results.status = 'completed';
    res.json(results);
  }, Math.random() * 100);
};

// ============================================
// CPU-Intensive Task Distribution
// ============================================

exports.distributeTask = (req, res) => {
  const duration = parseInt(req.query.duration) || 1000;
  tasksCompleted++;

  const results = {
    operation: 'task_distribution',
    workerId: cluster.worker?.id || 'master',
    taskNumber: tasksCompleted,
    duration,
    pid: process.pid,
  };

  console.log(`\n=== TASK ${tasksCompleted} on Worker ${results.workerId} ===`);

  const startTime = process.hrtime.bigint();

  // Simulate CPU work
  let sum = 0;
  for (let i = 0; i < duration * 1000000; i++) {
    sum += Math.sqrt(i);
  }

  const endTime = process.hrtime.bigint();

  results.workTime = ((endTime - startTime) / 1000000n).toString() + ' ms';
  results.result = sum > 0;
  results.status = 'completed';

  res.json(results);
};

// ============================================
// Cluster Statistics
// ============================================

exports.getClusterStats = (req, res) => {
  const results = {
    operation: 'cluster_stats',
    isMaster: cluster.isPrimary,
  };

  if (cluster.isPrimary) {
    const workers = Object.values(cluster.workers).filter(Boolean);
    results.stats = {
      totalWorkers: workers.length,
      cpuCores: os.cpus().length,
      workers: workers.map((w) => ({
        id: w.id,
        pid: w.process.pid,
        state: w.state,
        memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      })),
    };
  } else {
    results.stats = {
      workerId: cluster.worker.id,
      pid: process.pid,
      memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      requestsHandled,
      tasksCompleted,
    };
  }

  results.cpuInfo = os.cpus()[0]; // CPU core info

  res.json(results);
};

// ============================================
// Worker Communication
// ============================================

exports.communicateWithWorkers = (req, res) => {
  const results = {
    operation: 'worker_communication',
    isMaster: cluster.isPrimary,
  };

  console.log('\n=== WORKER COMMUNICATION ===');

  if (cluster.isPrimary) {
    const responses = [];
    let completed = 0;

    const workers = Object.values(cluster.workers).filter(Boolean);
    results.requestedWorkers = workers.length;

    workers.forEach((worker) => {
      worker.send({ cmd: 'getMetrics' });

      worker.on('message', (msg) => {
        responses.push({
          workerId: worker.id,
          metrics: msg,
        });
        completed++;

        if (completed === workers.length) {
          results.responses = responses;
          results.status = 'all_workers_responded';
          res.json(results);
        }
      });
    });
  } else {
    results.isMaster = false;
    results.workerId = cluster.worker.id;
    res.json({ error: 'Run on master process' });
  }
};

// ============================================
// Message Handler for Workers
// ============================================

exports.setupWorkerMessageHandler = () => {
  if (cluster.isWorker) {
    process.on('message', (msg) => {
      if (msg.cmd === 'getMetrics') {
        process.send({
          workerId: cluster.worker.id,
          requestsHandled,
          tasksCompleted,
          memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        });
      }
    });
  }
};
