/**
 * Controller
 * Business logic for S3 operations
 */

const AWS = require('aws-sdk');
const schema = require('./schema');
const crypto = require('crypto');

// ==================== AWS S3 Configuration ====================

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// ==================== Generate Presigned URL for Upload ====================

const generateUploadPresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;

    // Validate request
    const validation = schema.validateUploadRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Generate unique key
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const key = `uploads/${timestamp}-${uniqueId}-${fileName}`;

    // Generate presigned URL for PUT request
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
      Expires: 3600 // 1 hour
    });

    res.json({
      success: true,
      presignedUrl,
      key,
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION,
      expiresIn: 3600,
      message: 'Presigned URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({
      error: 'Failed to generate presigned URL',
      details: error.message
    });
  }
};

// ==================== Generate Presigned URL for Download ====================

const generateDownloadPresignedUrl = async (req, res) => {
  try {
    const { key } = req.params;

    // Validate request
    const validation = schema.validateDownloadRequest(req.params);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Generate presigned URL for GET request
    const presignedUrl = s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: 3600 // 1 hour
    });

    res.json({
      success: true,
      presignedUrl,
      key,
      bucket: BUCKET_NAME,
      expiresIn: 3600,
      message: 'Download presigned URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({
      error: 'Failed to generate download presigned URL',
      details: error.message
    });
  }
};

// ==================== List Objects ====================

const listObjects = async (req, res) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: 'uploads/',
      MaxKeys: 100
    };

    const data = await s3.listObjectsV2(params).promise();

    const objects = (data.Contents || []).map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      etag: obj.ETag
    }));

    res.json({
      success: true,
      count: objects.length,
      objects,
      bucket: BUCKET_NAME
    });
  } catch (error) {
    console.error('Error listing objects:', error);
    res.status(500).json({
      error: 'Failed to list objects',
      details: error.message
    });
  }
};

// ==================== Get Object Metadata ====================

const getObjectMetadata = async (req, res) => {
  try {
    const { key } = req.params;

    // Validate request
    const validation = schema.validateDownloadRequest(req.params);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    const data = await s3.headObject(params).promise();

    res.json({
      success: true,
      metadata: {
        key,
        contentType: data.ContentType,
        contentLength: data.ContentLength,
        lastModified: data.LastModified,
        etag: data.ETag,
        storageClass: data.StorageClass
      }
    });
  } catch (error) {
    console.error('Error getting object metadata:', error);
    res.status(404).json({
      error: 'Object not found or metadata retrieval failed',
      details: error.message
    });
  }
};

// ==================== Delete Object ====================

const deleteObject = async (req, res) => {
  try {
    const { key } = req.params;

    // Validate request
    const validation = schema.validateDeleteRequest(req.params);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();

    res.json({
      success: true,
      message: 'Object deleted successfully',
      key,
      bucket: BUCKET_NAME
    });
  } catch (error) {
    console.error('Error deleting object:', error);
    res.status(500).json({
      error: 'Failed to delete object',
      details: error.message
    });
  }
};

// ==================== Health Check ====================

const healthCheck = async (req, res) => {
  try {
    // Try to access S3 to verify credentials
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();

    res.json({
      success: true,
      status: 'healthy',
      s3Status: 'connected',
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'S3 connection failed',
      details: error.message
    });
  }
};

module.exports = {
  generateUploadPresignedUrl,
  generateDownloadPresignedUrl,
  listObjects,
  getObjectMetadata,
  deleteObject,
  healthCheck
};
