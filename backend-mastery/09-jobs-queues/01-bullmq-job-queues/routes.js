/**
 * BullMQ Routes
 * Endpoints for job queue management
 */

const express = require('express');
const router = express.Router();
const controller = require('./controller');

// ============================================
// Job Management Routes
// ============================================

// Add jobs
router.post('/jobs/email', controller.addEmailJob);
router.post('/jobs/report', controller.addReportJob);
router.post('/jobs/bulk', controller.addBulkJobs);

// Job monitoring
router.get('/jobs/:jobId/status/:queueName', controller.getJobStatus);
router.get('/queues/:queueName/stats', controller.getQueueStats);
router.get('/queues/:queueName/jobs/:status', controller.getQueueJobs);

// Job control
router.post('/jobs/:jobId/retry/:queueName', controller.retryJob);
router.delete('/jobs/:jobId/:queueName', controller.removeJob);
router.delete('/queues/:queueName/clear', controller.clearQueue);

// Health
router.get('/queues/:queueName/workers', controller.getWorkerStatus);

module.exports = router;

