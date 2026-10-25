/**
 * Job Retry Routes
 * Endpoints for retry configuration and monitoring
 */

const express = require('express');
const controller = require('./controller');

const router = express.Router();

// Submit jobs with retry
router.post('/submit/email', controller.submitEmailJobWithRetry);         // Email with retry
router.post('/submit/api-call', controller.submitApiCallWithRetry);       // API call with retry
router.post('/submit/process-data', controller.submitDataProcessingWithRetry); // Data processing

// Job monitoring
router.get('/job/:jobId/:queueName', controller.getJobStatus);            // Get job details
router.get('/job/:jobId', controller.getJobStatus);                       // Get job status
router.post('/job/:jobId/:queueName/retry', controller.retryFailedJob);  // Manually retry

// Statistics and strategies
router.get('/stats', controller.getRetryStats);                           // Retry statistics
router.get('/strategies', controller.getBackoffStrategies);               // Available strategies
router.get('/calculate-backoff', controller.calculateBackoff);            // Calculate delays
router.get('/dashboard', controller.getRetryDashboard);                   // Dashboard data

module.exports = router;

