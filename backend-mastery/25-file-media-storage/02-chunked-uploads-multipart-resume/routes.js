const express = require('express');
const router = express.Router();
const {
  healthCheck,
  initiateUpload,
  uploadChunk,
  listChunks,
  completeUpload,
  abortUpload,
  getUploadStatus
} = require('./controller');
const {
  validateContentType,
  asyncHandler,
  uploadInitiationLimiter,
  handleUploadErrors,
  timeoutHandler
} = require('./middleware');

// ==================== HEALTH CHECK ====================

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', healthCheck);

// ==================== MULTIPART UPLOAD ROUTES ====================

/**
 * POST /api/initiate
 * Initiate a new multipart upload
 * Body: { filename, fileSize, mimeType, metadata }
 * Response: { uploadId, key, totalChunks, chunkSize }
 */
router.post(
  '/initiate',
  timeoutHandler,
  uploadInitiationLimiter,
  asyncHandler(initiateUpload)
);

/**
 * PUT /api/upload-chunk
 * Upload a single chunk
 * Query: uploadId, chunkNumber
 * Header: Content-Length, Content-Type: application/octet-stream
 * Body: Binary chunk data
 * Response: { etag, chunkNumber }
 */
router.put(
  '/upload-chunk',
  timeoutHandler,
  validateContentType,
  asyncHandler(uploadChunk)
);

/**
 * GET /api/list-chunks
 * List all uploaded chunks for an upload
 * Query: uploadId
 * Response: { chunks: [{chunkNumber, etag, uploadedAt}], totalChunksUploaded, expectedChunks }
 */
router.get(
  '/list-chunks',
  asyncHandler(listChunks)
);

/**
 * GET /api/upload-status/:uploadId
 * Get the status of an upload
 * Params: uploadId
 * Response: { status, uploadedChunks, totalChunks, uploadProgress }
 */
router.get(
  '/upload-status/:uploadId',
  asyncHandler(getUploadStatus)
);

/**
 * POST /api/complete-upload
 * Complete a multipart upload
 * Body: { uploadId, chunks: [{chunkNumber, etag}] }
 * Response: { filename, fileSize, downloadUrl, location }
 */
router.post(
  '/complete-upload',
  timeoutHandler,
  asyncHandler(completeUpload)
);

/**
 * DELETE /api/abort-upload
 * Abort/cancel a multipart upload
 * Body: { uploadId }
 * Response: { success: true }
 */
router.delete(
  '/abort-upload',
  asyncHandler(abortUpload)
);

// ==================== ERROR HANDLING ====================

/**
 * Handle upload-specific errors
 */
router.use(handleUploadErrors);

// ==================== EXPORTS ====================

module.exports = router;

