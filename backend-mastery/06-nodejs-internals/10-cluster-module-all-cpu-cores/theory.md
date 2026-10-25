# Cluster Module - Using All CPU Cores Theory

## Why Cluster?

### Single Process
```
Default Node.js: Single-threaded
Resources: Using 1 of 8 CPU cores (12.5%)
Problem: Wasting potential
```

### Cluster
```
Master process
├─ Worker 1 (Core 1)
├─ Worker 2 (Core 2)
├─ Worker 3 (Core 3)
└─ ... (matches CPU cores)

Resources: Using ~80-90% of all cores
Throughput: ~8x improvement on 8-core system
```

## Cluster Architecture

### Master: IPC Hub
```
Listens for SIGTERM
Manages workers
Restarts dead workers
Handles admin tasks
```

### Workers: Do Real Work
```
Each worker runs identical Express/Koa app
Handle HTTP requests
Serve users
Process independently
```

## Basic Implementation

```javascript
const cluster = require('cluster');
const os = require('os');
const express = require('express');

if (cluster.isMaster) {
  // Master process
  const numCPUs = os.cpus().length;
  
  console.log(`Master ${process.pid} starting ${numCPUs} workers`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.pid} died`);
    cluster.fork(); // Restart
  });
} else {
  // Worker process
  const app = express();
  
  app.get('/', (req, res) => {
    res.send(`Handled by worker ${process.pid}`);
  });
  
  app.listen(3000);
  console.log(`Worker ${process.pid} started`);
}
```

## Load Balancing

### OS Automatically Balances
```
Port 3000 listened by all workers
OS kernel distributes incoming connections
Each new connection → round-robin to workers
Efficient distribution automatically
```

### Sticky Sessions
```
Problem: HTTP request → Worker A
         Same client → Worker B
         Session lost!

Solution: Sticky sessions
- Route same client to same worker
- Based on IP or session cookie
```

## Resilience

### Dead Worker Restart
```javascript
cluster.on('exit', (worker, code, signal) => {
  if (signal) {
    console.log(`Worker killed by ${signal}`);
  } else if (code !== 0) {
    console.log(`Worker exit code ${code}`);
  }
  
  // Always restart
  if (process.uptime() < 120) {
    console.log('Restarting too soon, waiting...');
    setTimeout(() => cluster.fork(), 5000);
  } else {
    cluster.fork();
  }
});
```

### Graceful Worker Reload
```javascript
function reloadWorkers() {
  const workers = Object.values(cluster.workers);
  
  for (const worker of workers) {
    worker.disconnect();
    worker.send('shutdown');
  }
  
  setTimeout(() => {
    for (let i = 0; i < os.cpus().length; i++) {
      cluster.fork();
    }
  }, 5000);
}
```

## Communication

### Master to Worker
```javascript
// Master
worker.send({ cmd: 'reload' });

// Worker
process.on('message', (msg) => {
  if (msg.cmd === 'reload') {
    reloadConfig();
  }
});
```

### Worker to Master
```javascript
// Worker
process.send({ status: 'ready', pid: process.pid });

// Master
cluster.on('message', (worker, msg) => {
  console.log(`Worker ${worker.id} says:`, msg);
});
```

## Performance Considerations

### Throughput
```
Single worker: 1000 requests/sec
4 workers: ~3800 requests/sec (diminishing returns)
8 workers: ~6500 requests/sec
```

### Memory
```
Each worker: Node.js process
Base: ~50MB per process
With app: ~100-200MB per process

8 workers: 800MB-1600MB total
Usually acceptable trade-off
```

## Shared State Problem

### ❌ Problem
```
Worker 1: cache['key'] = 'value1'
Worker 2: cache['key'] = ??? (empty)

Each worker has own memory space
No automatic sharing
```

### ✅ Solution: Shared Cache
```javascript
// Use Redis or Memcached
const redis = require('redis');
const client = redis.createClient();

// All workers use same Redis
await client.set('key', 'value');
const value = await client.get('key'); // All get same value
```

## Horizontal Scaling vs Clustering

### Clustering
```
- One machine, multiple cores
- IPC communication
- Faster
- Shared file system
```

### Horizontal Scaling
```
- Multiple machines
- Network communication (slower)
- Geo-distributed
- Needs load balancer (nginx)
```

## Zero-Downtime Deployment

### Rolling Restart
```javascript
// Restart workers one at a time
const workers = Object.values(cluster.workers);

for (const worker of workers) {
  worker.disconnect();
  
  // New worker started
  cluster.fork();
  
  // Wait for stability
  await delay(3000);
  
  // Continue to next
}
```

## Monitoring Workers

### Track Worker Health
```javascript
setInterval(() => {
  const workers = Object.values(cluster.workers);
  
  for (const worker of workers) {
    console.log(`Worker ${worker.id}: ${worker.state}`);
  }
  
  workers.forEach(worker => {
    if (worker.state === 'disconnected') {
      console.warn(`Worker ${worker.id} disconnected, restarting`);
      cluster.fork();
    }
  });
}, 5000);
```

## Best Practices

✅ Use number of CPU cores
✅ Restart dead workers
✅ Use shared external cache (Redis)
✅ Implement graceful shutdown
✅ Monitor worker health
✅ Test under load
✅ Rolling updates for deployment
✅ Set timeout on graceful disconnect
✅ Log worker lifecycle events
✅ Track requests per worker
