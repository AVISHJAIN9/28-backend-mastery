const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

/**
 * POST /revoke - Revoke a token
 */
router.post('/revoke',
  middleware.validateRequest(schema.revokeSchema),
  controller.revokeToken
);

/**
 * POST /logout - Logout user (revoke current token)
 */
router.post('/logout',
  controller.logout
);

/**
 * GET /revocation-list - Get revoked tokens
 */
router.get('/revocation-list',
  controller.getRevocationList
);

/**
 * POST /cleanup - Cleanup expired tokens
 */
router.post('/cleanup',
  controller.cleanupExpiredTokens
);

module.exports = router;
