const express = require('express');
const http = require('http');

const app = express();
app.use(express.json());

let PORT = process.env.PORT || 3009;
let activeConnections = new Set();
let requestsInProgress = 0;
let isShuttingDown = false;

// Module 9: Graceful Shutdown

// Track all connections
app.use((req, res, next) => {
  activeConnections.add(res);
  requestsInProgress++;

  res.on('finish', () => {
    activeConnections.delete(res);
    requestsInProgress--;
  });

  res.on('close', () => {
    activeConnections.delete(res);
    requestsInProgress--;
  });

  next();
});

// Route: Long-running operation
app.post('/api/graceful/long-operation', (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ error: 'Server shutting down' });
  }

  let { duration = 10000 } = req.body;
  let start = Date.now();

  const checkComplete = setInterval(() => {
    if (Date.now() - start >= duration) {
      clearInterval(checkComplete);
      res.json({
        completed: true,
        duration: Date.now() - start,
        message: 'Long operation completed'
      });
    }
  }, 100);

  // Allow interruption on shutdown
  res.on('close', () => {
    clearInterval(checkComplete);
  });
});

// Route: Status
app.get('/api/graceful/status', (req, res) => {
  res.json({
    shutting_down: isShuttingDown,
    active_connections: activeConnections.size,
    requests_in_progress: requestsInProgress,
    uptime: process.uptime()
  });
});

// Route: Trigger graceful shutdown
app.post('/api/graceful/shutdown', (req, res) => {
  // Respond before shutdown
  res.json({
    message: 'Graceful shutdown initiated',
    activeConnections: activeConnections.size
  });

  // Schedule shutdown
  setTimeout(() => {
    performGracefulShutdown();
  }, 1000);
});

// HTTP server instance needed for closing connections
const server = http.createServer(app);

function performGracefulShutdown() {
  console.log('Starting graceful shutdown...');
  isShuttingDown = true;

  // Phase 1: Stop accepting new connections
  server.close(() => {
    console.log('Server closed, no more connections accepted');
  });

  // Phase 2: Wait for existing connections
  let secondsWaited = 0;
  const checkInterval = setInterval(() => {
    secondsWaited++;
    console.log(`Waiting for ${activeConnections.size} connections... (${secondsWaited}s)`);

    if (activeConnections.size === 0 || secondsWaited > 10) {
      clearInterval(checkInterval);
      
      // Destroy remaining connections
      activeConnections.forEach(res => {
        res.destroy();
      });

      console.log('Shutdown complete');
      process.exit(0);
    }
  }, 1000);
}

// Handle signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, starting graceful shutdown');
  performGracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, starting graceful shutdown');
  performGracefulShutdown();
});

// Route: Shutdown best practices
app.get('/api/graceful/best-practices', (req, res) => {
  res.json({
    practices: [
      'Listen for SIGTERM and SIGINT signals',
      'Stop accepting new requests',
      'Wait for existing requests to complete',
      'Close database connections gracefully',
      'Close file handles',
      'Set a timeout (10-30s) before force kill',
      'Use health check endpoints',
      'Clean up resources (timers, caches)'
    ],
    timeline: {
      'T+0s': 'Receive shutdown signal',
      'T+1s': 'Close server, stop accepting connections',
      'T+2-10s': 'Wait for existing requests',
      'T+10s': 'Force close remaining connections',
      'T+10s+': 'Exit process'
    },
    testingTip: 'Use SIGTERM: kill -TERM <pid>'
  });
});

// Route: Health check endpoint for load balancers
app.get('/api/graceful/health', (req, res) => {
  if (isShuttingDown) {
    res.status(503).send('Service Unavailable');
  } else {
    res.json({ status: 'healthy' });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Graceful Shutdown server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  POST /api/graceful/long-operation - Start long operation');
  console.log('  GET /api/graceful/status - Current status');
  console.log('  POST /api/graceful/shutdown - Trigger shutdown');
  console.log('  GET /api/graceful/best-practices - Best practices');
  console.log('  GET /api/graceful/health - Health check');
});

module.exports = server;
