import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes.js';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 6413;

// ==================== Middleware ====================

// Security
app.use(helmet());
app.use(cors({origin: process.env.FRONTEND_URL || 'http://localhost:3000'}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Routes ====================

app.use('/api', routes);

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    module: '08 Redis Cluster',
    category: '08 Caching',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '08 Redis Cluster',
    module: '08-caching - 13',
    description: 'Redis caching patterns',
    version: '1.0.0',
    category: '08 Caching',
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
  console.log(`✓ 08 Redis Cluster running on http://localhost:${HTTP_PORT}`);
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

export default app;
