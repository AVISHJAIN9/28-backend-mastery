const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details,
      });
    }

    req.validatedBody = value;
    next();
  };
};

const rateLimitOTP = {};

const limitOtpAttempts = (maxAttempts = 3) => {
  return (req, res, next) => {
    const phone = req.validatedBody?.phoneNumber;
    if (!phone) return next();
    
    if (!rateLimitOTP[phone]) rateLimitOTP[phone] = { attempts: 0, lastAttempt: Date.now() };
    
    const timeSinceLastAttempt = Date.now() - rateLimitOTP[phone].lastAttempt;
    if (timeSinceLastAttempt > 300000 && rateLimitOTP[phone].attempts > 0) {
      rateLimitOTP[phone].attempts = 0;
    }
    
    if (rateLimitOTP[phone].attempts >= maxAttempts) {
      return res.status(429).json({ error: 'Too many attempts, try again later' });
    }
    
    rateLimitOTP[phone].attempts++;
    rateLimitOTP[phone].lastAttempt = Date.now();
    next();
  };
};

const errorHandler = (err, req, res, next) => {
  console.error('[Twilio Error]', err.message);
  res.status(500).json({ error: 'SMS service error' });
};

module.exports = {
  validateRequest,
  limitOtpAttempts,
  errorHandler,
};
