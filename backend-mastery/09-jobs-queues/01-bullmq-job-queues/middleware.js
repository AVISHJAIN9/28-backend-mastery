/**
 * Middleware for BullMQ Queue Management
 */

const { Queue } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

// Middleware to validate queue exists
exports.validateQueueExists = async (req, res, next) => {
  try {
    const { queueName } = req.params;
    if (!queueName) {
      return res.status(400).json({ error: 'Queue name required' });
    }

    // Try to connect to queue
    const queue = new Queue(queueName, { connection });
    const workers = await queue.getWorkers();
    req.queueWorkers = workers;

    next();
  } catch (error) {
    res.status(500).json({ error: 'Queue connection failed: ' + error.message });
  }
};

// Middleware to validate job exists
exports.validateJobExists = async (req, res, next) => {
  try {
    const { jobId, queueName } = req.params;

    if (!jobId || !queueName) {
      return res.status(400).json({ error: 'Job ID and Queue name required' });
    }

    const queue = new Queue(queueName, { connection });
    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: `Job ${jobId} not found` });
    }

    req.job = job;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Job lookup failed: ' + error.message });
  }
};

// Middleware to log queue operations
exports.logQueueOperation = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Error handling middleware
exports.handleQueueErrors = (error, req, res, next) => {
  console.error('Queue Error:', error);

  if (error.message.includes('ENOENT')) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  if (error.message.includes('ECONNREFUSED')) {
    return res.status(503).json({ error: 'Redis connection failed' });
  }

  res.status(500).json({ error: error.message });
};

