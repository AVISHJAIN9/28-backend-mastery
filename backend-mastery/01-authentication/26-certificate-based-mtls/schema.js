const Joi = require('joi');

exports.registerCertificateSchema = Joi.object({
  clientName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Client name must be at least 2 characters',
      'string.max': 'Client name cannot exceed 100 characters',
      'any.required': 'Client name is required'
    }),
  organizationUnit: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Organization unit must be at least 2 characters',
      'string.max': 'Organization unit cannot exceed 100 characters'
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Invalid email format'
    }),
  metadata: Joi.object()
    .optional()
    .messages({
      'object.base': 'Metadata must be an object'
    })
});

exports.verifyTokenSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Token is required'
    })
});

exports.revokeCertificateSchema = Joi.object({
  thumbprint: Joi.string()
    .required()
    .length(64)
    .messages({
      'string.length': 'Invalid thumbprint format',
      'any.required': 'Thumbprint is required'
    })
});

exports.certificateFilterSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'revoked', 'expired')
    .optional(),
  clientId: Joi.string()
    .guid()
    .optional()
});
