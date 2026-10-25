const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

router.post('/register',
  middleware.validateRequest(schema.registerSchema),
  controller.register
);

router.post('/login',
  middleware.validateRequest(schema.loginSchema),
  controller.login
);

router.post('/mfa/setup',
  middleware.authenticate,
  controller.setupMFA
);

router.post('/mfa/verify',
  middleware.validateRequest(schema.mfaVerifySchema),
  controller.verifyMFA
);

router.post('/mfa/backup-codes',
  middleware.authenticate,
  controller.getBackupCodes
);

router.get('/me',
  middleware.authenticate,
  middleware.requireMFA,
  controller.getCurrentUser
);

module.exports = router;

