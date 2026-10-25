/**
 * Graceful Shutdown Controller
 * Demonstrates graceful server shutdown patterns
 */

// Track active requests
let activeRequests = 0;
let isShuttingDown = false;
const gracefulTasks = [];

// ============================================
// Request Counter Middleware Endpoint
// ============================================

exports.getStatus = (req, res) => {
  const results = {
    operation: 'server_status',
    isShuttingDown,
    activeRequests,
    gracefulTasks: gracefulTasks.length,
    timestamp: new Date().toISOString(),
  };

  res.json(results);
};

// ============================================
// Slow Operation Endpoint
// ============================================

exports.slowOperation = (req, res) => {
  const duration = parseInt(req.query.duration) || 5000;
  activeRequests++;

  const results = {
    operation: 'slow_operation',
    duration,
    startTime: new Date().toISOString(),
  };

  console.log(`\n=== SLOW OPERATION: ${duration}ms ===`);

  // If shutting down, return immediately
  if (isShuttingDown) {
    res.status(503).json({
      error: 'Server is shutting down',
      message: 'Cannot accept new requests',
    });
    activeRequests--;
    return;
  }

  setTimeout(() => {
    results.endTime = new Date().toISOString();
    results.status = 'completed';
    res.json(results);
    activeRequests--;
  }, duration);
};

// ============================================
// Database Connection Simulation
// ============================================

class MockDatabase {
  constructor() {
    this.connected = true;
    this.queries = 0;
  }

  async query() {
    if (!this.connected) {
      throw new Error('Database disconnected');
    }
    this.queries++;
    return new Promise((resolve) => setTimeout(resolve, 50));
  }

  async disconnect() {
    console.log('Disconnecting from database...');
    this.connected = false;
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('Database disconnected');
  }
}

const db = new MockDatabase();

exports.databaseOperation = async (req, res) => {
  activeRequests++;

  const results = {
    operation: 'database_query',
  };

  console.log(`\n=== DATABASE OPERATION ===`);

  if (isShuttingDown) {
    res.status(503).json({
      error: 'Server shutting down',
    });
    activeRequests--;
    return;
  }

  try {
    await db.query();
    results.status = 'success';
    results.totalQueries = db.queries;
    res.json(results);
  } catch (err) {
    results.error = err.message;
    res.status(500).json(results);
  } finally {
    activeRequests--;
  }
};

// ============================================
// Graceful Shutdown Handler
// ============================================

exports.initiateGracefulShutdown = (req, res) => {
  const gracePeriod = parseInt(req.query.gracePeriod) || 10000;

  const results = {
    operation: 'graceful_shutdown',
    gracePeriod,
    status: 'initiated',
    steps: [],
  };

  console.log(`\n=== GRACEFUL SHUTDOWN INITIATED (${gracePeriod}ms) ===`);

  isShuttingDown = true;
  results.steps.push('Marked server as shutting down');
  results.steps.push(`Grace period: ${gracePeriod}ms`);

  // Stop accepting new requests
  results.steps.push('Stopped accepting new requests');

  // Cancel graceful tasks
  gracefulTasks.length = 0;
  results.steps.push('Cancelled pending graceful tasks');

  // Close database
  db.disconnect().then(() => {
    results.steps.push('Database closed');
  });

  results.steps.push(`Waiting for ${activeRequests} active requests to complete...`);

  // Wait for active requests
  const startWait = Date.now();
  const waitInterval = setInterval(() => {
    if (activeRequests === 0) {
      clearInterval(waitInterval);
      results.steps.push('All active requests completed');
      results.steps.push('Server ready to shut down');
      results.shutdownTime = Date.now() - startWait;
      res.json(results);
    } else if (Date.now() - startWait > gracePeriod) {
      clearInterval(waitInterval);
      results.steps.push(`Force shutdown after ${gracePeriod}ms`);
      results.forceShutdown = true;
      results.shutdownTime = Date.now() - startWait;
      res.json(results);
    }
  }, 100);
};

// ============================================
// Graceful Task Registration
// ============================================

exports.registerGracefulTask = (req, res) => {
  const { taskName = 'task_' + Date.now() } = req.query;

  const taskId = Date.now();
  const results = {
    operation: 'register_graceful_task',
    taskId,
    taskName,
  };

  console.log(`\n=== REGISTER GRACEFUL TASK: ${taskName} ===`);

  gracefulTasks.push({
    id: taskId,
    name: taskName,
    registered: new Date(),
  });

  results.status = 'registered';
  results.totalTasks = gracefulTasks.length;

  res.json(results);
};

// ============================================
// Health Check
// ============================================

exports.healthCheck = (req, res) => {
  const results = {
    operation: 'health_check',
    status: isShuttingDown ? 'shutting_down' : 'healthy',
    activeRequests,
    database: {
      connected: db.connected,
      totalQueries: db.queries,
    },
    timestamp: new Date().toISOString(),
  };

  res.json(results);
};

// ============================================
// Force Shutdown
// ============================================

exports.forceShutdown = (req, res) => {
  const results = {
    operation: 'force_shutdown',
    status: 'initiated',
    activeRequests,
  };

  console.log('\n=== FORCE SHUTDOWN ===');

  res.json(results);

  setTimeout(() => {
    console.log('Server force shutdown');
    process.exit(1);
  }, 100);
};
