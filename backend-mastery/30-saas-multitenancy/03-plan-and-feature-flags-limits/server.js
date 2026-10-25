require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const PlanController = require('./controller');
const { schema } = require('./schema');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4003;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use((req, res, next) => {
  logger.info('Request', { method: req.method, path: req.path });
  next();
});

const controller = new PlanController();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/plans', (req, res) => res.json(controller.getAllPlans()));

app.get('/api/plans/:planId', (req, res) => {
  const plan = controller.getPlan(req.params.planId);
  res.json(plan || { error: 'Plan not found' });
});

app.get('/api/tenants/:tenantId/plan', verifyToken, (req, res) => {
  const plan = controller.getTenantPlan(req.params.tenantId);
  res.json(plan || { error: 'No plan found' });
});

app.get('/api/tenants/:tenantId/features/:feature', verifyToken, (req, res) => {
  const allowed = controller.canUseFeature(req.params.tenantId, req.params.feature);
  res.json({ feature: req.params.feature, allowed, requires_upgrade: !allowed });
});

app.get('/api/tenants/:tenantId/usage/:metric', verifyToken, (req, res) => {
  const status = controller.checkUsageLimit(req.params.tenantId, req.params.metric);
  res.json(status);
});

app.post('/api/tenants/:tenantId/upgrade', verifyToken, (req, res) => {
  try {
    const { newPlanId } = req.body;
    const result = controller.upgradePlan(req.params.tenantId, newPlanId);
    res.json({ success: true, tenant: result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/features', (req, res) => res.json(controller.getAllFeatureFlags()));

app.post('/api/auth/login', (req, res) => {
  const tenant = Object.values(schema.tenants)[0];
  const token = jwt.sign({ tenant_id: tenant.id, id: 'user-1' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, tenant });
});

app.get('/api/mock/tenants', (req, res) => res.json(schema.tenants));
app.get('/api/mock/usage', (req, res) => res.json(schema.usage));

app.get('/health', (req, res) => res.json({ status: 'ok', module: '03 Plans & Feature Flags', port: HTTP_PORT }));
app.get('/', (req, res) => res.json({ name: '03 Plans & Feature Flags', description: 'SaaS pricing plans and feature gates' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== Start Server ====================

const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ 03 Plan And Feature Flags Limits running on http://localhost:${HTTP_PORT}`);
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
