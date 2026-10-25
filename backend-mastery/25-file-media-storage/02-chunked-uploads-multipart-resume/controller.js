require('dotenv').config();
const AWS = require('aws-sdk');
const logger = require('./logger');
const { validateData, initiateUploadSchema, uploadChunkSchema, completeUploadSchema, abortUploadSchema, listChunksSchema } = require('./schema');

// ==================== AWS S3 CONFIGURATION ====================

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3ForcePathStyle: false,
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE_BYTES || 5242880);
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_BYTES || 1073741824);

// ==================== IN-MEMORY STORE FOR UPLOAD METADATA ====================

// Production: Use MongoDB or DynamoDB
const uploadMetadataStore = new Map();

/**
 * Store upload metadata
 */
function storeUploadMetadata(uploadId, metadata) {
  uploadMetadataStore.set(uploadId, {
    ...metadata,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

/**
 * Retrieve upload metadata
 */
function getUploadMetadata(uploadId) {
  return uploadMetadataStore.get(uploadId);
}

/**
 * Update upload metadata
 */
function updateUploadMetadata(uploadId, updates) {
  const metadata = uploadMetadataStore.get(uploadId);
  if (metadata) {
    uploadMetadataStore.set(uploadId, {
      ...metadata,
      ...updates,
      updatedAt: new Date()
    });
  }
}

/**
 * Delete upload metadata
 */
function deleteUploadMetadata(uploadId) {
  uploadMetadataStore.delete(uploadId);
}

// ==================== CONTROLLER METHODS ====================

/**
 * Health check endpoint
 */
const healthCheck = (req, res) => {
  logger.debug('Health check requested');
  res.json({
    status: 'healthy',
    module: '02-chunked-uploads-multipart-resume',
    s3Connected: !!BUCKET_NAME,
    timestamp: new Date().toISOString(),
    config: {
      chunkSize: CHUNK_SIZE,
      maxFileSize: MAX_FILE_SIZE
    }
  });
};

/**
 * Initiate multipart upload
 * POST /api/initiate
 * Returns: { uploadId, key }
 */
const initiateUpload = async (req, res, next) => {
  try {
    const { error, value } = validateData(req.body, initiateUploadSchema);

    if (error) {
      logger.warn('Initiate upload validation failed', { error: error.message });
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }

    const { filename, fileSize, mimeType, metadata = {} } = value;

    logger.info('Initiating multipart upload', {
      filename,
      fileSize,
      mimeType,
      metadataKeys: Object.keys(metadata)
    });

    // Generate unique key for S3
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const key = `uploads/${timestamp}-${random}/${filename}`;

    // Sanitize filename for metadata
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Initiate multipart upload with S3
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
      Metadata: {
        'original-filename': sanitizedFilename,
        'file-size': fileSize.toString(),
        'user-metadata': JSON.stringify(metadata).substring(0, 2000) // CloudFront limit
      }
    };

    const multipartUpload = await s3.createMultipartUpload(params).promise();
    const uploadId = multipartUpload.UploadId;

    // Store metadata for tracking
    storeUploadMetadata(uploadId, {
      uploadId,
      key,
      filename: sanitizedFilename,
      fileSize,
      mimeType,
      metadata,
      uploadedChunks: new Map(),
      status: 'active'
    });

    logger.info('Multipart upload initiated', {
      uploadId,
      key,
      filename
    });

    res.status(201).json({
      success: true,
      uploadId,
      key,
      filename,
      fileSize,
      chunkSize: CHUNK_SIZE,
      totalChunks: Math.ceil(fileSize / CHUNK_SIZE),
      expiresIn: '24 hours'
    });
  } catch (error) {
    logger.error('Initiate upload failed', { error: error.message, code: error.code });
    next(error);
  }
};

/**
 * Upload a single chunk
 * PUT /api/upload-chunk?uploadId=...&chunkNumber=...
 * Returns: { etag, chunkNumber }
 */
const uploadChunk = async (req, res, next) => {
  try {
    const { uploadId, chunkNumber } = req.query;

    // Validate query parameters
    const { error, value } = validateData({ uploadId, chunkNumber: parseInt(chunkNumber) }, uploadChunkSchema);

    if (error) {
      logger.warn('Upload chunk validation failed', { error: error.message });
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }

    const metadata = getUploadMetadata(uploadId);
    if (!metadata) {
      logger.warn('Upload ID not found', { uploadId });
      return res.status(404).json({
        error: 'Upload ID not found',
        uploadId
      });
    }

    logger.debug('Uploading chunk', {
      uploadId,
      chunkNumber: parseInt(chunkNumber),
      contentLength: req.contentLength
    });

    const params = {
      Bucket: BUCKET_NAME,
      Key: metadata.key,
      UploadId: uploadId,
      PartNumber: parseInt(chunkNumber),
      Body: req.body // This should be the raw binary data
    };

    const result = await s3.uploadPart(params).promise();
    const etag = result.ETag;

    // Store ETag for completion
    metadata.uploadedChunks.set(parseInt(chunkNumber), { etag, uploadedAt: new Date() });
    updateUploadMetadata(uploadId, { uploadedChunks: metadata.uploadedChunks });

    logger.info('Chunk uploaded successfully', {
      uploadId,
      chunkNumber: parseInt(chunkNumber),
      etag
    });

    res.json({
      success: true,
      uploadId,
      chunkNumber: parseInt(chunkNumber),
      etag,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Upload chunk failed', { error: error.message, code: error.code });
    next(error);
  }
};

/**
 * List uploaded chunks
 * GET /api/list-chunks?uploadId=...
 * Returns: { chunks: [{chunkNumber, etag, uploadedAt}] }
 */
const listChunks = async (req, res, next) => {
  try {
    const { uploadId } = req.query;

    const { error, value } = validateData({ uploadId }, listChunksSchema);

    if (error) {
      logger.warn('List chunks validation failed', { error: error.message });
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }

    const metadata = getUploadMetadata(uploadId);
    if (!metadata) {
      logger.warn('Upload ID not found', { uploadId });
      return res.status(404).json({
        error: 'Upload ID not found',
        uploadId
      });
    }

    const chunks = Array.from(metadata.uploadedChunks.entries()).map(([chunkNumber, data]) => ({
      chunkNumber,
      etag: data.etag,
      uploadedAt: data.uploadedAt
    }));

    logger.debug('Listed chunks', {
      uploadId,
      totalChunks: chunks.length
    });

    res.json({
      success: true,
      uploadId,
      chunks: chunks.sort((a, b) => a.chunkNumber - b.chunkNumber),
      totalChunksUploaded: chunks.length,
      expectedChunks: Math.ceil(metadata.fileSize / CHUNK_SIZE)
    });
  } catch (error) {
    logger.error('List chunks failed', { error: error.message });
    next(error);
  }
};

/**
 * Complete multipart upload
 * POST /api/complete-upload
 * Requires: { uploadId, chunks: [{chunkNumber, etag}] }
 * Returns: { fileUrl, fileSize }
 */
const completeUpload = async (req, res, next) => {
  try {
    const { error, value } = validateData(req.body, completeUploadSchema);

    if (error) {
      logger.warn('Complete upload validation failed', { error: error.message });
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }

    const { uploadId, chunks } = value;

    const metadata = getUploadMetadata(uploadId);
    if (!metadata) {
      logger.warn('Upload ID not found', { uploadId });
      return res.status(404).json({
        error: 'Upload ID not found',
        uploadId
      });
    }

    // Sort chunks by number
    const sortedChunks = chunks.sort((a, b) => a.chunkNumber - b.chunkNumber);

    // Prepare parts for S3
    const parts = sortedChunks.map((chunk, index) => ({
      ETag: chunk.etag,
      PartNumber: index + 1
    }));

    logger.info('Completing multipart upload', {
      uploadId,
      totalChunks: parts.length,
      fileSize: metadata.fileSize
    });

    const params = {
      Bucket: BUCKET_NAME,
      Key: metadata.key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
      }
    };

    const result = await s3.completeMultipartUpload(params).promise();

    logger.info('Multipart upload completed', {
      uploadId,
      key: metadata.key,
      etag: result.ETag,
      location: result.Location
    });

    // Generate presigned URL for download (valid for 24 hours)
    const downloadUrl = s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: metadata.key,
      Expires: 86400 // 24 hours
    });

    // Update metadata
    updateUploadMetadata(uploadId, {
      status: 'completed',
      completedAt: new Date(),
      s3Etag: result.ETag,
      location: result.Location
    });

    res.json({
      success: true,
      uploadId,
      filename: metadata.filename,
      fileSize: metadata.fileSize,
      mimeType: metadata.mimeType,
      key: metadata.key,
      etag: result.ETag,
      location: result.Location,
      downloadUrl,
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Complete upload failed', { error: error.message, code: error.code });
    next(error);
  }
};

/**
 * Abort/Cancel multipart upload
 * DELETE /api/abort-upload
 * Requires: { uploadId }
 * Returns: { success: true }
 */
const abortUpload = async (req, res, next) => {
  try {
    const { error, value } = validateData(req.body, abortUploadSchema);

    if (error) {
      logger.warn('Abort upload validation failed', { error: error.message });
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
    }

    const { uploadId } = value;

    const metadata = getUploadMetadata(uploadId);
    if (!metadata) {
      logger.warn('Upload ID not found', { uploadId });
      return res.status(404).json({
        error: 'Upload ID not found',
        uploadId
      });
    }

    logger.info('Aborting multipart upload', {
      uploadId,
      key: metadata.key
    });

    const params = {
      Bucket: BUCKET_NAME,
      Key: metadata.key,
      UploadId: uploadId
    };

    await s3.abortMultipartUpload(params).promise();

    // Delete metadata
    deleteUploadMetadata(uploadId);

    logger.info('Multipart upload aborted', { uploadId });

    res.json({
      success: true,
      uploadId,
      message: 'Upload canceled successfully'
    });
  } catch (error) {
    logger.error('Abort upload failed', { error: error.message, code: error.code });
    next(error);
  }
};

/**
 * Get upload status
 * GET /api/upload-status/:uploadId
 * Returns: { uploadId, status, uploadedChunks, totalChunks }
 */
const getUploadStatus = (req, res, next) => {
  try {
    const { uploadId } = req.params;

    if (!uploadId) {
      return res.status(400).json({
        error: 'Upload ID is required'
      });
    }

    const metadata = getUploadMetadata(uploadId);
    if (!metadata) {
      logger.warn('Upload ID not found', { uploadId });
      return res.status(404).json({
        error: 'Upload ID not found',
        uploadId
      });
    }

    const chunks = Array.from(metadata.uploadedChunks.keys()).sort((a, b) => a - b);
    const totalChunks = Math.ceil(metadata.fileSize / CHUNK_SIZE);

    res.json({
      success: true,
      uploadId,
      filename: metadata.filename,
      fileSize: metadata.fileSize,
      status: metadata.status,
      uploadedChunks: chunks,
      totalChunks,
      uploadProgress: Math.round((chunks.length / totalChunks) * 100),
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt
    });
  } catch (error) {
    logger.error('Get upload status failed', { error: error.message });
    next(error);
  }
};

// ==================== EXPORTS ====================

module.exports = {
  healthCheck,
  initiateUpload,
  uploadChunk,
  listChunks,
  completeUpload,
  abortUpload,
  getUploadStatus
};

