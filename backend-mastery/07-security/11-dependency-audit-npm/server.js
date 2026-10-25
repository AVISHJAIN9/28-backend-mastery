const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4011;

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

// Simulated audit results
const vulnerabilities = [
  { package: 'lodash', version: '4.17.15', severity: 'high', cve: 'CVE-2021-23337' },
  { package: 'express', version: '4.16.0', severity: 'medium', cve: 'CVE-2022-24999' },
  { package: 'mongoose', version: '5.0.0', severity: 'high', cve: 'CVE-2022-24999' }
];

// VULNERABLE: No dependency checking
app.get('/api/vulnerable/dependencies', (req, res) => {
  res.json({
    packages: [
      { name: 'lodash', version: '4.17.15' },
      { name: 'express', version: '4.16.0' },
      { name: 'mongoose', version: '5.0.0' }
    ],
    note: 'No vulnerability checking performed'
  });
});

// SECURE: Check dependencies against known vulnerabilities
app.get('/api/secure/audit', verifyToken, (req, res) => {
  const found = vulnerabilities.map(v => ({
    ...v,
    recommendation: 'Update immediately'
  }));
  
  logger.info('Audit performed', {
    user: req.user.id,
    vulnerabilitiesFound: found.length
  });
  
  res.json({
    status: found.length > 0 ? 'VULNERABLE' : 'SAFE',
    vulnerabilities: found
  });
});

// Get package.json
app.get('/api/vulnerable/package', (req, res) => {
  // VULNERABLE: Returns raw package.json with secrets possibly exposed
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  logger.warn('Raw package.json exposed');
  res.json(pkg);
});

// Secure package info
app.get('/api/secure/package', verifyToken, (req, res) => {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  // Only return safe info
  res.json({
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    dependencies: Object.keys(pkg.dependencies || {})
  });
});

// Simulate npm audit fix
app.post('/api/secure/auto-fix', verifyToken, (req, res) => {
  logger.info('Auto-fix triggered', { user: req.user.id });
  res.json({
    status: 'fixed',
    updated: vulnerabilities.length,
    message: 'Dependencies updated'
  });
});

app.get('/api/lab/vulnerabilities', (req, res) => {
  res.json(vulnerabilities);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`Dependency Audit module on port ${PORT}`);
  console.log(`📦 Module 11 running on http://localhost:${PORT}`);
});

module.exports = app;
