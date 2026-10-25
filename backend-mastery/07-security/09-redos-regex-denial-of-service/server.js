const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4009;

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

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    req.user = token ? jwt.verify(token, JWT_SECRET) : { id: 'anonymous' };
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// VULNERABLE: ReDoS - catastrophic regex backtracking
app.post('/api/vulnerable/validate-email', (req, res) => {
  const { email } = req.body;
  
  // Vulnerable regex with excessive backtracking
  const VULNERABLE_REGEX = /^([a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*)+@([a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*)+\\.([a-zA-Z]{2,})+$/;
  
  try {
    const start = Date.now();
    const result = VULNERABLE_REGEX.test(email);
    const duration = Date.now() - start;
    
    logger.warn('Regex validation', { email: email.substring(0,25 ), duration });
    res.json({ valid: result, duration });
  } catch (e) {
    res.status(500).json({ error: 'Validation timeout' });
  }
});

// SECURE: Simple regex or built-in validation
app.post('/api/secure/validate-email', verifyToken, (req, res) => {
  const { email } = req.body;
  
  // Simple, safe regex without backtracking risk
  const SAFE_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  
  try {
    const start = Date.now();
    const result = SAFE_REGEX.test(email);
    const duration = Date.now() - start;
    
    logger.info('Safe email validation', { duration });
    res.json({ valid: result, duration });
  } catch (e) {
    res.status(500).json({ error: 'Validation error' });
  }
});

// VULNERABLE: Username validation with ReDoS
app.post('/api/vulnerable/validate-username', (req, res) => {
  const { username } = req.body;
  const VULNERABLE = /^(a+)+b$/; // Classic ReDoS pattern
  
  try {
    const start = Date.now();
    const result = VULNERABLE.test(username);
    const duration = Date.now() - start;
    res.json({ valid: result, duration });
  } catch (e) {
    res.json({ error: 'Timeout: ReDoS detected' });
  }
});

// SECURE: Safe username validation
app.post('/api/secure/validate-username', verifyToken, (req, res) => {
  const { username } = req.body;
  const SAFE = /^[a-zA-Z0-9_-]{3,20}$/;
  
  const start = Date.now();
  const result = SAFE.test(username);
  const duration = Date.now() - start;
  
  res.json({ valid: result, duration });
});

app.get('/api/lab/test', (req, res) => {
  res.json({ 
    test: 'Try: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaac on vulnerable',
    description: 'This will cause exponential backtracking'
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`ReDoS module on port ${PORT}`);
  console.log(`⏱️  Module 09 running on http://localhost:${PORT}`);
});

module.exports = app;
