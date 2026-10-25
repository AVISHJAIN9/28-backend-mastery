require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const SubdomainController = require('./controller');
const { schema } = require('./schema');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 4005;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const logger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

const controller = new SubdomainController();

// Subdomain extraction middleware
const extractTenant = (req, res, next) => {
  const host = req.hostname;
  const tenantId = controller.extractTenantFromHost(host);
  if (tenantId) {
    req.tenantId = tenantId;
    req.tenant = controller.getTenant(tenantId);
  }
  next();
};

app.use(extractTenant);

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

app.get('/api/tenant', (req, res) => {
  if (!req.tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json(req.tenant);
});

app.get('/api/tenants', (req, res) => res.json(controller.getAllTenants()));

app.post('/api/tenants/:tenantId/subdomain', verifyToken, (req, res) => {
  try {
    const { subdomain } = req.body;
    const result = controller.registerSubdomain(req.params.tenantId, subdomain);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/tenants/:tenantId/domain', verifyToken, (req, res) => {
  try {
    const { customDomain } = req.body;
    const result = controller.registerCustomDomain(req.params.tenantId, customDomain);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/domains/:tenantId', (req, res) => {
  const mappings = controller.getDomainMappingsForTenant(req.params.tenantId);
  res.json(mappings);
});

app.get('/api/domains', (req, res) => res.json(controller.getDomainMappings()));

app.post('/api/auth/login', (req, res) => {
  const tenant = Object.values(schema.tenants)[0];
  const token = jwt.sign({ tenant_id: tenant.id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, tenant });
});

app.get('/api/mock/tenants', (req, res) => res.json(schema.tenants));

app.get('/health', (req, res) => res.json({ status: 'ok', module: '05 Subdomain Routing', port: HTTP_PORT }));
app.get('/', (req, res) => res.json({ name: '05 Subdomain Routing', description: 'Multi-domain tenant routing' }));

app.use((err, req, res) => {
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

const server = app.listen(HTTP_PORT, () => {
  console.log(`✓ Module 05 running on http://localhost:${HTTP_PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
