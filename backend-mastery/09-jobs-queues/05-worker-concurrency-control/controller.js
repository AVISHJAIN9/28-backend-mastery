/**
 * Worker Concurrency Control Controller
 * Manages worker concurrency limits and parallel job processing
 */

const { Queue, Worker } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || 6379)
};

const highConcurrencyQueue = new Queue('high-concurrency', { connection });
const lowConcurrencyQueue = new Queue('low-concurrency', { connection });
const adaptiveQueue = new Queue('adaptive-concurrency', { connection });

/**
 * Submit job to high concurrency queue
 */
exports.submitHighConcurrencyJob = async (req, res) => {
  try {
    const { taskId, data } = req.body;

    const job = await highConcurrencyQueue.add(
      { taskId, data, timestamp: new Date() },
      { removeOnComplete: true, removeOnFail: false }
    );

    res.status(201).json({
      success: true,
      jobId: job.id,
      queue: 'high-concurrency',
      maxWorkers: 10
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Submit job to low concurrency queue
 */
exports.submitLowConcurrencyJob = async (req, res) => {
  try {
    const { taskId, data } = req.body;

    const job = await lowConcurrencyQueue.add(
      { taskId, data, timestamp: new Date() },
      { removeOnComplete: true, removeOnFail: false }
    );

    res.status(201).json({
      success: true,
      jobId: job.id,
      queue: 'low-concurrency',
      maxWorkers: 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get worker status
 */
exports.getWorkerStatus = async (req, res) => {
  try {
    const queues = [
      { name: 'high-concurrency', queue: highConcurrencyQueue },
      { name: 'low-concurrency', queue: lowConcurrencyQueue },
      { name: 'adaptive-concurrency', queue: adaptiveQueue }
    ];

    const status = {};
    for (const q of queues) {
      const counts = await q.queue.getJobCounts();
      status[q.name] = counts;
    }

    res.json({ timestamp: new Date(), workers: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get concurrency recommendations
 */
exports.getConcurrencyRecommendations = async (req, res) => {
  try {
    res.json({
      recommendations: {
        cpuBound: { concurrency: require('os').cpus().length, description: 'Number of CPU cores' },
        ioBound: { concurrency: 50, description: 'High concurrency for I/O' },
        memoryBound: { concurrency: 5, description: 'Limit to memory constraints' },
        mixed: { concurrency: 10, description: 'Balanced approach' }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get dashboard overview
 */
exports.getDashboard = async (req, res) => {
  try {
    const queues = [
      { name: 'high-concurrency', queue: highConcurrencyQueue, concurrency: 10 },
      { name: 'low-concurrency', queue: lowConcurrencyQueue, concurrency: 1 },
      { name: 'adaptive-concurrency', queue: adaptiveQueue, concurrency: 5 }
    ];

    const dashboard = {};
    for (const q of queues) {
      const counts = await q.queue.getJobCounts();
      dashboard[q.name] = { concurrency: q.concurrency, ...counts };
    }

    res.json({ timestamp: new Date(), queues: dashboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

