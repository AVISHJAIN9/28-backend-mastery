const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

// Step 1: Authorization endpoint - Get auth code with PKCE challenge
router.post('/authorize',
  middleware.validateRequest(schema.authorizeSchema),
  controller.authorize
);

// Step 2: Token endpoint - Exchange code + verifier for tokens
router.post('/token',
  middleware.validateRequest(schema.authSchema),
  controller.authenticate
);

// Get current user
router.get('/me',
  middleware.verifyToken,
  controller.getCurrentUser
);

// Logout - blacklist token
router.post('/logout',
  middleware.verifyToken,
  controller.logout
);

module.exports = router;
