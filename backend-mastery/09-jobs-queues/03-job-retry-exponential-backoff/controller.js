/**
 * Job Retry with Exponential Backoff Controller
 * Manages job retries with intelligent backoff strategies
 */

const { Queue, Worker } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || 6379)
};

const retryQueue = new Queue('email-with-retry', { connection });
const apiCallQueue = new Queue('api-call-with-retry', { connection });
const dataProcessingQueue = new Queue('data-processing-retry', { connection });

// Track retry attempts
const retryLog = [];

// ============================================
// Exponential Backoff Strategies
// ============================================

/**
 * Linear backoff: delay = attempt * baseDelay
 */
const linearBackoff = (attemptNumber, baseDelay = 1000) => {
  return attemptNumber * baseDelay;
};

/**
 * Exponential backoff: delay = baseDelay * (multiplier ^ attempt)
 */
const exponentialBackoff = (attemptNumber, baseDelay = 1000, multiplier = 2) => {
  return baseDelay * Math.pow(multiplier, attemptNumber - 1);
};

/**
 * Exponential backoff with jitter: adds randomness to prevent thundering herd
 */
const exponentialBackoffWithJitter = (attemptNumber, baseDelay = 1000, multiplier = 2, jitterFactor = 0.1) => {
  const exponentialDelay = baseDelay * Math.pow(multiplier, attemptNumber - 1);
  const jitter = exponentialDelay * jitterFactor * Math.random();
  return exponentialDelay + jitter;
};

/**
 * Fibonacci backoff: delay follows fibonacci sequence
 */
const fibonacciBackoff = (attemptNumber, baseDelay = 1000) => {
  const fib = [1, 1];
  for (let i = 2; i < attemptNumber; i++) {
    fib[i] = fib[i - 1] + fib[i - 2];
  }
  return (fib[attemptNumber - 1] || 1) * baseDelay;
};

// ============================================
// Job Submission with Retry Configuration
// ============================================

/**
 * Submit email job with exponential backoff retry
 */
