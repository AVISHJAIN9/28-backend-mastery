const express = require('express');
const helmet = require('helmet');
const https = require('https');
const http = require('http');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4017;

app.use(helmet({
  strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true },
  hsts: { maxAge: 31536000 }
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

// VULNERABLE: HTTP without encryption
app.get('/api/vulnerable/data', (req, res) => {
  logger.warn('Data sent over unencrypted HTTP');
  res.json({
    ssn: '123-45-6789',
    creditCard: '4111-1111-1111-1111',
    message: 'This is sent without encryption!'
  });
});

// Demonstrate weak SSL configuration
app.get('/api/vulnerable/ssl-info', (req, res) => {
  res.json({
    tlsVersion: 'TLSv1.0', // Weak!
    ciphers: ['DES', 'RC4'], // Weak!
    warnings: ['Outdated TLS version', 'Weak ciphers']
  });
});

// SECURE: HTTPS enforced
app.get('/api/secure/data', verifyToken, (req, res) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    logger.warn('Non-HTTPS access denied', { user: req.user.id });
    return res.status(403).json({ error: 'HTTPS required' });
  }
  
  logger.info('Data sent over encrypted HTTPS', { user: req.user.id });
  res.json({
    message: 'This data is encrypted in transit',
    encrypted: true
  });
});

// SECURE: Strong SSL configuration info
app.get('/api/secure/ssl-info', verifyToken, (req, res) => {
  res.json({
    tlsVersion: 'TLSv1.3',
    cipherSuite: 'TLS_AES_256_GCM_SHA384',
    hsts: 'enabled (31536000s)',
    certificateChain: 'verified',
    recommendations: [
      'TLS 1.3 enforced',
      'Perfect Forward Secrecy enabled',
      'HSTS enabled',
      'Certificate pinning recommended'
    ]
  });
});

// Certificate validation endpoint
app.get('/api/secure/cert-validation', verifyToken, (req, res) => {
  const protocol = req.protocol;
  const secure = req.secure;
  
  res.json({
    protocol,
    secure,
    tlsVersion: req.socket.getProtocol?.() || 'unknown',
    cipher: req.socket.getCipher?.() || 'unknown',
    validation: secure ? 'passed' : 'failed'
  });
});

// TLS internals explanation
app.get('/api/lab/tls-handshake', (req, res) => {
  res.json({
    steps: [
      'Client Hello - sends supported TLS versions and cipher suites',
      'Server Hello - chooses TLS version and cipher suite',
      'Certificate - server sends X.509 certificate',
      'Key Exchange - exchange encryption keys',
      'Finished - handshake complete, encrypted channel established'
    ],
    vulnerabilities: [
      'Certificate validation bypass',
      'Weak cipher suites',
      'MITM attacks on unencrypted connections',
      'SSL stripping'
    ]
  });
});

//Redirect HTTP to HTTPS (in production)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
});

app.post('/api/secure/login', (req, res) => {
  const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`TLS/HTTPS Internals module on port ${PORT}`);
  console.log(`🔒 Module 17 running on http://localhost:${PORT}`);
  console.log(`   Note: In production, use HTTPS with proper certificates`);
});

module.exports = app;
