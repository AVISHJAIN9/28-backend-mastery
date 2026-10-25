/**
 * Routes
 * API endpoint definitions
 */

const express = require('express');
const controller = require('./controller');
const { verifyToken, validateContentType } = require('./middleware');

const router = express.Router();

// ==================== Public Routes ====================

// Health check
router.get('/health', controller.healthCheck);

// ==================== Upload Routes ====================

// Generate presigned URL for upload
router.post(
  '/upload/presigned-url',
  validateContentType,
  controller.generateUploadPresignedUrl
);

// ==================== Download Routes ====================

// Generate presigned URL for download
router.get(
  '/download/presigned-url/:key',
  controller.generateDownloadPresignedUrl
);

// ==================== Object Management Routes ====================

// List all objects in S3
router.get(
  '/objects',
  controller.listObjects
);

// Get object metadata
router.get(
  '/objects/:key/metadata',
  controller.getObjectMetadata
);

// Delete object
router.delete(
  '/objects/:key',
  controller.deleteObject
);

module.exports = router;
