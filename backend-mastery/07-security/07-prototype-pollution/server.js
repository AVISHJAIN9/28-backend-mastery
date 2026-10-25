const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4007;

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

// VULNERABLE: Deep merge without protection (prototype pollution)
app.post('/api/vulnerable/merge', (req, res) => {
  const target = {};
  const source = req.body;
  
  // Unsafe recursive merge
  const unsafeDeepMerge = (obj, src) => {
    for (let key in src) {
      if (src.hasOwnProperty(key)) {
        if (typeof src[key] === 'object') {
          obj[key] = unsafeDeepMerge(obj[key] || {}, src[key]);
        } else {
          obj[key] = src[key];
        }
      }
    }
    return obj;
  };
  
  unsafeDeepMerge(target, source);
  logger.warn('Prototype pollution risk', { payload: JSON.stringify(source).substring(0, 100) });
  res.json({ result: target });
});

// SECURE: Safe merge with prototype pollution protection
app.post('/api/secure/merge', verifyToken, (req, res) => {
  const target = {};
  const source = req.body;
  
  const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];
  
  const safeMerge = (obj, src, depth = 0) => {
    if (depth > 10) throw new Error('Max depth exceeded');
    for (let key in src) {
      if (FORBIDDEN_KEYS.includes(key)) {
        logger.warn('Prototype pollution attempt blocked', { key, user: req.user.id });
        continue;
      }
      if (src.hasOwnProperty(key)) {
        if (typeof src[key] === 'object' && src[key] !== null) {
          obj[key] = safeMerge(obj[key] || {}, src[key], depth + 1);
        } else {
          obj[key] = src[key];
        }
      }
    }
    return obj;
  };
  
  try {
    safeMerge(target, source);
    res.json({ result: target });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Test: Can attack detect prototype pollution?
app.get('/api/vulnerable/check', (req, res) => {
  const testObj = {};
  res.json({ isVulnerable: Object.prototype.polluted !== undefined });
});

app.get('/api/lab/test', (req, res) => {
  res.json({ test: 'Prototype pollution occurs via __proto__' });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`Prototype Pollution module on port ${PORT}`);
  console.log(`⚠️  Module 07 running on http://localhost:${PORT}`);
});

module.exports = app;
