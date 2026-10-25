require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const logger = require('./logger');
const {
  requestLogger,
  validationErrorHandler,
  notFoundHandler,
  globalErrorHandler
} = require('./middleware');

// ==================== INITIALIZATION ====================

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 6602;
const NODE_ENV = process.env.NODE_ENV || 'development';

logger.info('Server initialization', {
  node_env: NODE_ENV,
  port: HTTP_PORT,
  aws_region: process.env.AWS_REGION
});

// ==================== SECURITY MIDDLEWARE ====================

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:6602'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length']
}));

// ==================== BODY PARSING MIDDLEWARE ====================

// For JSON requests
app.use(express.json({ limit: '1mb' }));

// For URL-encoded requests
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// For binary data (chunks)
app.use(express.raw({ type: 'application/octet-stream', limit: '100mb' }));

// ==================== REQUEST LOGGING ====================

app.use(requestLogger);

// ==================== API ROUTES ====================

/**
 * Root endpoint - API information
 */
app.get('/', (req, res) => {
  res.json({
    name: '02 Chunked Uploads Multipart Resume',
    module: '25-file-media-storage',
    moduleNumber: 2,
    description: 'Production-ready chunked file uploads with multipart resume capability',
    version: '1.0.0',
    features: [
      'Multipart upload initiation',
      'Chunk-based file upload',
      'Upload progress tracking',
      'Resume capability',
      'Presigned URLs for download',
      'AWS S3 integration'
    ],
    endpoints: {
      health: '/health',
      api: '/api',
      documentation: 'See README.md and theory.md'
    },
    config: {
      chunkSize: `${process.env.CHUNK_SIZE_BYTES || 5242880} bytes`,
      maxFileSize: `${process.env.MAX_FILE_SIZE_BYTES || 1073741824} bytes`,
      port: HTTP_PORT
    }
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    module: '02-chunked-uploads-multipart-resume',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

/**
 * API routes
 */
app.use('/api', routes);

// ==================== ERROR HANDLING ====================

/**
 * Validation error handler
 */
app.use(validationErrorHandler);

/**
 * 404 handler
 */
app.use(notFoundHandler);

/**
 * Global error handler (must be last)
 */
app.use(globalErrorHandler);

// ==================== SERVER STARTUP ====================

let server;

/**
 * Start server
 */
function startServer() {
  server = app.listen(HTTP_PORT, () => {
    logger.info('Server started successfully', {
      port: HTTP_PORT,
      environment: NODE_ENV,
      timestamp: new Date().toISOString()
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✓ Module 02: Chunked Uploads Multipart Resume');
    console.log(`✓ Server running on http://localhost:${HTTP_PORT}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nEndpoints:');
    console.log(`  • Health:    http://localhost:${HTTP_PORT}/health`);
    console.log(`  • API Root:  http://localhost:${HTTP_PORT}/api`);
    console.log(`  • Home:      http://localhost:${HTTP_PORT}/`);
    console.log('\nAPI Routes:');
    console.log('  POST   /api/initiate              - Initiate upload');
    console.log('  PUT    /api/upload-chunk          - Upload chunk');
    console.log('  GET    /api/list-chunks           - List uploaded chunks');
    console.log('  GET    /api/upload-status/:id     - Get upload status');
    console.log('  POST   /api/complete-upload       - Complete upload');
    console.log('  DELETE /api/abort-upload          - Abort upload');
    console.log('\n═══════════════════════════════════════════════════════════════\n');
  });
}

// ==================== GRACEFUL SHUTDOWN ====================

/**
 * Handle SIGTERM signal
 */
process.on('SIGTERM', () => {
  logger.warn('SIGTERM signal received: closing HTTP server');
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  }

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forcing process exit');
    process.exit(1);
  }, 10000);
});

/**
 * Handle SIGINT signal (Ctrl+C)
 */
process.on('SIGINT', () => {
  logger.warn('SIGINT signal received: closing HTTP server');
  
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  }
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: reason?.message || reason,
    promise
  });
});

// ==================== EXPORTS ====================

// Start server if not imported as module
if (require.main === module) {
  startServer();
}

module.exports = app;

