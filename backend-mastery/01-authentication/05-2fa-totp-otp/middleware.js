const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization' });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

exports.validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(e => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req.body = value;
    next();
  };
};

exports.requireMFA = (req, res, next) => {
  if (!req.user.mfaVerified) {
    return res.status(403).json({ error: 'MFA verification required' });
  }
  next();
};

