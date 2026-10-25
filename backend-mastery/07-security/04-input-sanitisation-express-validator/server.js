const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4004;

app.use(helmet());
app.use(cors());

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const comments = {
  1: { id: 1, text: 'Great post!', author: 'alice', unsafe: false },
  2: { id: 2, text: '<img src=x onerror="alert(\'XSS\')">', author: 'bob', unsafe: true }
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// VULNERABLE: No input sanitization
app.post('/api/vulnerable/comments', (req, res) => {
  const { text, author } = req.body;
  const comment = { id: Math.random(), text, author, unsafe: true }; // Stores raw HTML!
  logger.warn('Unvalidated input stored', { text });
  res.json(comment);
});

// SECURE: Validate and sanitize all inputs
app.post('/api/secure/comments', verifyToken, [
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Text must be 1-500 characters')
    .escape(), // Escapes HTML entities
  body('author')
    .trim()
    .isLength({ min: 1, max: 50 })
    .isAlphanumeric()
    .withMessage('Author must be alphanumeric')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', { errors: errors.array() });
    return res.status(400).json({ errors: errors.array() });
  }
  const comment = { id: Math.random(), text: req.body.text, author: req.body.author, safe: true };
  logger.info('Safe comment created', { authorId: req.user.id });
  res.json(comment);
});

// VULNERABLE: No length limits
app.post('/api/vulnerable/search', (req, res) => {
  const query = req.body.query; // Unlimited length!
  logger.warn('Unlimited input', { length: query?.length });
  res.json({ results: [] });
});

// SECURE: Input length validation
app.post('/api/secure/search', [
  body('query')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Query must be 1-100 chars')
    .matches(/^[a-zA-Z0-9\\s-]+$/)
    .withMessage('Only alphanumeric allowed')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  res.json({ results: [], query: req.body.query });
});

app.post('/api/secure/login', (req, res) => {
  const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/api/lab/comments', (req, res) => {
  res.json(Object.values(comments));
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`Input Sanitization module on port ${PORT}`);
  console.log(`📊 Module 04 running on http://localhost:${PORT}`);
});

module.exports = app;
