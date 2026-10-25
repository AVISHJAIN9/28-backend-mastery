require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4007;

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
    module: '07 Database Seeding Repeatable',
    category: '28 Real World Patterns',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '07 Database Seeding Repeatable',
    module: '28-real-world-patterns - 7',
    description: 'Idempotent seeding - prevent duplicate insertions',
    version: '1.0.0',
    category: '28 Real World Patterns',
    pattern: 'Idempotent Seeding',
    features: ['Upsert', 'Seed versioning', 'Idempotent operations'],
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
  console.log(`\n✅ Module 07 - Database Seeding Repeatable`);
  console.log(`📡 Server running on http://localhost:${HTTP_PORT}`);
  console.log(`📊 Pattern: Idempotent Seeding`);
  console.log(`🔗 API: http://localhost:${HTTP_PORT}/api\n`);
});

module.exports = app;
