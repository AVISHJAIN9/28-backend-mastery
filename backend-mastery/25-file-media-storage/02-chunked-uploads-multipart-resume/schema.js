const Joi = require('joi');

// ==================== VALIDATION SCHEMAS ====================

/**
 * Schema for initiating a multipart upload
 * Required fields: filename, fileSize, mimeType, metadata (optional)
 */
const initiateUploadSchema = Joi.object({
  filename: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.max': 'Filename must be less than 255 characters',
      'any.required': 'Filename is required'
    }),
  
  fileSize: Joi.number()
    .integer()
    .min(1)
    .max(parseInt(process.env.MAX_FILE_SIZE_BYTES || 1073741824))
    .required()
    .messages({
      'number.min': 'File size must be at least 1 byte',
      'number.max': `File size must not exceed ${process.env.MAX_FILE_SIZE_BYTES || '1GB'}`,
      'any.required': 'File size is required'
    }),
  
  mimeType: Joi.string()
    .pattern(/^[\w\-+.]+\/[\w\-+.]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid MIME type format',
      'any.required': 'MIME type is required'
    }),
  
  metadata: Joi.object()
    .max(20)
    .optional()
    .messages({
      'object.max': 'Metadata cannot have more than 20 fields'
    })
});

/**
 * Schema for uploading a chunk
 * Required fields: uploadId, chunkNumber, chunkSize, content-length header validation
 */
const uploadChunkSchema = Joi.object({
  uploadId: Joi.string()
    .required()
    .messages({
      'any.required': 'Upload ID is required'
    }),
  
  chunkNumber: Joi.number()
    .integer()
    .min(1)
    .max(parseInt(process.env.MAX_CHUNKS || 10000))
    .required()
    .messages({
      'number.min': 'Chunk number must be at least 1',
      'number.max': `Chunk number must not exceed ${process.env.MAX_CHUNKS || '10000'}`,
      'any.required': 'Chunk number is required'
    })
});

/**
 * Schema for upload query parameters
 */
const uploadChunkQuerySchema = Joi.object({
  uploadId: Joi.string()
    .required()
    .messages({
      'any.required': 'Upload ID query parameter is required'
    }),
  
  chunkNumber: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.min': 'Chunk number must be at least 1',
      'any.required': 'Chunk number query parameter is required'
    })
});

/**
 * Schema for completing a multipart upload
 * Required fields: uploadId, chunks (array of {chunkNumber, etag})
 */
const completeUploadSchema = Joi.object({
  uploadId: Joi.string()
    .required()
    .messages({
      'any.required': 'Upload ID is required'
    }),
  
  chunks: Joi.array()
    .items(
      Joi.object({
        chunkNumber: Joi.number()
          .integer()
          .min(1)
          .required()
          .messages({
            'number.min': 'Chunk number must be at least 1',
            'any.required': 'Chunk number is required for each chunk'
          }),
        
        etag: Joi.string()
          .required()
          .messages({
            'any.required': 'ETag is required for each chunk'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one chunk is required',
      'any.required': 'Chunks array is required'
    })
});

/**
 * Schema for aborting a multipart upload
 * Required fields: uploadId
 */
const abortUploadSchema = Joi.object({
  uploadId: Joi.string()
    .required()
    .messages({
      'any.required': 'Upload ID is required'
    })
});

/**
 * Schema for listing uploaded chunks
 */
const listChunksSchema = Joi.object({
  uploadId: Joi.string()
    .required()
    .messages({
      'any.required': 'Upload ID is required'
    })
});

/**
 * Schema for query parameters - pagination and filtering
 */
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
});

/**
 * Helper function to validate data
 * @param {object} data - Data to validate
 * @param {object} schema - Joi schema
 * @returns {object} - { error, value }
 */
function validateData(data, schema) {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
}

// ==================== EXPORTS ====================

module.exports = {
  initiateUploadSchema,
  uploadChunkSchema,
  uploadChunkQuerySchema,
  completeUploadSchema,
  abortUploadSchema,
  listChunksSchema,
  paginationSchema,
  validateData
};

