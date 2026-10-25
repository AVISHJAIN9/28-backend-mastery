/**
 * Cron Jobs Routes
 * Endpoints for managing and monitoring scheduled tasks
 */

const express = require('express');
const controller = require('./controller');

const router = express.Router();

// Task Management
router.post('/tasks', controller.createTask);                    // Create scheduled task
router.get('/tasks', controller.getAllTasks);                   // List all tasks
router.get('/tasks/:taskName', controller.getTask);             // Get specific task
router.put('/tasks/:taskName/pause', controller.pauseTask);     // Pause task
router.put('/tasks/:taskName/resume', controller.resumeTask);   // Resume task
router.delete('/tasks/:taskName', controller.deleteTask);       // Delete task
router.post('/tasks/:taskName/trigger', controller.triggerTask); // Execute now

// Logs & Monitoring
router.get('/logs', controller.getTaskLogs);                    // Get all logs
router.get('/logs/:taskName', controller.getTaskLogs);          // Get logs for task
router.get('/cron-patterns', controller.getCronPatterns);       // Cron examples
router.get('/dashboard', controller.getDashboard);              // Dashboard overview

module.exports = router;

