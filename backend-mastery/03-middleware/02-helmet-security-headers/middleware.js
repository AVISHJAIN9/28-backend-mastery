const helmet = require('helmet');

// ==================== Helmet Security Middleware ====================

/**
 * Helmet configuration for security headers
 * Includes: CSP, X-Frame-Options, X-Content-Type-Options, etc.
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'http://localhost:*'],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Stricter CSP for production
 */
const strictHelmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'no-referrer' },
  permissionsPolicy: {
    geolocation: [],
    microphone: [],
    camera: [],
  },
});

module.exports = { helmetMiddleware, strictHelmetMiddleware };
