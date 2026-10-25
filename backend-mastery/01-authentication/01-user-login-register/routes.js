const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

/**
 * POST /auth/register - Register a new user
 */
router.post('/register', 
  middleware.validateRequest(schema.registerSchema),
  controller.register
);

/**
 * POST /auth/login - Login user
 */
router.post('/login',
  middleware.validateRequest(schema.loginSchema),
  controller.login
);

/**
 * GET /auth/me - Get current user
 */
router.get('/me',
  middleware.authenticate,
  controller.getCurrentUser
);

/**
 * POST /auth/logout - Logout user
 */
router.post('/logout',
  middleware.authenticate,
  controller.logout
);

/**
 * PUT /auth/profile - Update user profile
 */
router.put('/profile',
  middleware.authenticate,
  middleware.validateRequest(schema.updateProfileSchema),
  controller.updateProfile
);

module.exports = router;
