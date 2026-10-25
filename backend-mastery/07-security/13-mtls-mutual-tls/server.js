const express = require('express');
const helmet = require('helmet');
const https = require('https');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4013;

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

// VULNERABLE: No mutual TLS
app.post('/api/vulnerable/service-call', (req, res) => {
  logger.warn('Service call without mTLS verification');
  res.json({ status: 'accepted', data: 'sensitive data' });
});

// SECURE: Requires client certificate verification
app.post('/api/secure/service-call', verifyToken, (req, res) => {
  const cert = req.socket.getPeerCertificate();
  
  if (!req.client.authorized) {
    logger.warn('Unauthorized client certificate', { clientIP: req.ip });
    return res.status(401).json({ error: 'Client certificate required' });
  }
  
  logger.info('Service call with valid mTLS', {
    clientCert: cert.subject,
    user: req.user.id
  });
  
  res.json({ status: 'accepted', data: 'verified' });
});

// Endpoint info
app.get('/api/tls/info', (req, res) => {
  const protocol = req.protocol;
  const tlsVersion = req.socket.getProtocol?.();
  
  res.json({
    protocol,
    tlsVersion,
    secure: req.secure,
    cipher: req.socket.getCipher?.()
  });
});

// Certificate info
app.get('/api/secure/cert-info', verifyToken, (req, res) => {
  const cert = req.socket.getPeerCertificate();
  
  if (!cert || Object.keys(cert).length === 0) {
    return res.json({ message: 'No client certificate' });
  }
  
  res.json({
    subject: cert.subject,
    issuer: cert.issuer,
    valid_from: cert.valid_from,
    valid_to: cert.valid_to,
    fingerprint: cert.fingerprint
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`mTLS module on port ${PORT}`);
  console.log(`🔒 Module 13 running on http://localhost:${PORT}`);
  console.log(`   Note: Requires client certificates for secure endpoints`);
});

module.exports = app;
