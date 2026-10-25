/**
 * Priority Queues Routes
 */

const express = require('express');
const controller = require('./controller');

const router = express.Router();

router.post('/jobs', controller.submitJob);           // Submit job with priority
router.get('/jobs', controller.getJobs);              // Get all jobs
router.get('/jobs/:jobId', controller.getJob);        // Get specific job
router.get('/levels', controller.getPriorityLevels); // Get priority levels info
router.get('/dashboard', controller.getDashboard);    // Dashboard view

module.exports = router;

