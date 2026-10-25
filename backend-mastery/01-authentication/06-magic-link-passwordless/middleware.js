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

exports.rateLimit = (attempts = 5) => {
  const map = new Map();
  return (req, res, next) => {
    const key = req.body?.email || req.ip;
    const count = map.get(key) || 0;
    if (count >= attempts) {
      return res.status(429).json({ error: 'Too many attempts' });
    }
    map.set(key, count + 1);
    setTimeout(() => map.delete(key), 15 * 60 * 1000);
    next();
  };
};

