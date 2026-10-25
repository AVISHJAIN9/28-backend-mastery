require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const AdminController = require('./controller');
const { schema } = require('./schema');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4008;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

const controller = new AdminController();

const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/admin/users', verifyAdminToken, (req, res) => {
  res.json(controller.getAllAdminUsers());
});

app.post('/api/admin/impersonate', verifyAdminToken, (req, res) => {
  try {
    const { tenantId, userId } = req.body;
    const session = controller.startImpersonation(req.admin.id, tenantId, userId);
    res.json(session);
  } catch (e) {
    res.status(403).json({ error: e.message });
  }
});

app.post('/api/admin/impersonate/:sessionId/end', verifyAdminToken, (req, res) => {
  try {
    const session = controller.endImpersonation(req.params.sessionId);
    res.json(session);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/admin/sessions', verifyAdminToken, (req, res) => {
  const sessions = controller.getImpersonationSessions(req.admin.id);
  res.json(sessions);
});

app.post('/api/admin/events', verifyAdminToken, (req, res) => {
  try {
    const { tenantId, type, metadata } = req.body;
    const event = controller.logSystemEvent(type, tenantId, metadata);
    res.status(201).json(event);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/admin/events/:tenantId', verifyAdminToken, (req, res) => {
  const type = req.query.type;
  const events = controller.getSystemEvents(req.params.tenantId, type);
  res.json(events);
});

app.post('/api/admin/logs', verifyAdminToken, (req, res) => {
  try {
    const { tenantId, level, message, stackTrace } = req.body;
    const log = controller.addDebugLog(tenantId, level, message, stackTrace);
    res.status(201).json(log);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/admin/logs/:tenantId', verifyAdminToken, (req, res) => {
  const level = req.query.level;
  const logs = controller.getDebugLogs(req.params.tenantId, level);
  res.json(logs);
});

app.get('/api/admin/roles', verifyAdminToken, (req, res) => {
  res.json(controller.getAllAdminRoles());
});

app.post('/api/admin/login', (req, res) => {
  const admin = Object.values(schema.admin_users)[0];
  const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, admin });
});

app.get('/api/mock/admins', (req, res) => res.json(schema.admin_users));

app.get('/health', (req, res) => res.json({ status: 'ok', module: '08 Admin Panel', port: HTTP_PORT }));
app.get('/', (req, res) => res.json({ name: '08 Admin Panel', description: 'System administration and impersonation' }));

app.use((err, req, res) => {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ Module 08 running on http://localhost:${HTTP_PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
