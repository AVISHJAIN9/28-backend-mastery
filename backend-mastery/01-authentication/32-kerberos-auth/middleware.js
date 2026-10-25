import jwt from 'jsonwebtoken';
import Joi from 'joi';

const validateRequest = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.validatedBody = value;
  next();
};

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    req.user = jwt.verify(token, process.env.JWT_SECRET || 'jwt-secret');
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default {
  validateRequest,
  authenticate
};
