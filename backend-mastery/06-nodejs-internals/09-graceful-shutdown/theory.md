# Graceful Shutdown Theory

## Why Graceful Shutdown?

### Hard Shutdown (Bad)
```
Process killed immediately
├─ Database transaction: Rolled back
├─ File operation: Incomplete write
├─ HTTP connection: Abrupt close
├─ User: "Connection lost"
└─ Data corruption: Possible
```

### Graceful Shutdown (Good)
```
Process notified to shut down
├─ Stop accepting new requests
├─ Wait for in-flight requests
├─ Complete current operations
├─ Close connections cleanly
├─ Persist any cache/state
└─ Exit cleanly
```

## Shutdown Signals

### SIGTERM
```
Graceful termination request
Most common, deployments send this
Process CAN ignore (but shouldn't)
```

### SIGKILL
```
Forceful kill
Process CANNOT ignore
Last resort (process doesn't respond to SIGTERM)
```

### SIGHUP
```
Terminal disconnected
Historically meant reload config
```

## Implementing Graceful Shutdown

### Basic Pattern
```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Hello');
});

server.listen(3000);

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force exit after timeout
  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 5000);
});
```

## Cleanup Tasks

### 1. Stop Accepting Connections
```javascript
server.close(); // No more new connections
// Existing connections stay open

// But don't accept new ones
// Load balancer stops routing
```

### 2. Wait for Current Requests
```javascript
server.close((err) => {
  if (err) {
    console.error('Errors:', err);
    process.exit(1);
  }
  console.log('All connections closed');
  process.exit(0);
});
```

### 3. Close Database Connections
```javascript
process.on('SIGTERM', async () => {
  await db.close();
  process.exit(0);
});
```

### 4. Flush Buffers
```javascript
process.on('SIGTERM', async () => {
  await cache.flush();
  await logger.flush();
  process.exit(0);
});
```

## Timeout Pattern

### Force Exit if Takes Too Long
```javascript
process.on('SIGTERM', async () => {
  console.log('Starting graceful shutdown...');
  
  const timeout = setTimeout(() => {
    console.error('Shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000); // 10 second timeout
  
  try {
    await closeConnections();
    clearTimeout(timeout);
    process.exit(0);
  } catch (err) {
    console.error('Shutdown error:', err);
    process.exit(1);
  }
});
```

## Example: Express Server

```javascript
const express = require('express');
const app = express();

const server = app.listen(3000);

// Track active sockets
const activeRequests = new Set();

app.use((req, res, next) => {
  activeRequests.add(req);
  res.on('finish', () => activeRequests.delete(req));
  next();
});

let isShuttingDown = false;

app.get('/', (req, res) => {
  if (isShuttingDown) {
    res.status(503).send('Server shutting down');
    return;
  }
  res.send('Hello');
});

process.on('SIGTERM', async () => {
  isShuttingDown = true;
  
  // Stop accepting new connections
  server.close(async () => {
    // Close connections
    await db.close();
    process.exit(0);
  });
  
  // Wait 30s, then force exit
  setTimeout(() => {
    console.error('Shutdown timeout');
    process.exit(1);
  }, 30000);
});
```

## Testing Graceful Shutdown

### Manual Test
```bash
# Start server
node app.js

# In another terminal
kill -SIGTERM <pid>

# Observe: Connections closed gracefully, no errors
```

### Load Test
```bash
# Start server
node app.js

# Simulate load
ab -n 1000 -c 100 http://localhost:3000/

# While requests running, send SIGTERM
kill -SIGTERM <pid>

# Should complete all requests before exiting
```

## Docker Considerations

### Stop Signal
```dockerfile
# In Dockerfile
STOPSIGNAL SIGTERM

# Docker sends SIGTERM when container stops
# Your app has 10 seconds to gracefully shutdown
# Then Docker sends SIGKILL
```

### Handling Both
```javascript
let stopping = false;

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown); // Ctrl+C

async function shutdown() {
  if (stopping) return;
  stopping = true;
  
  // Cleanup
  process.exit(0);
}
```

## PM2 / Supervisor Integration

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'app',
    script: './app.js',
    max_memory_restart: '500M',
    kill_timeout: 5000, // 5 seconds to shutdown
  }]
};
```

## Best Practices

✅ Handle SIGTERM and SIGINT
✅ Stop accepting new requests first
✅ Close DB connections
✅ Flush buffers/logs
✅ Set timeout for forced exit
✅ Test graceful shutdown
✅ Document shutdown behavior
✅ Monitor shutdown logs
✅ Use health checks
✅ Drain request queues
