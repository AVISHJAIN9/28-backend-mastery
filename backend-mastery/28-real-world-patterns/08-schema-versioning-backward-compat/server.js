require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4008;

// ==================== Middleware ====================

// Security
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Routes ====================

app.use('/api', routes);

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: '08 Schema Versioning Backward Compat',
    category: '28 Real World Patterns',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '08 Schema Versioning Backward Compat',
    module: '28-real-world-patterns - 8',
    description: 'Schema versioning with backward compatibility',
    version: '1.0.0',
    category: '28 Real World Patterns',
    pattern: 'Schema Versioning',
    features: ['Version tracking', 'Dual-write', 'Migration paths'],
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// ==================== Error Handler ====================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== Start Server ====================

app.listen(HTTP_PORT, () => {
  console.log(`\n✅ Module 08 - Schema Versioning Backward Compat`);
  console.log(`📡 Server running on http://localhost:${HTTP_PORT}`);
  console.log(`📊 Pattern: Schema Versioning`);
  console.log(`🔗 API: http://localhost:${HTTP_PORT}/api\n`);
});

module.exports = app;

// ==================== Middleware ====================

// Security
app.use(helmet());
app.use(cors({{'origin': process.env.FRONTEND_URL || 'http://localhost:3000'}}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Routes ====================

app.use('/api', routes);

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    module: '08 Schema Versioning Backward Compat',
    category: '28 Real World Patterns',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '08 Schema Versioning Backward Compat',
    module: '28-real-world-patterns - 11',
    description: 'Real-world application patterns',
    version: '1.0.0',
    category: '28 Real World Patterns',
    endpoints: {
      health: '/health',
      api: '/api'
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

// ==================== Start Server ====================

const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ 08 Schema Versioning Backward Compat running on http://localhost:${HTTP_PORT}`);
  console.log(`✓ Health check: http://localhost:${HTTP_PORT}/health`);
  console.log(`✓ API root: http://localhost:${HTTP_PORT}/api`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
