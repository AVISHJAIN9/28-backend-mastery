const express = require('express');
const {
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
} = require('./controller');

const {
  validateQueueInput,
  validateBounceWebhook,
  queueRateLimiter,
  logQueueOperation
} = require('./middleware');

const router = express.Router();

// ==================== Logging ====================

router.use(logQueueOperation);

// ==================== Queue Management Routes ====================

// POST /api/queue/add - Queue an email
router.post(
  '/queue/add',
  queueRateLimiter,
  validateQueueInput,
  queueEmailForSending
);

// POST /api/queue/process - Process queued emails (send them)
router.post(
  '/queue/process',
  queueRateLimiter,
  processQueue
);

// POST /api/queue/retry-failed - Retry all failed jobs
router.post(
  '/queue/retry-failed',
  queueRateLimiter,
  retryFailedJobs
);

// GET /api/queue/job/:id - Get specific job status
router.get('/queue/job/:id', getJobStatus);

// GET /api/queue/jobs - Get all queue jobs (with optional filters)
// Query: ?status=queued&email=user@example.com&limit=50
router.get('/queue/jobs', getAllJobs);

// GET /api/queue/stats - Get queue statistics
router.get('/queue/stats', getQueueStatistics);

// ==================== Dead Letter Queue Routes ====================

// GET /api/dlq/items - Get all DLQ items
router.get('/dlq/items', getDLQItems);

// POST /api/dlq/retry/:dlqId - Retry item from DLQ
router.post('/dlq/retry/:dlqId', queueRateLimiter, retryFromDLQController);

// ==================== Bounce Handling Routes ====================

// POST /api/bounces/webhook - Webhook endpoint for bounce notifications
router.post(
  '/bounces/webhook',
  validateBounceWebhook,
  handleBounceWebhook
);

// GET /api/bounces/log - Get bounce log
// Query: ?email=user@example.com
router.get('/bounces/log', getBounceLogController);

module.exports = router;

