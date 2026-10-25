const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

/**
 * POST /auth/register - Register a new user
 * Returns access and refresh tokens
 */
router.post('/register',
  middleware.rateLimit(5, 15 * 60 * 1000),
  middleware.validateRequest(schema.registerSchema),
  controller.register
);

/**
 * POST /auth/login - Login user
 * Returns access and refresh tokens
 */
router.post('/login',
  middleware.rateLimit(5, 15 * 60 * 1000),
  middleware.validateRequest(schema.loginSchema),
  controller.login
);

/**
 * POST /auth/refresh - Refresh access token
 * Takes refresh token and returns new access token
 */
router.post('/refresh',
  middleware.validateRequest(schema.refreshTokenSchema),
  controller.refreshToken
);

/**
 * GET /auth/me - Get current user profile
 * Requires valid access token
 */
router.get('/me',
  middleware.authenticate,
  controller.getCurrentUser
);

/**
 * POST /auth/logout - Logout user
 * Invalidates the refresh token
 */
router.post('/logout',
  middleware.authenticate,
  middleware.validateRequest(schema.logoutSchema),
  controller.logout
);

/**
 * POST /auth/logout-all - Logout from all devices
 * Revokes all refresh tokens for the user
 */
router.post('/logout-all',
  middleware.authenticate,
  controller.revokeAllTokens
);

/**
 * GET /auth/sessions - Get all active sessions
 * Lists all devices/sessions with valid refresh tokens
 */
router.get('/sessions',
  middleware.authenticate,
  controller.getActiveSessions
);

module.exports = router;

