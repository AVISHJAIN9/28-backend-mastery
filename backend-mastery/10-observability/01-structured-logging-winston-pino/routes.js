// Routes for Structured Logging module
const express = require('express');
const router = express.Router();
const {
  getAllLogs,
  getLogsByFilter,
  getUser,
  createLogEvent,
  getLoggerInfo,
  simulateCheckout,
  getLogStatistics,
  healthCheck
} = require('./controller');

// Correlation ID middleware
router.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || require('uuid').v4();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
});

// ==================== Logging Endpoints ====================

// Get all logs
router.get('/logs', getAllLogs);

// Filter logs by event, level, date
router.get('/logs/filter', getLogsByFilter);

// Get logs statistics
router.get('/logs/statistics', getLogStatistics);

// Create a new log event
router.post('/logs/create', express.json(), createLogEvent);

// Get logger configuration info
router.get('/logger/info', getLoggerInfo);

// ==================== User Management ====================

// Get user by ID
router.get('/users/:id', getUser);

// ==================== Business Operations ====================

// Simulate checkout process with logging
router.post('/checkout', express.json(), simulateCheckout);

// ==================== System Health ====================

// Health check
router.get('/health', healthCheck);

module.exports = router;

