require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const AuditController = require('./controller');
const { schema } = require('./schema');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4006;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

const controller = new AuditController();

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

app.post('/api/tenants/:tenantId/audit', verifyToken, (req, res) => {
  try {
    const { userId, action, resourceType, resourceId, status, metadata } = req.body;
    const log = controller.logAction(req.params.tenantId, userId, action, resourceType, resourceId, status, metadata, req.ip, req.get('user-agent'));
    res.status(201).json(log);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/tenants/:tenantId/audit', verifyToken, (req, res) => {
  const options = {
    userId: req.query.userId,
    action: req.query.action,
    resourceType: req.query.resourceType,
    status: req.query.status
  };
  const logs = controller.getAuditLogs(req.params.tenantId, options);
  res.json(logs);
});

app.get('/api/tenants/:tenantId/audit/:logId', verifyToken, (req, res) => {
  const log = controller.getAuditLog(req.params.logId);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  res.json(log);
});

app.get('/api/tenants/:tenantId/audit/search', verifyToken, (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Search query required' });
  const logs = controller.searchAuditLogs(req.params.tenantId, q);
  res.json(logs);
});

app.get('/api/tenants/:tenantId/audit-stats', verifyToken, (req, res) => {
  const stats = controller.getAuditStats(req.params.tenantId);
  res.json(stats);
});

app.post('/api/tenants/:tenantId/audit-rules', verifyToken, (req, res) => {
  try {
    const { eventType, alertEnabled, notifyEmail } = req.body;
    const rule = controller.createAuditRule(req.params.tenantId, eventType, alertEnabled, notifyEmail);
    res.status(201).json(rule);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/tenants/:tenantId/audit-rules', verifyToken, (req, res) => {
  const rules = controller.getAuditRules(req.params.tenantId);
  res.json(rules);
});

app.post('/api/auth/login', (req, res) => {
  const token = jwt.sign({ id: 'user-1', tenant_id: 'tenant-1' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

app.get('/api/mock/logs', (req, res) => res.json(schema.audit_logs));

app.get('/health', (req, res) => res.json({ status: 'ok', module: '06 Audit Logs', port: HTTP_PORT }));
app.get('/', (req, res) => res.json({ name: '06 Audit Logs', description: 'Compliance audit logging' }));

app.use((err, req, res) => {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ Module 06 running on http://localhost:${HTTP_PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
