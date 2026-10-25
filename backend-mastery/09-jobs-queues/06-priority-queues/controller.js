/**
 * Priority Queues Controller
 * Manages jobs with different priority levels
 */

const { Queue, Worker } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || 6379)
};

const priorityQueue = new Queue('priority-jobs', { connection });

/**
 * Submit job with priority
 */
exports.submitJob = async (req, res) => {
  try {
    const { taskId, data, priority = 'normal' } = req.body;

    const priorityMap = {
      'critical': 0,
      'high': 1,
      'normal': 5,
      'low': 10
    };

    const job = await priorityQueue.add(
      { taskId, data, timestamp: new Date() },
      {
        priority: priorityMap[priority] || priorityMap.normal,
        removeOnComplete: true,
        removeOnFail: false
      }
    );

    res.status(201).json({
      success: true,
      jobId: job.id,
      priority,
      message: `Job submitted with ${priority} priority`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all jobs in queue
 */
exports.getJobs = async (req, res) => {
  try {
    const counts = await priorityQueue.getJobCounts();
    const jobs = await priorityQueue.getJobs(['waiting', 'active'], 0, -1);

    res.json({
      total: counts.count,
      counts,
      jobs: jobs.map(j => ({
        id: j.id,
        data: j.data,
        priority: j.opts.priority,
        status: j._progress !== null ? 'active' : 'waiting'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get priority levels information
 */
exports.getPriorityLevels = async (req, res) => {
  try {
    res.json({
      levelss: {
        critical: {
          value: 0,
          description: 'Process immediately',
          examples: 'Security alerts, payment processing, critical errors'
        },
        high: {
          value: 1,
          description: 'Process ASAP',
          examples: 'User-triggered actions, important notifications'
        },
        normal: {
          value: 5,
          description: 'Process in order',
          examples: 'Regular operations, standard tasks'
        },
        low: {
          value: 10,
          description: 'Process when free',
          examples: 'Background cleanup, analytics, optional syncs'
        }
      },
      processingOrder: 'Jobs processed by priority value (lower = processed first)'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get dashboard with job distribution
 */
exports.getDashboard = async (req, res) => {
  try {
    const counts = await priorityQueue.getJobCounts();
    const jobs = await priorityQueue.getJobs(['waiting'], 0, -1);

    const priorityDistribution = { critical: 0, high: 0, normal: 0, low: 0 };

    jobs.forEach(job => {
      const p = job.opts.priority;
      if (p === 0) priorityDistribution.critical++;
      else if (p === 1) priorityDistribution.high++;
      else if (p === 5) priorityDistribution.normal++;
      else priorityDistribution.low++;
    });

    res.json({
      timestamp: new Date(),
      counts,
      distribution: priorityDistribution,
      nextJob: jobs.length > 0 ? {
        id: jobs[0].id,
        priority: jobs[0].opts.priority
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get job by ID
 */
exports.getJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await priorityQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      id: job.id,
      data: job.data,
      priority: job.opts.priority,
      state: await job.getState(),
      progress: job._progress,
      attempts: job.attemptsMade,
      createdAt: new Date(job.createdTimestamp)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

