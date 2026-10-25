/**
 * Schema Validation - Module 03: CDN CloudFront
 */

const validateCreateDistribution = (body) => {
  const errors = [];
  if (!body.s3BucketName || typeof body.s3BucketName !== 'string') {
    errors.push('s3BucketName is required');
  }
  return { isValid: errors.length === 0, errors };
};

const validateInvalidate = (body) => {
  const errors = [];
  if (!Array.isArray(body.paths) || body.paths.length === 0) {
    errors.push('paths array is required and non-empty');
  } else if (body.paths.some(p => !p.startsWith('/'))) {
    errors.push('All paths must start with /');
  }
  return { isValid: errors.length === 0, errors };
};

const validateGenerateCdnUrl = (body) => {
  const errors = [];
  if (!body.path || typeof body.path !== 'string') {
    errors.push('path is required');
  }
  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateCreateDistribution,
  validateInvalidate,
  validateGenerateCdnUrl
};
