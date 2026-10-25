require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4003;

// ==================== Middleware ====================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
    module: '03 Push Notifications (FCM & Web Push)',
    category: '26 Notifications Communication',
    port: HTTP_PORT,
    features: ['device-management', 'fcm-support', 'web-push-api', 'batch-notifications', 'delivery-tracking'],
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '03 Push Notifications (FCM & Web Push)',
    module: '26-notifications-communication - Module 3',
    description: 'Firebase Cloud Messaging and Web Push API for cross-platform push notifications',
    version: '1.0.0',
    category: '26 Notifications Communication',
    endpoints: {
      health: '/health',
      'device-management': '/api/devices/*',
      'push-notifications': '/api/notifications/*',
      statistics: '/api/stats'
    }
  });
});

// ==================== Error Handler ====================

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== Server Startup ====================

app.listen(HTTP_PORT, () => {
  console.log(`
=====================================
Module 03: Push Notifications
=====================================
Server running on port ${HTTP_PORT}
Health check: http://localhost:${HTTP_PORT}/health
API base: http://localhost:${HTTP_PORT}/api
=====================================
  `);
});

module.exports = app;

