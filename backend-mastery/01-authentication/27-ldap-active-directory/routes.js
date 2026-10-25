const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

// Session tokens shared across middleware
const sessionTokens = new Map();

/**
 * POST /ldap/login - Login with LDAP credentials
 */
router.post('/login',
  middleware.validateRequest(schema.loginSchema),
  middleware.logLdapOperation('LOGIN_ATTEMPT'),
  controller.login
);

/**
 * POST /ldap/verify-token - Verify session token
 */
router.post('/verify-token',
  controller.verifyToken
);

/**
 * GET /ldap/search - Search LDAP users
 */
router.get('/search',
  middleware.ldapAuth(sessionTokens),
  controller.searchUsers
);

/**
 * GET /ldap/me - Get current user info
 */
router.get('/me',
  middleware.ldapAuth(sessionTokens),
  middleware.logLdapOperation('GET_USER_INFO'),
  controller.getCurrentUser
);

/**
 * GET /ldap/groups - Get user's LDAP groups
 */
router.get('/groups',
  middleware.ldapAuth(sessionTokens),
  controller.getUserGroups
);

/**
 * POST /ldap/change-password - Change password
 */
router.post('/change-password',
  middleware.ldapAuth(sessionTokens),
  middleware.validateRequest(schema.changePasswordSchema),
  controller.changePassword
);

/**
 * POST /ldap/logout - Logout user
 */
router.post('/logout',
  middleware.ldapAuth(sessionTokens),
  controller.logout
);

module.exports = router;
