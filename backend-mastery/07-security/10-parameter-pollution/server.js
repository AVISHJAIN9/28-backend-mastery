const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4010;

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

// VULNERABLE: Takes first duplicate parameter (differs from WAF)
app.get('/api/vulnerable/filter', (req, res) => {
  // Express by default takes first param value
  const page = req.query.page; // If page=1&page=999, takes '1'
  const limit = req.query.limit;
  
  logger.warn('Parameter pollution - using first value', { page, limit });
  res.json({ page: parseInt(page) || 1, limit: parseInt(limit) || 10 });
});

// SECURE: Reject if duplicate parameters detected
app.get('/api/secure/filter', verifyToken, (req, res) => {
  // Check for duplicate params
  const queryString = req.url.split('?')[1] || '';
  const params = new URLSearchParams(queryString);
  
  const allParams = queryString.split('&');
  const paramNames = allParams.map(p => p.split('=')[0]);
  const hasDuplicates = paramNames.length !== new Set(paramNames).size;
  
  if (hasDuplicates) {
    logger.warn('Duplicate parameters detected - potential attack', { user: req.user.id });
    return res.status(400).json({ error: 'Duplicate parameters not allowed' });
  }
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }
  
  res.json({ page, limit });
});

// Vulnerable search with parameter confusion
app.get('/api/vulnerable/search', (req, res) => {
  const query = req.query.q;
  const sort = req.query.sort; // Could be bypassed with duplicates
  res.json({ query, sort, results: [] });
});

// Secure search
app.get('/api/secure/search', verifyToken, (req, res) => {
  const queryString = req.url.split('?')[1] || '';
  const allParams = queryString.split('&');
  const paramNames = allParams.map(p => p.split('=')[0]);
  
  if (paramNames.length !== new Set(paramNames).size) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  const query = req.query.q;
  const sort = req.query.sort;
  
  if (!['name', 'date', 'relevance'].includes(sort)) {
    return res.status(400).json({ error: 'Invalid sort' });
  }
  
  res.json({ query, sort, results: [] });
});

app.get('/api/lab/info', (req, res) => {
  res.json({ 
    vulnerability: 'Parameter pollution',
    example: 'page=1&page=999 may bypass WAF'
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`Parameter Pollution module on port ${PORT}`);
  console.log(`🔀 Module 10 running on http://localhost:${PORT}`);
});

module.exports = app;
