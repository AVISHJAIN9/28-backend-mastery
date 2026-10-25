require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { requestLogger } = require('./middleware');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3006;

// ==================== Middleware ====================

app.use(helmet());
app.use(cors({{'origin': process.env.FRONTEND_URL || 'http://localhost:3000'}}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ==================== Routes ====================

app.use('/api', routes);

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: '06-decorator-pattern',
    pattern: 'Decorator Pattern',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '06-decorator-pattern',
    pattern: 'Decorator Pattern',
    description: '14-design-patterns module',
    version: '1.0.0',
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

app.listen(HTTP_PORT, () => {
  console.log(`✓ Decorator Pattern module running on http://localhost:${HTTP_PORT}`);
  console.log(`✓ Health check: http://localhost:${HTTP_PORT}/health`);
  console.log(`✓ API: http://localhost:${HTTP_PORT}/api`);
});
