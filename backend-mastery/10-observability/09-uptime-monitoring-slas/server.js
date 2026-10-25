require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const {
  requestTracker,
  setupHealthCheckInterval,
  errorRateMonitor,
  latencyMonitor,
  correlationId
} = require('./middleware');
const { logger } = require('./controller');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4009;
const VERSION = '1.0.0';

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

// Monitoring middleware
app.use(correlationId);
app.use(requestTracker);
app.use(errorRateMonitor);
app.use(latencyMonitor);

// ==================== Routes ====================

app.use('/api', routes);

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: 'Uptime Monitoring & SLAs API',
    version: VERSION,
    module: '09-uptime-monitoring-slas',
    description: 'Service Level Agreement monitoring, SLO tracking, and incident management',
    category: '10 Observability',
    endpoints: {
      monitoring: [
        { method: 'GET', path: '/api/metrics', description: 'Get real-time metrics' },
        { method: 'GET', path: '/api/status', description: 'Get public status page' },
        { method: 'GET', path: '/api/sla-status', description: 'Get SLA compliance status' },
        { method: 'GET', path: '/api/statistics', description: 'Get detailed statistics' },
        { method: 'GET', path: '/api/incidents', description: 'Get incident list' },
        { method: 'GET', path: '/api/uptime', description: 'Get uptime for period' }
      ],
      testing: [
        { method: 'POST', path: '/api/test-incident', description: 'Start incident simulation' },
        { method: 'POST', path: '/api/stop-incident', description: 'Stop incident simulation' },
        { method: 'GET', path: '/api/simulation-status', description: 'Get simulation status' }
      ],
      system: [
        { method: 'GET', path: '/api/health', description: 'Health check' },
        { method: 'POST', path: '/api/clear-metrics', description: 'Clear all metrics (testing)' },
        { method: 'GET', path: '/api/report', description: 'Comprehensive report' }
      ]
    },
    concepts: {
      SLI: 'Service Level Indicator - Actual measured performance',
      SLO: 'Service Level Objective - Internal performance target',
      SLA: 'Service Level Agreement - Customer-facing contract'
    },
    features: [
      'Real-time availability tracking',
      'Latency percentile calculations (P50, P95, P99)',
      'Error rate monitoring',
      'Incident recording and tracking',
      'SLA compliance calculations',
      'Status page for customers',
      'Health check endpoints',
      'Incident simulation for testing'
    ]
  });
});

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    module: '09 Uptime Monitoring SLAs',
    category: '10 Observability',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Error Handler ====================

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// ==================== Start Server ====================

const server = app.listen(HTTP_PORT, () => {
  logger.info({
    event: 'application_started',
    port: HTTP_PORT,
    module: '09-uptime-monitoring-slas',
    timestamp: new Date().toISOString()
  });
  
  console.log(`\n✓ 09 Uptime Monitoring & SLAs running on http://localhost:${HTTP_PORT}`);
  console.log(`✓ Health check: http://localhost:${HTTP_PORT}/health`);
  console.log(`✓ API docs: http://localhost:${HTTP_PORT}/`);
  console.log(`✓ Metrics: http://localhost:${HTTP_PORT}/api/metrics`);
  console.log(`✓ Status page: http://localhost:${HTTP_PORT}/api/status\n`);
});

// ==================== Graceful Shutdown ====================

process.on('SIGTERM', () => {
  logger.warn('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.warn('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;

