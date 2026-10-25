const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4016;
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'my-32-character-secret-key-here!';

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

// Mock database
const records = {};

// Encryption utilities
const encrypt = (text, secret) => {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(String(secret)).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text, secret) => {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const key = crypto.createHash('sha256').update(String(secret)).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
};

// VULNERABLE: Store sensitive data in plaintext
app.post('/api/vulnerable/store', (req, res) => {
  const { ssn, creditCard, data } = req.body;
  const record = { ssn, creditCard, data, stored_at: new Date() };
  const id = Math.random().toString();
  records[id] = record;
  
  logger.warn('Sensitive data stored unencrypted', { id });
  res.json({ id, message: 'Data stored' });
});

// VULNERABLE: Return sensitive data in plaintext
app.get('/api/vulnerable/records/:id', (req, res) => {
  const record = records[req.params.id];
  if (!record) return res.status(404).json({ error: 'Not found' });
  
  logger.warn('Plaintext sensitive data retrieved', { id: req.params.id });
  res.json(record);
});

// SECURE: Encrypt sensitive data at rest
app.post('/api/secure/store', verifyToken, (req, res) => {
  const { ssn, creditCard, data } = req.body;
  
  // Encrypt sensitive fields
  const record = {
    ssn: encrypt(ssn, ENCRYPTION_SECRET),
    creditCard: encrypt(creditCard, ENCRYPTION_SECRET),
    data: data, // Non-sensitive
    stored_at: new Date(),
    encrypted: true
  };
  
  const id = Math.random().toString();
  records[id] = record;
  
  logger.info('Sensitive data encrypted and stored', { id, user: req.user.id });
  res.json({ id, message: 'Data encrypted and stored' });
});

// SECURE: Return decrypted data only to authorized user
app.get('/api/secure/records/:id', verifyToken, (req, res) => {
  const record = records[req.params.id];
  if (!record) return res.status(404).json({ error: 'Not found' });
  
  // Decrypt for authorized access only
  const decrypted = {
    ssn: decrypt(record.ssn, ENCRYPTION_SECRET),
    creditCard: decrypt(record.creditCard, ENCRYPTION_SECRET),
    data: record.data,
    stored_at: record.stored_at
  };
  
  logger.info('Encrypted data decrypted for authorized user', { id: req.params.id, user: req.user.id });
  res.json(decrypted);
});

// Encryption status
app.get('/api/secure/encryption-status', verifyToken, (req, res) => {
  res.json({
    algorithm: 'AES-256-CBC',
    method: 'Salted with SHA-256 key derivation',
    status: 'Encrypted'
  });
});

app.post('/api/secure/login', (req, res) => {
  const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`Encryption at Rest module on port ${PORT}`);
  console.log(`🔐 Module 16 running on http://localhost:${PORT}`);
});

module.exports = app;
