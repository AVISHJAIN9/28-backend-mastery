const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req, res) => req.user?.id || req.ip,
  handler: (req, res) => res.status(429).json({ error: 'Rate limit exceeded' })
});

module.exports = { generalLimiter, loginLimiter, apiLimiter };
