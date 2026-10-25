const nodemailer = require('nodemailer');
const {
  createQueueJob,
  getQueueJob,
  getAllQueueJobs,
  updateQueueJob,
  getQueueStats,
  moveToDLQ,
  getDLQItems,
  retryFromDLQ,
  createBounceLog,
  getBounceLog,
  getBouncesByEmail,
  calculateNextRetry
} = require('./schema');

// ==================== Email Service Setup ====================

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT || 1025,
    auth: process.env.SMTP_USER 
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      : undefined
  });
};

const transporter = createTransporter();

// ==================== Queue Job Controllers ====================

// 1. Queue Email for Sending (Add to Queue)
const queueEmailForSending = async (req, res) => {
  try {
    const {
      recipientEmail,
      subject,
      body,
      template = 'custom',
      priority = 5,
      maxAttempts = 5,
      backoffStrategy = 'exponential',
      delay = 0,
      metadata = {}
    } = req.body;

    // Validation
    if (!recipientEmail || !subject) {
      return res.status(400).json({ 
        error: 'recipientEmail and subject are required' 
      });
    }

    if (priority < 1 || priority > 10) {
      return res.status(400).json({ 
        error: 'priority must be between 1-10' 
      });
    }

    if (!['exponential', 'linear', 'fixed'].includes(backoffStrategy)) {
      return res.status(400).json({
        error: 'backoffStrategy must be exponential, linear, or fixed'
      });
    }

    // Create queue job
    const job = createQueueJob({
      recipientEmail,
      subject,
      template,
      priority,
      maxAttempts,
      backoffStrategy,
      delay,
      metadata: {
        ...metadata,
        body,
        queuedAt: new Date().toISOString()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Email queued successfully',
      job: {
        id: job.id,
        jobId: job.jobId,
        status: job.status,
        recipientEmail: job.recipientEmail,
        priority: job.priority,
        nextRetry: job.nextRetry
      }
    });
  } catch (error) {
    console.error('Queue error:', error.message);
    res.status(500).json({ error: 'Failed to queue email' });
  }
};

// 2. Process Queue (Send Emails)
const processQueue = async (req, res) => {
  try {
    const { maxJobs = 10 } = req.body;

    // Get queued jobs sorted by priority
    const queuedJobs = getAllQueueJobs({ status: 'queued' })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxJobs);

    if (queuedJobs.length === 0) {
      return res.json({ 
        message: 'No queued jobs to process',
        processed: 0,
        results: []
      });
    }

    const results = [];

    for (const job of queuedJobs) {
      try {
        // Update status
        updateQueueJob(job.id, { status: 'processing' });

        // Send email
        await transporter.sendMail({
          from: process.env.FROM_EMAIL || 'noreply@app.local',
          to: job.recipientEmail,
          subject: job.subject,
          html: job.metadata.body || `<p>${job.subject}</p>`
        });

        // Mark as sent
        updateQueueJob(job.id, {
          status: 'sent',
          sentAt: new Date().toISOString()
        });

        results.push({
          id: job.id,
          status: 'sent',
          recipientEmail: job.recipientEmail
        });
      } catch (sendError) {
        // Handle failure
        job.attempts = (job.attempts || 0) + 1;

        if (job.attempts >= job.maxAttempts) {
          // Move to DLQ
          moveToDLQ(job.id, `Max retries exceeded (${job.attempts})`);
          results.push({
            id: job.id,
            status: 'deadletter',
            reason: 'Max retries exceeded',
            recipientEmail: job.recipientEmail
          });
        } else {
          // Schedule retry
          const nextRetry = calculateNextRetry(
            job.attempts,
            5000, // 5 second base delay
            job.backoffStrategy,
            3600000
          );

          updateQueueJob(job.id, {
            status: 'failed',
            attempts: job.attempts,
            nextRetry,
            failureReason: sendError.message
          });

          results.push({
            id: job.id,
            status: 'failed',
            attempt: job.attempts,
            nextRetry,
            reason: sendError.message,
            recipientEmail: job.recipientEmail
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Queue processed',
      processed: results.length,
      results
    });
  } catch (error) {
    console.error('Process queue error:', error.message);
    res.status(500).json({ error: 'Failed to process queue' });
  }
};

// 3. Retry Failed Jobs
const retryFailedJobs = async (req, res) => {
  try {
    const { afterDate = null } = req.body;

    let failedJobs = getAllQueueJobs({ status: 'failed' });

    if (afterDate) {
      failedJobs = failedJobs.filter(j => new Date(j.sentAt || j.createdAt) > new Date(afterDate));
    }

    failedJobs.forEach(job => {
      updateQueueJob(job.id, { status: 'queued', nextRetry: null });
    });

    res.json({
      success: true,
      message: `${failedJobs.length} failed jobs moved back to queue`,
      count: failedJobs.length
    });
  } catch (error) {
    console.error('Retry error:', error.message);
    res.status(500).json({ error: 'Failed to retry jobs' });
  }
};

// 4. Get Queue Job Status
const getJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const job = getQueueJob(parseInt(id));

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        jobId: job.jobId,
        recipientEmail: job.recipientEmail,
        subject: job.subject,
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        nextRetry: job.nextRetry,
        failureReason: job.failureReason,
        createdAt: job.createdAt,
        sentAt: job.sentAt
      }
    });
  } catch (error) {
    console.error('Get status error:', error.message);
    res.status(500).json({ error: 'Failed to get job status' });
  }
};

