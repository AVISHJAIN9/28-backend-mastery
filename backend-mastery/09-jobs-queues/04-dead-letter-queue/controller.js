/**
 * Dead Letter Queue (DLQ) Controller
 * Manages failed jobs and dead letter processing
 */

const { Queue, Worker } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || 6379)
};

const mainQueue = new Queue('orders', { connection });
const dlQueue = new Queue('orders:dlq', { connection });

const deadLetterLog = [];

// ============================================
// Job Submission
// ============================================

/**
 * Submit an order job
 */
exports.submitOrder = async (req, res) => {
  try {
    const { orderId, customerId, items, totalAmount } = req.body;

    const job = await mainQueue.add(
      { orderId, customerId, items, totalAmount, timestamp: new Date() },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false // Keep failed jobs for DLQ
      }
    );

    res.status(201).json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Order submitted for processing'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// DLQ Management
// ============================================

/**
 * Get all dead letter jobs
 */
exports.getDeadLetterJobs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const count = await dlQueue.count();
    const jobs = await dlQueue.getJobs(['failed'], 0, limit);

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      failedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      createdAt: new Date(job.createdTimestamp)
    }));

    res.json({
      total: count,
      count: formattedJobs.length,
      jobs: formattedJobs,
      deadLetterSize: deadLetterLog.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get specific DLQ job details
 */
exports.getDeadLetterJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await dlQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found in DLQ' });
    }

    res.json({
      id: job.id,
      data: job.data,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      failedAt: new Date(job.finishedOn),
      createdAt: new Date(job.createdTimestamp),
      retentionInfo: {
        createdDaysAgo: Math.floor((Date.now() - job.createdTimestamp) / (1000 * 60 * 60 * 24)),
        willExpireIn: '30 days from creation'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retry a dead letter job
 */
exports.retryDeadLetterJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await dlQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found in DLQ' });
    }

    // Move back to main queue
    const newJob = await mainQueue.add(job.data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false
    });

    // Log the retry
    deadLetterLog.push({
      timestamp: new Date(),
      originalJobId: jobId,
      newJobId: newJob.id,
      action: 'RETRY',
      message: 'Dead letter job requeued for retry'
    });

    res.json({
      success: true,
      message: 'Dead letter job requeued',
      originalJobId: jobId,
      newJobId: newJob.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a dead letter job
 */
exports.deleteDeadLetterJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await dlQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found in DLQ' });
    }

    await job.remove();

    deadLetterLog.push({
      timestamp: new Date(),
      jobId: jobId,
      action: 'DELETE',
      message: 'Dead letter job permanently deleted'
    });

    res.json({
      success: true,
      message: 'Job deleted from DLQ',
      jobId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Bulk retry dead letter jobs
 */
exports.retryAllDeadLetters = async (req, res) => {
  try {
    const count = await dlQueue.count();
    const jobs = await dlQueue.getJobs(['failed']);
    let retriedCount = 0;

    for (const job of jobs) {
      try {
        await mainQueue.add(job.data, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false
        });
        retriedCount++;
      } catch (error) {
        console.error(`Failed to retry job ${job.id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Bulk retry completed`,
      totalDeadLetters: count,
      retriedCount,
      failedRetryCount: count - retriedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// Analysis & Monitoring
// ============================================

/**
 * Analyze dead letter causes
 */
exports.analyzeDLQCauses = async (req, res) => {
  try {
    const jobs = await dlQueue.getJobs(['failed'], 0, -1);

    const causeAnalysis = {
      totalDeadLetters: jobs.length,
      failureReasons: {},
      byDate: {},
      byCategory: {
        'network': 0,
        'validation': 0,
        'database': 0,
        'timeout': 0,
        'other': 0
      }
    };

    jobs.forEach(job => {
      const reason = job.failedReason || 'Unknown';
      causeAnalysis.failureReasons[reason] = (causeAnalysis.failureReasons[reason] || 0) + 1;

      // Categorize
      if (reason.includes('timeout')) causeAnalysis.byCategory.timeout++;
      else if (reason.includes('ECONNREFUSED') || reason.includes('ENOTFOUND')) causeAnalysis.byCategory.network++;
      else if (reason.includes('validation')) causeAnalysis.byCategory.validation++;
      else if (reason.includes('database')) causeAnalysis.byCategory.database++;
      else causeAnalysis.byCategory.other++;

      // By date
      const date = new Date(job.finishedOn).toLocaleDateString();
      causeAnalysis.byDate[date] = (causeAnalysis.byDate[date] || 0) + 1;
    });

    res.json(causeAnalysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get DLQ statistics
 */
exports.getDLQStats = async (req, res) => {
  try {
    const dlqCount = await dlQueue.count();
    const mainQueueCount = await mainQueue.count();
    const mainCompleted = await mainQueue.getCompletedCount();
    const mainFailed = await mainQueue.getFailedCount();

    const stats = {
      timestamp: new Date(),
      deadLetterQueue: {
        total: dlqCount,
        percentage: mainFailed > 0 ? ((dlqCount / (mainFailed + dlqCount)) * 100).toFixed(2) + '%' : 'N/A'
      },
      mainQueue: {
        waiting: await mainQueue.getWaitingCount(),
        active: await mainQueue.getActiveCount(),
        completed: mainCompleted,
        failed: mainFailed
      },
      retention: {
        description: '30 days',
        autoCleanup: true,
        cleanupDayOfWeek: 'Sunday'
      },
      recentLog: deadLetterLog.slice(-10)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Export dead letters for audit
 */
exports.exportDeadLetters = async (req, res) => {
  try {
    const format = req.query.format || 'json'; // json, csv
    const jobs = await dlQueue.getJobs(['failed'], 0, -1);

    const exportData = jobs.map(job => ({
      jobId: job.id,
      orderId: job.data?.orderId,
      customerId: job.data?.customerId,
      failureReason: job.failedReason,
      attempts: job.attemptsMade,
      failedAt: new Date(job.finishedOn),
      severity: determineSeverity(job.failedReason)
    }));

    if (format === 'csv') {
      const csv = convertToCSV(exportData);
      res.header('Content-Type', 'text/csv');
      res.send(csv);
    } else {
      res.json({
        exported: exportData.length,
        data: exportData,
        exportedAt: new Date()
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// Helper Functions
// ============================================

function determineSeverity(failedReason) {
  if (!failedReason) return 'unknown';
  if (failedReason.includes('timeout')) return 'medium';
  if (failedReason.includes('ECONNREFUSED')) return 'high';
  if (failedReason.includes('validation')) return 'low';
  return 'medium';
}

function convertToCSV(data) {
  const headers = Object.keys(data[0] || {});
  const csv = [headers.join(',')];
  
  data.forEach(row => {
    csv.push(headers.map(h => JSON.stringify(row[h])).join(','));
  });
  
  return csv.join('\n');
}

