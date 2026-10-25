// ==================== Database Schema ====================
// This is an in-memory database schema for educational purposes
// In production, use MongoDB, PostgreSQL, or Redis

const emailQueueLog = {};
let queueId = 1;

const emailQueueSchema = {
  id: 'unique identifier',
  jobId: 'string - Bull queue job ID',
  recipientEmail: 'string - email address',
  subject: 'string - email subject',
  template: 'string - template type',
  status: 'enum - queued, processing, sent, failed, bounced, deadletter',
  priority: 'number - 1-10, higher = more urgent',
  attempts: 'number - current attempt count',
  maxAttempts: 'number - maximum retry attempts',
  nextRetry: 'timestamp - when to retry',
  backoffStrategy: 'enum - exponential, linear, fixed',
  delay: 'number - delay in ms before first attempt',
  metadata: 'object - custom data',
  failureReason: 'string - description of failure',
  createdAt: 'timestamp - when job was created',
  sentAt: 'timestamp - when job was sent',
  deadLetterReason: 'string - reason moved to dead letter queue'
};

const deadLetterQueueLog = {};
let dlqId = 1;

const dlqSchema = {
  id: 'unique identifier',
  originalJobId: 'number - original queue job id',
  recipientEmail: 'string - email address',
  subject: 'string - email subject',
  reason: 'enum - max_retries_exceeded, invalid_email, provider_rejection, other',
  remainingData: 'object - email data for manual retry',
  movedAt: 'timestamp - when moved to DLQ',
  manuallyRetried: 'boolean - was this manually retried',
  manualRetryAt: 'timestamp - when manually retried'
};

const bounceLog = {};
let bounceId = 1;

const bounceSchema = {
  id: 'unique identifier',
  jobId: 'number - original queue job id',
  email: 'string - bounced email address',
  bounceType: 'enum - hard_bounce, soft_bounce, complaint',
  bounceSubType: 'enum - permanent, transient, suppressed, etc',
  timestamp: 'timestamp - when bounce occurred',
  provider: 'string - email provider (nodemailer, sendgrid, ses)',
  reason: 'string - bounce reason from provider'
};

// Retry strategies configuration
const retryStrategies = {
  exponential: {
    name: 'Exponential Backoff',
    formula: 'delay = baseDelay * (2 ^ attemptNumber)',
    description: 'Doubles delay each retry (1s, 2s, 4s, 8s...)',
    maxDelay: 3600000, // 1 hour
    useCase: 'General failures, temporary issues'
  },
  linear: {
    name: 'Linear Backoff',
    formula: 'delay = baseDelay * attemptNumber',
    description: 'Increases delay linearly (1s, 2s, 3s, 4s...)',
    maxDelay: 600000, // 10 minutes
    useCase: 'Rate limiting, API issues'
  },
  fixed: {
    name: 'Fixed Delay',
    formula: 'delay = baseDelay',
    description: 'Same delay between all retries',
    maxDelay: 300000, // 5 minutes
    useCase: 'Quick retries, temporary network issues'
  }
};

const queueConfigurations = {
  aggressive: {
    name: 'Aggressive Retry (Critical)',
    maxAttempts: 10,
    baseDelay: 1000, // 1 second
    backoffStrategy: 'exponential',
    useCase: 'Payment notifications, urgent alerts'
  },
  moderate: {
    name: 'Moderate Retry (Standard)',
    maxAttempts: 5,
    baseDelay: 5000, // 5 seconds
    backoffStrategy: 'exponential',
    useCase: 'Welcome emails, standard transactional'
  },
  conservative: {
    name: 'Conservative Retry (Batch)',
    maxAttempts: 3,
    baseDelay: 60000, // 1 minute
    backoffStrategy: 'linear',
    useCase: 'Bulk emails, low-priority notifications'
  }
};

// ==================== Helper Functions ====================

const createQueueJob = (data) => {
  const job = {
    id: queueId++,
    jobId: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    recipientEmail: data.recipientEmail,
    subject: data.subject,
    template: data.template || 'custom',
    status: 'queued',
    priority: data.priority || 5,
    attempts: 0,
    maxAttempts: data.maxAttempts || 5,
    nextRetry: null,
    backoffStrategy: data.backoffStrategy || 'exponential',
    delay: data.delay || 0,
    metadata: data.metadata || {},
    failureReason: null,
    createdAt: new Date().toISOString(),
    sentAt: null,
    deadLetterReason: null
  };
  emailQueueLog[job.id] = job;
  return job;
};

const getQueueJob = (id) => {
  return emailQueueLog[id] || null;
};

