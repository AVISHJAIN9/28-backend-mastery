const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

/**
 * POST /keys/register - Register new user
 */
router.post('/register',
  middleware.validateRequest(schema.registerSchema),
  controller.register
);

/**
 * POST /keys/verify - Verify JWT token
 */
router.post('/verify',
  middleware.validateRequest(schema.verifySchema),
  controller.verifyToken
);

/**
 * GET /keys/active - Get current active key info
 */
router.get('/active',
  controller.getActiveKey
);

/**
 * GET /keys/public - Get all public keys (non-authenticated)
 * Used by clients to validate tokens
 */
router.get('/public',
  controller.getPublicKeys
);

/**
 * POST /keys/rotate - Rotate signing keys
 * Should be admin-only in production
 */
router.post('/rotate',
  middleware.logJwtOperation('KEY_ROTATION'),
  controller.rotateKeys
);

/**
 * GET /keys/history - Get key rotation history
 */
router.get('/history',
  controller.getKeyRotationHistory
);

/**
 * GET /keys/audit - Get token validation audit log
 */
router.get('/audit',
  controller.getAuditLog
);

module.exports = router;
