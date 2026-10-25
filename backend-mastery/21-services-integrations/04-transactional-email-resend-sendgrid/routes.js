const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validateRequest, selectEmailProvider, limitEmailsPerUser } = require('./middleware');
const { emailSchema, verificationEmailSchema, receiptEmailSchema, batchEmailSchema, emailTemplateSchema } = require('./schema');

// ==================== Email Routes ====================

router.post(
  '/send',
  validateRequest(emailSchema),
  selectEmailProvider,
  limitEmailsPerUser(5),
  controller.sendEmail
);

router.post(
  '/send/verification',
  validateRequest(verificationEmailSchema),
  selectEmailProvider,
  limitEmailsPerUser(3),
  controller.sendVerificationEmail
);

router.post(
  '/verify',
  controller.verifyEmailCode
);

router.post(
  '/send/receipt',
  validateRequest(receiptEmailSchema),
  selectEmailProvider,
  controller.sendReceiptEmail
);

router.post(
  '/send/batch',
  validateRequest(batchEmailSchema),
  selectEmailProvider,
  controller.sendBatchEmail
);

// ==================== Template Routes ====================

router.post(
  '/templates',
  validateRequest(emailTemplateSchema),
  controller.createTemplate
);

router.get('/templates', controller.listTemplates);

// ==================== Logging Routes ====================

router.get('/logs', controller.getEmailLogs);

module.exports = router;
