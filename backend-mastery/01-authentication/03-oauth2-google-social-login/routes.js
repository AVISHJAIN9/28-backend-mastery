const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');

const router = express.Router();

/**
 * GET /auth/google/url - Get Google OAuth authorization URL
 */
router.get('/google/url', controller.getAuthUrl);

/**
 * GET /auth/google/callback - Google OAuth callback endpoint
 */
router.get('/google/callback', 
  middleware.rateLimit(20, 5 * 60 * 1000),
  controller.handleCallback
);

/**
 * GET /me - Get current user profile
 */
router.get('/me',
  middleware.authenticate,
  controller.getCurrentUser
);

/**
 * POST /logout - Logout user
 */
router.post('/logout',
  middleware.authenticate,
  controller.logout
);

/**
 * POST /link-provider - Link additional OAuth provider
 */
router.post('/link-provider',
  middleware.authenticate,
  controller.linkProvider
);

/**
 * GET /providers - Get linked providers
 */
router.get('/providers',
  middleware.authenticate,
  controller.getLinkedProviders
);

module.exports = router;

