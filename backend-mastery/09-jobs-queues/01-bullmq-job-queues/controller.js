/**
 * BullMQ Job Queue Controller
 * Demonstrates job queue operations and queue management
 */

const { Queue, Worker } = require('bullmq');
const redis = require('redis');

// Redis connection
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

// Initialize queues
const emailQueue = new Queue('emails', { connection });
const reportQueue = new Queue('reports', { connection });
const importQueue = new Queue('imports', { connection });

// ============================================
// Job Addition (Producer)
// ============================================

exports.addEmailJob = async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    const job = await emailQueue.add(
      { to, subject, body, timestamp: new Date() },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true
      }
    );

    res.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Email job added to queue'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addReportJob = async (req, res) => {
  try {
    const { userId, reportType, format } = req.body;

    const job = await reportQueue.add(
      { userId, reportType, format, createdAt: new Date() },
      {
        priority: req.body.priority || 5,
        timeout: 30000,
        removeOnComplete: false
      }
    );

    res.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Report generation job queued'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addBulkJobs = async (req, res) => {
  try {
    const { items, queueName } = req.body;
    const queue = new Queue(queueName || 'batch', { connection });

    const jobs = await Promise.all(
      items.map((item) =>
        queue.add(item, {
          attempts: 2,
          backoff: { type: 'fixed', delay: 1000 }
        })
      )
    );

    res.json({
      success: true,
      jobsAdded: jobs.length,
      jobIds: jobs.map((j) => j.id)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// Job Monitoring
// ============================================

exports.getJobStatus = async (req, res) => {
  try {
    const { jobId, queueName } = req.params;
    const queue = new Queue(queueName, { connection });

    const job = await queue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job._progress;

    res.json({
      jobId: job.id,
      state,
      progress,
      data: job.data,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQueueStats = async (req, res) => {
  try {
    const { queueName } = req.params;
    const queue = new Queue(queueName, { connection });

    const counts = await queue.getJobCounts(
      'wait',
      'active',
      'completed',
      'failed',
      'delayed'
    );

    const paused = await queue.isPaused();

    res.json({
      queue: queueName,
      stats: counts,
      paused,
      workersCount: (await queue.getWorkers()).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQueueJobs = async (req, res) => {
  try {
    const { queueName, status } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    const queue = new Queue(queueName, { connection });

    let jobs = [];
    if (status === 'wait') {
      jobs = await queue.getWaiting(offset, offset + limit - 1);
    } else if (status === 'active') {
      jobs = await queue.getActive(offset, offset + limit - 1);
    } else if (status === 'completed') {
      jobs = await queue.getCompleted(offset, offset + limit - 1);
    } else if (status === 'failed') {
      jobs = await queue.getFailed(offset, offset + limit - 1);
    }

    res.json({
      queue: queueName,
      status,
      jobs: jobs.map((j) => ({
        id: j.id,
        data: j.data,
        state: j._state,
        progress: j._progress
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// Job Control
// ============================================

exports.retryJob = async (req, res) => {
  try {
    const { jobId, queueName } = req.params;
    const queue = new Queue(queueName, { connection });

    const job = await queue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.retry();

    res.json({
      success: true,
      message: `Job ${jobId} retried`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeJob = async (req, res) => {
  try {
    const { jobId, queueName } = req.params;
    const queue = new Queue(queueName, { connection });

    const job = await queue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.remove();

    res.json({
      success: true,
      message: `Job ${jobId} removed`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.clearQueue = async (req, res) => {
  try {
    const { queueName } = req.params;
    const queue = new Queue(queueName, { connection });

    await queue.clean(0, 'wait');
    await queue.clean(0, 'active');
    await queue.clean(0, 'failed');

    res.json({
      success: true,
      message: `Queue ${queueName} cleared`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// Workers (Consumers)
// ============================================

// Email worker
const emailWorker = new Worker(
  'emails',
  async (job) => {
    console.log(`Processing email job ${job.id}: to=${job.data.to}`);

    // Simulate email sending with progress
    await job.progress(25);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await job.progress(50);
    console.log(`Sending email to ${job.data.to}`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    await job.progress(75);
    const result = {
      messageId: `msg-${job.id}`,
      to: job.data.to,
      sentAt: new Date(),
      status: 'sent'
    };

    await job.progress(100);
    return result;
  },
  { connection, concurrency: 2 }
);

emailWorker.on('completed', (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Email job ${job.id} failed:`, err.message);
});

// Report worker
const reportWorker = new Worker(
  'reports',
  async (job) => {
    console.log(`Generating report ${job.id}: type=${job.data.reportType}`);

    await job.progress(0);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await job.progress(50);
    const report = {
      reportId: `report-${job.id}`,
      type: job.data.reportType,
      format: job.data.format,
      userId: job.data.userId,
      generatedAt: new Date(),
      pages: 42
    };

    await job.progress(100);
    return report;
  },
  { connection, concurrency: 1 }
);

reportWorker.on('completed', (job) => {
  console.log(`✅ Report job ${job.id} completed`);
});

reportWorker.on('failed', (job, err) => {
  console.error(`❌ Report job ${job.id} failed:`, err.message);
});

// ============================================
// Health Check
// ============================================

exports.getWorkerStatus = async (req, res) => {
  try {
    const { queueName } = req.params;
    const queue = new Queue(queueName, { connection });

    const workers = await queue.getWorkers();
    const counts = await queue.getJobCounts();

    res.json({
      queue: queueName,
      workers: workers.length,
      jobCounts: counts,
      workersReady: workers.length > 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.emailQueue = emailQueue;
module.exports.reportQueue = reportQueue;
module.exports.importQueue = importQueue;

