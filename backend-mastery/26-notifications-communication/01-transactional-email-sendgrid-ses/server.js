require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4001;

// ==================== Middleware ====================

// Security
app.use(helmet());
app.use(cors({
  origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(','),
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ==================== Routes ====================

app.use('/api', routes);

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    module: '01 Transactional Email (SendGrid/SES/Nodemailer)',
    category: '26 Notifications Communication',
    port: HTTP_PORT,
    provider: process.env.EMAIL_PROVIDER || 'nodemailer',
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '01 Transactional Email (SendGrid/SES/Nodemailer)',
    module: '26-notifications-communication - Module 1',
    description: 'Send transactional emails via SendGrid, AWS SES, or Nodemailer',
    version: '1.0.0',
    category: '26 Notifications Communication',
    endpoints: {
      health: '/health',
      api: '/api',
      'api-docs': '/api/email/templates'
    }
  });
});

// ==================== Error Handler ====================

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// ==================== 404 Handler ====================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// ==================== Start Server ====================

const server = app.listen(HTTP_PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('✓ Module 01: Transactional Email (SendGrid/SES/Nodemailer)');
  console.log('='.repeat(60));
  console.log(`✓ Server: http://localhost:${HTTP_PORT}`);
  console.log(`✓ API: http://localhost:${HTTP_PORT}/api`);
  console.log(`✓ Health: http://localhost:${HTTP_PORT}/health`);
  console.log(`✓ Provider: ${process.env.EMAIL_PROVIDER || 'nodemailer'}`);
  console.log('='.repeat(60) + '\n');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
