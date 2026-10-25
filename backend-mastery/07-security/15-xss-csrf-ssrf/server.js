const express = require('express');
const helmet = require('helmet');
const csurf = require('csurf');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4015;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(cors());

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    req.user = token ? jwt.verify(token, JWT_SECRET) : { id: 'anonymous' };
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const comments = [];

// VULNERABLE: XSS - stores and returns unescaped HTML
app.post('/api/vulnerable/comments', (req, res) => {
  const { content } = req.body;
  const comment = { id: Math.random(), content, timestamp: new Date() };
  comments.push(comment);
  logger.warn('Unescaped HTML stored', { content: content.substring(0, 30) });
  res.json(comment);
});

// VULNERABLE: CSRF - No token validation
app.post('/api/vulnerable/transfer', (req, res) => {
  // No CSRF token check!
  const { amount, to } = req.body;
  logger.warn('Transfer without CSRF protection', { amount, to });
  res.json({ status: 'transferred', amount, to });
});

// VULNERABLE: SSRF in fetch
app.post('/api/vulnerable/webhook', (req, res) => {
  const { url } = req.body;
  // Allows any URL without validation
  logger.warn('SSRF risk: arbitrary URL', { url });
  res.json({ status: 'webhook registered', url });
});

// SECURE: XSS prevention - escape HTML
app.post('/api/secure/comments', verifyToken, (req, res) => {
  const { content } = req.body;
  
  // Escape HTML entities
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  const comment = { id: Math.random(), content: escaped, timestamp: new Date() };
  
  logger.info('Safe comment stored', { user: req.user.id });
  res.json(comment);
});

// SECURE: CSRF protection with token
app.post('/api/secure/transfer', verifyToken, (req, res) => {
  const { amount, to, csrf_token } = req.body;
  
  // Verify CSRF token (in real app, compare with session token)
  if (!csrf_token || csrf_token.length < 20) {
    logger.warn('CSRF token invalid', { user: req.user.id });
    return res.status(403).json({ error: 'CSRF token invalid' });
  }
  
  logger.info('Transfer with CSRF protection', { user: req.user.id, amount });
  res.json({ status: 'transferred', amount, to });
});

// SECURE: SSRF protection
app.post('/api/secure/webhook', verifyToken, (req, res) => {
  const { url } = req.body;
  
  const BLOCKED_PATTERNS = ['127.0.0.1', 'localhost', '192.168', '10.0', '172.16'];
  
  for (const pattern of BLOCKED_PATTERNS) {
    if (url.includes(pattern)) {
      logger.warn('SSRF blocked', { user: req.user.id, url });
      return res.status(403).json({ error: 'Invalid URL' });
    }
  }
  
  logger.info('Webhook registered safely', { user: req.user.id });
  res.json({ status: 'webhook registered', url });
});

// Get comments
app.get('/api/lab/comments', (req, res) => {
  res.json(comments);
});

app.post('/api/secure/login', (req, res) => {
  const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });
  const csrf_token = 'csrf_' + Math.random().toString(36).substring(2, 15);
  res.json({ token, csrf_token });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`XSS/CSRF/SSRF module on port ${PORT}`);
  console.log(`⚠️  Module 15 running on http://localhost:${PORT}`);
});

module.exports = app;