exports.submitEmailJobWithRetry = async (req, res) => {
  try {
    const { to, subject, body, maxAttempts = 5, baseDelay = 2000 } = req.body;

    const job = await retryQueue.add(
      { to, subject, body, timestamp: new Date() },
      {
        attempts: maxAttempts,
        backoff: {
          type: 'exponential',
          delay: baseDelay
        },
        removeOnComplete: false,
        removeOnFail: false
      }
    );

    res.status(201).json({
      success: true,
      jobId: job.id,
      message: 'Email job submitted with retry enabled',
      retryConfig: {
        maxAttempts,
        baseDelay,
        strategy: 'exponential'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Submit API call job with custom backoff
 */
exports.submitApiCallWithRetry = async (req, res) => {
  try {
    const { url, method = 'GET', data, maxRetries = 3, backoffType = 'exponential' } = req.body;

    let backoffConfig = {
      type: backoffType,
      delay: 3000 // base delay in ms
    };

    if (backoffType === 'fixed') {
      backoffConfig.delay = 5000;
    }

    const job = await apiCallQueue.add(
      { url, method, data, timestamp: new Date() },
      {
        attempts: maxRetries + 1,
        backoff: backoffConfig,
        removeOnComplete: false,
        timeout: 30000 // 30 second timeout
      }
    );

    res.status(201).json({
      success: true,
      jobId: job.id,
      message: 'API call job submitted',
      retryConfig: {
        maxRetries,
        backoffType
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Submit data processing job with advanced retry
 */
exports.submitDataProcessingWithRetry = async (req, res) => {
  try {
    const { dataId, processingType, priority = 'normal' } = req.body;

    const job = await dataProcessingQueue.add(
      { dataId, processingType, timestamp: new Date() },
      {
        attempts: 7,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        priority: priority === 'high' ? 10 : 5,
        removeOnComplete: true,
        removeOnFail: false,
        failParentOnFailure: true
      }
    );

    res.status(201).json({
      success: true,
      jobId: job.id,
      message: 'Data processing job submitted',
      config: { processingType, priority }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// Job Monitoring & Status
// ============================================

/**
 * Get job details with retry history
 */
exports.getJobStatus = async (req, res) => {
  try {
    const { jobId, queueName = 'email-with-retry' } = req.params;

    const queue = queueName === 'email-with-retry' ? retryQueue : 
                  queueName === 'api-call-with-retry' ? apiCallQueue :
                  dataProcessingQueue;

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job._progress;
    const attemptsMade = job.attemptsMade;
    const logs = job.log();

    res.json({
      jobId: job.id,
      state,
      progress,
      attemptsMade,
      maxAttempts: job.opts.attempts,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      logs,
      createdAt: new Date(job.createdTimestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get retry statistics
 */
exports.getRetryStats = async (req, res) => {
  try {
    const retryStats = {
      totalRetryJobs: await retryQueue.count(),
      activeJobs: await retryQueue.getActiveCount(),
      failedJobs: await retryQueue.getFailedCount(),
      completedJobs: await retryQueue.getCompletedCount(),
      delayedJobs: await retryQueue.getDelayedCount(),
      waitingJobs: await retryQueue.getWaitingCount(),
      backoffTypes: ['exponential', 'fixed', 'linear'],
      commonReasons: extractCommonFailureReasons()
    };

    res.json(retryStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get backoff strategy recommendations
 */
exports.getBackoffStrategies = async (req, res) => {
  try {
    const strategies = {
      exponential: {
        description: 'Delay doubles with each retry',
        formula: 'delay = baseDelay * (2 ^ attempt)',
        bestFor: 'API calls, network operations',
        example: [2000, 4000, 8000, 16000, 32000]
      },
      exponentialWithJitter: {
        description: 'Exponential with random jitter',
        formula: 'delay = (baseDelay * (2 ^ attempt)) + random',
        bestFor: 'High-load systems to prevent thundering herd',
        example: [2100, 4230, 8456, 16234, 32890]
      },
      linear: {
        description: 'Delay increases linearly',
        formula: 'delay = baseDelay * attempt',
        bestFor: 'Database operations',
        example: [1000, 2000, 3000, 4000, 5000]
      },
      fibonacci: {
        description: 'Delay follows fibonacci sequence',
        formula: 'delay = baseDelay * fibonacci(attempt)',
        bestFor: 'Balanced approach',
        example: [1000, 1000, 2000, 3000, 5000]
      },
      fixed: {
        description: 'Constant delay between retries',
        formula: 'delay = constant',
        bestFor: 'Transient errors like timeouts',
        example: [5000, 5000, 5000, 5000, 5000]
      }
    };

    res.json(strategies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Manually retry a failed job
 */
exports.retryFailedJob = async (req, res) => {
  try {
    const { jobId, queueName = 'email-with-retry' } = req.params;

    const queue = queueName === 'email-with-retry' ? retryQueue :
                  queueName === 'api-call-with-retry' ? apiCallQueue :
                  dataProcessingQueue;

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await job.retry('manual');

    res.json({
      success: true,
      message: 'Job requeued for retry',
      jobId: job.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Calculate backoff delay for demonstration
 */
exports.calculateBackoff = async (req, res) => {
  try {
    const { strategy = 'exponential', attempt = 3, baseDelay = 1000 } = req.query;

    let delay;
    let delays = [];

    for (let i = 1; i <= parseInt(attempt); i++) {
      switch (strategy) {
        case 'exponential':
          delay = exponentialBackoff(i, parseInt(baseDelay));
          break;
        case 'exponentialWithJitter':
          delay = Math.round(exponentialBackoffWithJitter(i, parseInt(baseDelay)));
          break;
        case 'linear':
          delay = linearBackoff(i, parseInt(baseDelay));
          break;
        case 'fibonacci':
          delay = fibonacciBackoff(i, parseInt(baseDelay));
          break;
        case 'fixed':
          delay = parseInt(baseDelay);
          break;
        default:
          delay = exponentialBackoff(i, parseInt(baseDelay));
      }
      delays.push({ attempt: i, delayMs: delay, delaySeconds: (delay / 1000).toFixed(2) });
    }

    const totalDelay = delays.reduce((sum, d) => sum + d.delayMs, 0);

    res.json({
      strategy,
      baseDelay: parseInt(baseDelay),
      totalAttempts: parseInt(attempt),
      delays,
      totalDelayMs: totalDelay,
      totalDelaySeconds: (totalDelay / 1000).toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get retry dashboard data
 */
exports.getRetryDashboard = async (req, res) => {
  try {
    const queues = [
      { name: 'email-with-retry', queue: retryQueue },
      { name: 'api-call-with-retry', queue: apiCallQueue },
      { name: 'data-processing-retry', queue: dataProcessingQueue }
    ];

    const dashboard = {};

    for (const q of queues) {
      dashboard[q.name] = {
        total: await q.queue.count(),
        waiting: await q.queue.getWaitingCount(),
        active: await q.queue.getActiveCount(),
        completed: await q.queue.getCompletedCount(),
        failed: await q.queue.getFailedCount(),
        delayed: await q.queue.getDelayedCount()
      };
    }

    res.json({
      timestamp: new Date(),
      queues: dashboard,
      retryLog: retryLog.slice(-20)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// Helper Functions
// ============================================

function extractCommonFailureReasons() {
  const reasons = {};
  retryLog.forEach(log => {
    if (log.reason) {
      reasons[log.reason] = (reasons[log.reason] || 0) + 1;
    }
  });
  return reasons;
}

