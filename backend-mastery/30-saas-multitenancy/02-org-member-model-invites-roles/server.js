require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const routes = require('./routes');
const { schema } = require('./schema');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4002;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info('Request', { method: req.method, path: req.path });
  next();
});

app.use('/api', routes);

app.post('/api/auth/login', (req, res) => {
  const { userId } = req.body;
  const user = schema.users[userId];
  if (!user) return res.status(401).json({ error: 'User not found' });
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/mock/users', (req, res) => res.json(schema.users));
app.get('/api/mock/organizations', (req, res) => res.json(schema.organizations));
app.get('/api/mock/members', (req, res) => res.json(schema.organization_members));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', module: '02 Org Member Model Invites Roles', port: HTTP_PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: '02 Org Member Model Invites Roles',
    module: '30-saas-multitenancy - 2',
    description: 'Organization member models with invites and RBAC',
    version: '1.0.0',
    endpoints: { health: '/health', api: '/api', login: 'POST /api/auth/login' }
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error', status: err.status || 500 });
});

// ==================== Start Server ====================

const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ 02 Org Member Model Invites Roles running on http://localhost:${HTTP_PORT}`);
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
