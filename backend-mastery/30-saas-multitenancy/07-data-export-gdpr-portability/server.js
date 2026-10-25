require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const ExportController = require('./controller');
const { schema } = require('./schema');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4007;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

const controller = new ExportController();

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

app.post('/api/tenants/:tenantId/export', verifyToken, (req, res) => {
  try {
    const { userId, requestType, format } = req.body;
    const exportReq = controller.createExportRequest(req.params.tenantId, userId, requestType, format || 'JSON');
    res.status(201).json(exportReq);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/tenants/:tenantId/exports', verifyToken, (req, res) => {
  const exports = controller.getExportRequests(req.params.tenantId);
  res.json(exports);
});

app.get('/api/exports/:exportId', verifyToken, (req, res) => {
  const exp = controller.getExportRequest(req.params.exportId);
  if (!exp) return res.status(404).json({ error: 'Export not found' });
  res.json(exp);
});

app.get('/api/users/:userId/data', verifyToken, (req, res) => {
  const data = controller.getUserData(req.params.userId);
  if (!data) return res.status(404).json({ error: 'User data not found' });
  res.json(data);
});

app.post('/api/tenants/:tenantId/deletion-request', verifyToken, (req, res) => {
  try {
    const { userId } = req.body;
    const delReq = controller.requestAccountDeletion(req.params.tenantId, userId);
    res.status(201).json(delReq);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/tenants/:tenantId/deletions', verifyToken, (req, res) => {
  const deletions = controller.getDeletionRequests(req.params.tenantId);
  res.json(deletions);
});

app.post('/api/deletions/:deleteId/cancel', verifyToken, (req, res) => {
  try {
    const result = controller.cancelDeletion(req.params.deleteId);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/export-types', (req, res) => res.json(controller.getAllExportTypes()));
app.get('/api/formats', (req, res) => res.json(controller.getAllFormats()));

app.post('/api/auth/login', (req, res) => {
  const token = jwt.sign({ id: 'user-1', tenant_id: 'tenant-1' }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

app.get('/api/mock/data', (req, res) => res.json(schema.user_data));

app.get('/health', (req, res) => res.json({ status: 'ok', module: '07 Data Export GDPR', port: HTTP_PORT }));
app.get('/', (req, res) => res.json({ name: '07 Data Export', description: 'GDPR data portability and deletion' }));

app.use((err, req, res) => {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ Module 07 running on http://localhost:${HTTP_PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
