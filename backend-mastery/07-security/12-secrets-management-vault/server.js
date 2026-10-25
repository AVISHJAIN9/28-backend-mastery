const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4012;

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

// VULNERABLE: Secrets in code
const VULNERABLE_API_KEY = 'sk_live_abc123def456ghi789';
const VULNERABLE_DB_PASS = 'mongodb_password_123';

const vault = {};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    req.user = token ? jwt.verify(token, JWT_SECRET) : { id: 'anonymous' };
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// VULNERABLE: Returns secrets from code
app.get('/api/vulnerable/api-key', (req, res) => {
  logger.warn('API key exposed');
  res.json({ api_key: VULNERABLE_API_KEY });
});

// VULNERABLE: Accepts secrets in request
app.post('/api/vulnerable/store-secret', (req, res) => {
  const { secret, name } = req.body;
  vault[name] = secret;
  logger.warn('Secret stored in memory', { name });
  res.json({ status: 'stored' });
});

// SECURE: Use .env for secrets
app.get('/api/secure/api-key', verifyToken, (req, res) => {
  const key = process.env.API_KEY || 'sk_live_secure_key';
  // Never expose full key, only last 4 chars
  const masked = '*'.repeat(key.length - 4) + key.slice(-4);
  logger.info('API key requested (masked)', { user: req.user.id });
  res.json({ api_key: masked });
});

// SECURE: Vault endpoint with proper auth
app.post('/api/secure/vault/store', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  
  const { secret, name } = req.body;
  
  if (!name || !secret) {
    return res.status(400).json({ error: 'Name and secret required' });
  }
  
  // In production, would encrypt and store securely
  vault[name] = Buffer.from(secret).toString('base64');
  
  logger.info('Secret stored securely', { user: req.user.id, name });
  res.json({ status: 'stored', name });
});

// SECURE: Retrieve encrypted secret
app.get('/api/secure/vault/:name', verifyToken, (req, res) => {
  const secret = vault[req.params.name];
  
  if (!secret) {
    return res.status(404).json({ error: 'Secret not found' });
  }
  
  logger.info('Secret retrieved', { user: req.user.id, name: req.params.name });
  
  // In production, would decrypt here
  res.json({ value: Buffer.from(secret, 'base64').toString() });
});

//List secrets (admin only)
app.get('/api/secure/vault', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  
  res.json({ secrets: Object.keys(vault) });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`Secrets Management module on port ${PORT}`);
  console.log(`🔐 Module 12 running on http://localhost:${PORT}`);
});

module.exports = app;
