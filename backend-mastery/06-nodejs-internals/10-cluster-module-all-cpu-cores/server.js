const express = require('express');
const cluster = require('cluster');
const os = require('os');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3010;
const numCPUs = os.cpus().length;

// Module 10: Cluster Module

// Route: Worker info
app.get('/api/cluster/info', (req, res) => {
  res.json({
    isMaster: cluster.isMaster,
    isWorker: cluster.isWorker,
    workerId: cluster.worker?.id,
    pid: process.pid,
    numCPUs,
    mode: cluster.isMaster ? 'Master' : `Worker ${cluster.worker.id}`
  });
});

// Route: Load distribution
app.get('/api/cluster/load', (req, res) => {
  res.json({
    pid: process.pid,
    workerId: cluster.worker?.id,
    timestamp: new Date().toISOString(),
    message: 'Request handled by this worker'
  });
});

// Route: Cluster stats
app.get('/api/cluster/workers', (req, res) => {
  if (cluster.isMaster) {
    const workers = Object.values(cluster.workers || {}).map(w => ({
      id: w.id,
      pid: w.process.pid,
      state: w.state
    }));

    res.json({
      masterId: process.pid,
      workers,
      totalWorkers: workers.length,
      requestLoad: 'Distributed via load balancer'
    });
  } else {
    res.json({ error: 'Only available from master' });
  }
});

// Route: Trigger worker restart
app.post('/api/cluster/restart-worker', (req, res) => {
  if (cluster.isMaster) {
    const { workerId } = req.body;
    const worker = cluster.workers[workerId];

    if (worker) {
      worker.kill();
      res.json({ message: `Worker ${workerId} killed, will be respawned` });
    } else {
      res.json({ error: 'Worker not found' });
    }
  } else {
    res.json({ error: 'Only available from master' });
  }
});

// Route: Cluster configuration
app.get('/api/cluster/config', (req, res) => {
  res.json({
    strategy: cluster.SCHED_RR,
    strategies: {
      SCHED_RRMMS: 'Round-robin (default)',
      SCHED_NONE: 'Load balancer handles it'
    },
    numWorkers: numCPUs,
    workerProcesses: Array(numCPUs).fill(0).map((_, i) => `Worker-${i + 1}`),
    memoryPerWorker: `~${(require('os').totalmem() / numCPUs / 1024 / 1024 / 1024).toFixed(1)} GB`
  });
});

// Master process setup
if (cluster.isMaster && process.env.START_CLUSTER === 'true') {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} exited`);
    // Respawn
    cluster.fork();
  });

  // Master doesn't handle requests in cluster mode with multiple workers
  const server = require('http').createServer(app);
  server.listen(PORT, () => {
    console.log(`Master listening on port ${PORT}`);
  });
} else {
  // Worker process
  const server = require('http').createServer(app);
  server.listen(PORT, () => {
    if (cluster.isWorker) {
      console.log(`Worker ${cluster.worker.id} (PID ${process.pid}) listening on port ${PORT}`);
    } else {
      console.log(`Single process listening on port ${PORT}`);
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  if (cluster.isMaster) {
    Object.values(cluster.workers).forEach(w => w.kill());
    process.exit(0);
  } else {
    process.exit(0);
  }
});

// Route: Comparison guide
app.get('/api/cluster/guide', (req, res) => {
  res.json({
    singleProcess: {
      pros: ['Simple', 'Easy debugging', 'Shared memory'],
      cons: ['Only one CPU used', 'If crashes, all to fails']
    },
    clustering: {
      pros: ['Uses all CPUs', 'Auto restart', 'Zero downtime deploys'],
      cons: ['More complex', 'Shared memory limited', 'Process management']
    },
    alternatives: {
      nginx: 'Reverse proxy for load balancing',
      pm2: 'Process manager with clustering',
      docker: 'Container orchestration',
      kubernetes: 'Full cluster management'
    },
    bestPractices: [
      'Use PM2 for production clustering',
      'Handle worker exit events',
      'Implement health checks',
      'Use sticky sessions if needed',
      'Monitor memory per worker',
      'Implement graceful reload'
    ]
  });
});

module.exports = app;
