require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const MeteringController = require('./controller');
const { schema } = require('./schema');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4004;
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

const controller = new MeteringController();

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

app.post('/api/tenants/:tenantId/meter', verifyToken, (req, res) => {
  try {
    const { metric, value, endpoint } = req.body;
    if (!metric || !value) return res.status(400).json({ error: 'metric and value required' });
    
    const exceeded = controller.checkQuotaExceeded(req.params.tenantId, metric);
    if (exceeded) return res.status(429).json({ error: 'Quota exceeded' });
    
    const event = controller.recordEvent(req.params.tenantId, metric, value, endpoint);
    res.json(event);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/tenants/:tenantId/usage', verifyToken, (req, res) => {
  const summary = controller.getUsageSummary(req.params.tenantId);
  res.json(summary || { error: 'No usage data' });
});

app.get('/api/tenants/:tenantId/quota', verifyToken, (req, res) => {
  const quota = controller.getQuota(req.params.tenantId);
  res.json(quota || { error: 'No quota' });
});

app.get('/api/tenants/:tenantId/quota/percentage/:metric', verifyToken, (req, res) => {
  const pct = controller.getQuotaPercentage(req.params.tenantId, req.params.metric);
  res.json({ metric: req.params.metric, percentage: pct });
});

app.get('/api/tenants/:tenantId/events', verifyToken, (req, res) => {
  const metric = req.query.metric;
  const events = controller.getMeterEvents(req.params.tenantId, metric);
  res.json(events);
});

app.post('/api/auth/login', (req, res) => {
  const tenant = Object.values(schema.tenants)[0];
  const token = jwt.sign({ tenant_id: tenant.id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, tenant });
});

app.get('/api/mock/usage', (req, res) => res.json(schema.usage_summary));
app.get('/api/mock/quotas', (req, res) => res.json(schema.quotas));

app.get('/health', (req, res) => res.json({ status: 'ok', module: '04 Usage Metering', port: HTTP_PORT }));
app.get('/', (req, res) => res.json({ name: '04 Usage Metering', description: 'Real-time API call tracking and quota' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ Module 04 running on http://localhost:${HTTP_PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
