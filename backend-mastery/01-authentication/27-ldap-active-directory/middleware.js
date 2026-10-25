const crypto = require('crypto');

/**
 * LDAP authentication middleware
 */
exports.ldapAuth = (sessionTokens) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization header required'
      });
    }

    const token = authHeader.substring(7);

    if (!sessionTokens.has(token)) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    const session = sessionTokens.get(token);

    // Check expiration
    if (session.expiresAt < new Date()) {
      sessionTokens.delete(token);
      return res.status(401).json({
        error: 'Token expired'
      });
    }

    req.userId = session.userId;
    req.username = session.username;
    req.userDn = session.dn;
    req.sessionToken = token;

    next();
  };
};

/**
 * Validate request body
 */
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }
    req.validatedData = value;
    next();
  };
};

/**
 * Check user is in specific LDAP group
 */
exports.requireGroup = (groupName) => {
  return (req, res, next) => {
    // This would check user's groups
    // Implementation depends on group storage
    next();
  };
};

/**
 * Error handler
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

/**
 * Log LDAP operations
 */
exports.logLdapOperation = (operation) => {
  return (req, res, next) => {
    console.log(`[LDAP] ${operation} - User: ${req.username || 'anonymous'}`);
    next();
  };
};
