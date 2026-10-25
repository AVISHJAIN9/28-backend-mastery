const crypto = require('crypto');

// Store authorized thumbprints
const authorizedClients = new Map();

/**
 * Get certificate thumbprint
 */
const getCertificateThumbprint = (cert) => {
  return crypto
    .createHash('sha256')
    .update(cert.raw)
    .digest('hex');
};

/**
 * mTLS certificate authentication middleware
 * Verifies the client certificate in the TLS handshake
 */
exports.mtlsAuth = (req, res, next) => {
  try {
    const cert = req.socket.getPeerCertificate();

    if (!cert || Object.keys(cert).length === 0) {
      return res.status(401).json({ 
        error: 'Client certificate required' 
      });
    }

    // Check if certificate is valid
    if (req.socket.authorizationError) {
      return res.status(403).json({ 
        error: 'Certificate validation failed',
        details: req.socket.authorizationError 
      });
    }

    const thumbprint = getCertificateThumbprint(cert);
    req.clientCertificate = cert;
    req.clientThumbprint = thumbprint;

    next();
  } catch (error) {
    console.error('mTLS middleware error:', error);
    return res.status(500).json({ 
      error: 'Certificate validation error' 
    });
  }
};

/**
 * Validate certificate expiration
 */
exports.validateCertificateExpiration = (req, res, next) => {
  try {
    const cert = req.socket.getPeerCertificate();

    if (!cert) {
      return res.status(401).json({ 
        error: 'No certificate' 
      });
    }

    const validTo = new Date(cert.valid_to);
    if (validTo < new Date()) {
      return res.status(403).json({ 
        error: 'Certificate has expired',
        expiredAt: validTo 
      });
    }

    next();
  } catch (error) {
    console.error('Certificate expiration check error:', error);
    return res.status(500).json({ 
      error: 'Expiration check failed' 
    });
  }
};

/**
 * Verify session token
 */
exports.verifySessionToken = (sessionTokens) => {
  return (req, res, next) => {
    const token = req.headers['x-session-token'];

    if (!token) {
      return res.status(401).json({ 
        error: 'Session token required in x-session-token header' 
      });
    }

    if (!sessionTokens.has(token)) {
      return res.status(401).json({ 
        error: 'Invalid or expired session token' 
      });
    }

    const session = sessionTokens.get(token);

    // Check expiration
    if (session.expiresAt < new Date()) {
      sessionTokens.delete(token);
      return res.status(401).json({ 
        error: 'Session token expired' 
      });
    }

    req.sessionToken = token;
    req.clientId = session.clientId;
    req.clientThumbprint = session.thumbprint;

    next();
  };
};

/**
 * Validation middleware for request bodies
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
 * Error handling middleware
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

/**
 * Log certificate access
 */
exports.logCertificateAccess = (req, res, next) => {
  const cert = req.socket.getPeerCertificate();
  if (cert) {
    console.log(`[${new Date().toISOString()}] Certificate Auth: ${cert.subject?.CN} - ${req.method} ${req.path}`);
  }
  next();
};