const getAllQueueJobs = (filters = {}) => {
  let jobs = Object.values(emailQueueLog);
  
  if (filters.status) {
    jobs = jobs.filter(j => j.status === filters.status);
  }
  if (filters.email) {
    jobs = jobs.filter(j => j.recipientEmail === filters.email);
  }
  if (filters.priority) {
    jobs = jobs.filter(j => j.priority === parseInt(filters.priority));
  }
  
  return jobs;
};

const updateQueueJob = (id, updates) => {
  if (!emailQueueLog[id]) return null;
  const updated = { ...emailQueueLog[id], ...updates };
  emailQueueLog[id] = updated;
  return updated;
};

const deleteQueueJob = (id) => {
  delete emailQueueLog[id];
  return true;
};

const getQueueStats = () => {
  const jobs = Object.values(emailQueueLog);
  return {
    total: jobs.length,
    queued: jobs.filter(j => j.status === 'queued').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    sent: jobs.filter(j => j.status === 'sent').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    bounced: jobs.filter(j => j.status === 'bounced').length,
    deadLetter: jobs.filter(j => j.status === 'deadletter').length,
    avgAttempts: Math.round(jobs.reduce((sum, j) => sum + j.attempts, 0) / jobs.length || 1),
    oldestJob: jobs.length > 0 ? Math.min(...jobs.map(j => new Date(j.createdAt).getTime())) : null
  };
};

const moveToDLQ = (jobId, reason) => {
  const job = emailQueueLog[jobId];
  if (!job) return null;

  const dlqEntry = {
    id: dlqId++,
    originalJobId: jobId,
    recipientEmail: job.recipientEmail,
    subject: job.subject,
    reason,
    remainingData: {
      template: job.template,
      metadata: job.metadata,
      subject: job.subject
    },
    movedAt: new Date().toISOString(),
    manuallyRetried: false,
    manualRetryAt: null
  };

  deadLetterQueueLog[dlqEntry.id] = dlqEntry;
  updateQueueJob(jobId, { 
    status: 'deadletter', 
    deadLetterReason: reason 
  });

  return dlqEntry;
};

const getDLQItems = () => {
  return Object.values(deadLetterQueueLog);
};

const retryFromDLQ = (dlqId) => {
  const dlqItem = deadLetterQueueLog[dlqId];
  if (!dlqItem) return null;

  const newJob = createQueueJob({
    recipientEmail: dlqItem.recipientEmail,
    subject: dlqItem.subject,
    template: dlqItem.remainingData.template,
    metadata: dlqItem.remainingData.metadata,
    maxAttempts: 3 // Give it 3 more attempts
  });

  deadLetterQueueLog[dlqId] = {
    ...dlqItem,
    manuallyRetried: true,
    manualRetryAt: new Date().toISOString()
  };

  return newJob;
};

const createBounceLog = (data) => {
  const bounce = {
    id: bounceId++,
    jobId: data.jobId,
    email: data.email,
    bounceType: data.bounceType || 'hard_bounce',
    bounceSubType: data.bounceSubType || 'permanent',
    timestamp: new Date().toISOString(),
    provider: data.provider || 'unknown',
    reason: data.reason || 'Bounce webhook received'
  };
  bounceLog[bounce.id] = bounce;
  return bounce;
};

const getBounceLog = () => {
  return Object.values(bounceLog);
};

const getBouncesByEmail = (email) => {
  return Object.values(bounceLog).filter(b => b.email === email);
};

const calculateNextRetry = (attempts, baseDelay, strategy, maxDelay) => {
  let delay = baseDelay;

  if (strategy === 'exponential') {
    delay = baseDelay * Math.pow(2, attempts - 1);
  } else if (strategy === 'linear') {
    delay = baseDelay * attempts;
  }
  // fixed strategy: delay remains baseDelay

  // Cap at maxDelay
  delay = Math.min(delay, maxDelay);

  return new Date(Date.now() + delay).toISOString();
};

module.exports = {
  // Queue Job Functions
  createQueueJob,
  getQueueJob,
  getAllQueueJobs,
  updateQueueJob,
  deleteQueueJob,
  getQueueStats,

  // Dead Letter Queue Functions
  moveToDLQ,
  getDLQItems,
  retryFromDLQ,

  // Bounce Handling
  createBounceLog,
  getBounceLog,
  getBouncesByEmail,

  // Utility Functions
  calculateNextRetry,

  // Constants
  emailQueueSchema,
  dlqSchema,
  bounceSchema,
  retryStrategies,
  queueConfigurations
};

