/**
 * Dead Letter Queue Routes
 * Endpoints for managing failed jobs
 */

const express = require('express');
const controller = require('./controller');

const router = express.Router();

// Job submission
router.post('/orders', controller.submitOrder);

// DLQ management
router.get('/dlq', controller.getDeadLetterJobs);                    // Get all DLQ jobs
router.get('/dlq/:jobId', controller.getDeadLetterJob);             // Get DLQ job details
router.post('/dlq/:jobId/retry', controller.retryDeadLetterJob);    // Retry DLQ job
router.delete('/dlq/:jobId', controller.deleteDeadLetterJob);       // Delete DLQ job
router.post('/dlq/retry-all', controller.retryAllDeadLetters);      // Bulk retry

// Analysis
router.get('/analysis/causes', controller.analyzeDLQCauses);        // Analyze failure causes
router.get('/stats', controller.getDLQStats);                       // DLQ statistics
router.get('/export', controller.exportDeadLetters);                // Export for audit

module.exports = router;

