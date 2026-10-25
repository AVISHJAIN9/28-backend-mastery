// Server for Structured Logging Module
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { LoggingService } = require('./controller');
const routes = require('./routes');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.HTTP_PORT || 4001;
const VERSION = '1.0.0';

// ==================== Middleware ====================

// Security
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    LoggingService.logRequest(req, res, duration);
  });
  
  next();
});

// ==================== Routes ====================

app.use('/api', routes);

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: 'Structured Logging API (Winston)',
    version: VERSION,
    module: '01-structured-logging-winston-pino',
    description: 'Learn structured and contextual logging with Winston',
    endpoints: {
      logs: [
        { method: 'GET', path: '/api/logs', description: 'Get all logs' },
        { method: 'GET', path: '/api/logs/filter?event=&level=', description: 'Filter logs' },
        { method: 'POST', path: '/api/logs/create', description: 'Create log event' },
        { method: 'GET', path: '/api/logs/statistics', description: 'Get log statistics' }
      ],
      logger: [
        { method: 'GET', path: '/api/logger/info', description: 'Get logger configuration' }
      ],
      users: [
        { method: 'GET', path: '/api/users/:id', description: 'Get user (with logging)' }
      ],
      operations: [
        { method: 'POST', path: '/api/checkout', description: 'Simulate checkout with logging' }
      ],
      system: [
        { method: 'GET', path: '/api/health', description: 'Health check' }
      ]
    },
    features: [
      'Winston logger with multiple transports',
      'Structured JSON logging',
      'Log levels (error, warn, info, debug)',
      'Correlation IDs for request tracking',
      'Child loggers with context',
      'File rotation and archiving',
      'Database operation logging',
      'Error and exception handling',
      'Performance metric tracking'
    ]
  });
});

// ==================== Error Handling ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((error, req, res, next) => {
  LoggingService.logError(error, {
    endpoint: req.path,
    method: req.method,
    correlationId: req.correlationId
  });
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// ==================== Startup ====================

app.listen(PORT, () => {
  LoggingService.logApplicationStart(VERSION, PORT);
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║   Structured Logging API (Winston)                             ║
║   Module: 01-structured-logging-winston-pino                   ║
║   Server: Running on http://localhost:${PORT}                   ║
║   Version: ${VERSION}                                                  ║
│════════════════════════════════════════════════════════════════│
│   Features:                                                    │
│   • Structured JSON logging with Winston                       ║
│   • Multiple transport types (File, Console)                  ║
│   • Correlation ID tracking per request                        ║
│   • Log levels and filtering                                   ║
│   • Error context and stack traces                             ║
│   • Performance metrics logging                                ║
│   • Child loggers with contextual data                         ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  LoggingService.logApplicationShutdown('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  LoggingService.logApplicationShutdown('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
