/**
 * Schema Validation
 * Validates requests using simple schema patterns
 */

const validateUploadRequest = (body) => {
  const errors = [];

  if (!body.fileName || typeof body.fileName !== 'string') {
    errors.push('fileName is required and must be a string');
  }

  if (!body.fileType || typeof body.fileType !== 'string') {
    errors.push('fileType is required and must be a string');
  }

  if (!body.fileSize || typeof body.fileSize !== 'number') {
    errors.push('fileSize is required and must be a number');
  }

  if (body.fileSize > 100 * 1024 * 1024) {
    errors.push('File size must be less than 100MB');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateDownloadRequest = (params) => {
  const errors = [];

  if (!params.key || typeof params.key !== 'string') {
    errors.push('key is required and must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateDeleteRequest = (params) => {
  const errors = [];

  if (!params.key || typeof params.key !== 'string') {
    errors.push('key is required and must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateUploadRequest,
  validateDownloadRequest,
  validateDeleteRequest
};