// 5. Get All Queue Jobs
const getAllJobs = async (req, res) => {
  try {
    const { status, email, limit = 50 } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (email) filters.email = email;

    const jobs = getAllQueueJobs(filters).slice(0, parseInt(limit));

    res.json({
      success: true,
      count: jobs.length,
      jobs: jobs.map(j => ({
        id: j.id,
        recipientEmail: j.recipientEmail,
        subject: j.subject,
        status: j.status,
        priority: j.priority,
        attempts: j.attempts,
        maxAttempts: j.maxAttempts,
        nextRetry: j.nextRetry,
        createdAt: j.createdAt,
        sentAt: j.sentAt
      }))
    });
  } catch (error) {
    console.error('Get all jobs error:', error.message);
    res.status(500).json({ error: 'Failed to get jobs' });
  }
};

// 6. Get Queue Statistics
const getQueueStatistics = async (req, res) => {
  try {
    const stats = getQueueStats();

    res.json({
      success: true,
      statistics: {
        total: stats.total,
        byStatus: {
          queued: stats.queued,
          processing: stats.processing,
          sent: stats.sent,
          failed: stats.failed,
          bounced: stats.bounced,
          deadLetter: stats.deadLetter
        },
        avgAttempts: stats.avgAttempts,
        health: {
          queueHealth: stats.queued === 0 ? 'healthy' : 'processing',
          oldestJobAge: stats.oldestJob ? Math.round((Date.now() - stats.oldestJob) / 1000) : 0
        }
      }
    });
  } catch (error) {
    console.error('Statistics error:', error.message);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

// 7. Dead Letter Queue Management
const getDLQItems = async (req, res) => {
  try {
    const items = getDLQItems();

    res.json({
      success: true,
      count: items.length,
      items: items.map(item => ({
        id: item.id,
        originalJobId: item.originalJobId,
        recipientEmail: item.recipientEmail,
        subject: item.subject,
        reason: item.reason,
        movedAt: item.movedAt,
        manuallyRetried: item.manuallyRetried
      }))
    });
  } catch (error) {
    console.error('DLQ error:', error.message);
    res.status(500).json({ error: 'Failed to get DLQ items' });
  }
};

// 8. Retry from Dead Letter Queue
const retryFromDLQController = async (req, res) => {
  try {
    const { dlqId } = req.params;

    const newJob = retryFromDLQ(parseInt(dlqId));
    if (!newJob) {
      return res.status(404).json({ error: 'DLQ item not found' });
    }

    res.json({
      success: true,
      message: 'Job recovered from DLQ and requeued',
      newJob: {
        id: newJob.id,
        jobId: newJob.jobId,
        status: newJob.status,
        maxAttempts: newJob.maxAttempts
      }
    });
  } catch (error) {
    console.error('DLQ retry error:', error.message);
    res.status(500).json({ error: 'Failed to retry from DLQ' });
  }
};

// 9. Bounce Webhook Handler
const handleBounceWebhook = async (req, res) => {
  try {
    const {
      email,
      bounceType = 'hard_bounce',
      bounceSubType = 'permanent',
      jobId = null,
      provider = 'webhook'
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    // Log bounce
    const bounce = createBounceLog({
      jobId,
      email,
      bounceType,
      bounceSubType,
      provider,
      reason: `${bounceType} - ${bounceSubType}`
    });

    // If hard bounce, move related jobs to DLQ
    if (bounceType === 'hard_bounce') {
      const relatedJobs = getAllQueueJobs({ email }).filter(j => 
        ['queued', 'failed', 'processing'].includes(j.status)
      );

      relatedJobs.forEach(job => {
        moveToDLQ(job.id, `Hard bounce received for ${email}`);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Bounce logged',
      bounce: {
        id: bounce.id,
        email: bounce.email,
        bounceType: bounce.bounceType,
        timestamp: bounce.timestamp
      }
    });
  } catch (error) {
    console.error('Bounce webhook error:', error.message);
    res.status(500).json({ error: 'Failed to handle bounce' });
  }
};

// 10. Get Bounce Log
const getBounceLogController = async (req, res) => {
  try {
    const { email } = req.query;

    let bounces = getBounceLog();
    if (email) {
      bounces = getBouncesByEmail(email);
    }

    res.json({
      success: true,
      count: bounces.length,
      bounces: bounces.map(b => ({
        id: b.id,
        email: b.email,
        bounceType: b.bounceType,
        bounceSubType: b.bounceSubType,
        timestamp: b.timestamp,
        provider: b.provider
      }))
    });
  } catch (error) {
    console.error('Bounce log error:', error.message);
    res.status(500).json({ error: 'Failed to get bounce log' });
  }
};

module.exports = {
  queueEmailForSending,
  processQueue,
  retryFailedJobs,
  getJobStatus,
  getAllJobs,
  getQueueStatistics,
  getDLQItems,
  retryFromDLQController,
  handleBounceWebhook,
  getBounceLogController
};

