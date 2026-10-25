/**
 * Buffers and Streams - Routes
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const middleware = require('./middleware');

// ============================================
// Middleware Setup
// ============================================

router.use(middleware.requestLogger);
router.use(middleware.errorHandler);

// ============================================
// Buffer Routes
// ============================================

/**
 * GET /api/buffers/basics
 * Demonstrate buffer creation and operations
 * Query: size=1024
 */
router.get('/api/buffers/basics', controller.demonstrateBufferBasics);

/**
 * GET /api/buffers/encoding
 * Demonstrate buffer encoding conversions
 * Query: encoding=utf8
 */
router.get('/api/buffers/encoding', controller.demonstrateBufferEncoding);

// ============================================
// Stream Routes
// ============================================

/**
 * GET /api/streams/basic
 * Demonstrate basic streaming
 * Query: chunkSize=1024
 */
router.get('/api/streams/basic', controller.demonstrateStreams);

/**
 * GET /api/streams/transform
 * Demonstrate transform streams
 */
router.get('/api/streams/transform', controller.demonstrateTransformStream);

/**
 * GET /api/streams/pipeline
 * Demonstrate pipeline pattern
 */
router.get('/api/streams/pipeline', controller.demonstratePipeline);

/**
 * GET /api/streams/backpressure
 * Demonstrate backpressure handling
 */
router.get('/api/streams/backpressure', controller.demonstrateBackpressure);

/**
 * GET /api/buffers/memory-comparison
 * Compare memory usage: buffer vs streams
 */
router.get('/api/buffers/memory-comparison', controller.compareMemoryUsage);

module.exports = router;
