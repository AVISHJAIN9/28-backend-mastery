const express = require('express');
const {
  sendTransactionalEmail,
  sendBulkEmails,
  sendTemplateEmail,
  getAuditLog,
  getAllAuditLogs,
  getAvailableTemplates,
  getAvailableProviders,
  resendFailedEmail
} = require('./controller');

const { validateEmailInput, emailRateLimiter } = require('./middleware');

const router = express.Router();

// ==================== Email Sending Routes ====================

// POST /api/email/send - Send single email
router.post(
  '/email/send',
  validateEmailInput,
  emailRateLimiter,
  sendTransactionalEmail
);

// POST /api/email/bulk - Send bulk emails
router.post(
  '/email/bulk',
  emailRateLimiter,
  sendBulkEmails
);

// POST /api/email/template - Send from template
router.post(
  '/email/template',
  emailRateLimiter,
  sendTemplateEmail
);

// ==================== Audit & Monitoring Routes ====================

// GET /api/email/audit/:id - Get specific audit log
router.get('/email/audit/:id', getAuditLog);

// GET /api/email/audits - Get all audit logs (with optional filters)
// Query: ?status=sent&template=welcome
router.get('/email/audits', getAllAuditLogs);

// POST /api/email/resend/:auditId - Resend failed email
router.post('/email/resend/:auditId', emailRateLimiter, resendFailedEmail);

// ==================== Configuration Routes ====================

// GET /api/email/templates - Get available templates
router.get('/email/templates', getAvailableTemplates);

// GET /api/email/providers - Get available providers
router.get('/email/providers', getAvailableProviders);

module.exports = router;

