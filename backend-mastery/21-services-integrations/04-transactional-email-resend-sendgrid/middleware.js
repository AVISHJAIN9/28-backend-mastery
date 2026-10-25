// ==================== Email Validation Middleware ====================

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details });
    }

    req.validatedBody = value;
    next();
  };
};

// ==================== Email Service Provider Middleware ====================

const selectEmailProvider = (req, res, next) => {
  // Random selection between Resend and SendGrid
  req.emailProvider = Math.random() > 0.5 ? 'resend' : 'sendgrid';
  next();
};

// ==================== Rate Limiting for Email ====================

const emailRateLimit = {};

const limitEmailsPerUser = (maxPerMinute = 5) => {
  return (req, res, next) => {
    const email = req.validatedBody?.to || 'unknown';
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    if (!emailRateLimit[email]) {
      emailRateLimit[email] = [];
    }

    // Remove old entries
    emailRateLimit[email] = emailRateLimit[email].filter(t => t > windowStart);

    if (emailRateLimit[email].length >= maxPerMinute) {
      return res.status(429).json({
        error: 'Too many emails sent in a short time',
        retryAfter: 60,
      });
    }

    emailRateLimit[email].push(now);
    next();
  };
};

// ==================== Error Handler ====================

const emailErrorHandler = (err, req, res, next) => {
  console.error('[Email Error]', err.message);

  if (err.code === 'INVALID_EMAIL') {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  if (err.code === 'EMAIL_ALREADY_SENT') {
    return res.status(409).json({ error: 'Email already sent recently' });
  }

  if (err.code === 'SERVICE_UNAVAILABLE') {
    return res.status(503).json({ error: 'Email service temporarily unavailable' });
  }

  res.status(500).json({ error: 'Failed to send email' });
};

module.exports = {
  validateRequest,
  selectEmailProvider,
  limitEmailsPerUser,
  emailErrorHandler,
  validateEmail,
};
