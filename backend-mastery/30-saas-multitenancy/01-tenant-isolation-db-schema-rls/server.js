// Express server with tenant isolation and RLS
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const winston = require('winston');

const TenantController = require('./controller');
const { createRoutes } = require('./routes');
const middleware = require('./middleware');
const { schema } = require('./schema');

const app = express();
const PORT = process.env.HTTP_PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Database connection (in-memory mock for demo)
// For production, use actual PostgreSQL
const mockDatabase = {
  tenants: {
    'tenant-1': { id: 'tenant-1', name: 'Acme Corp', subdomain: 'acme', plan: 'pro' },
    'tenant-2': { id: 'tenant-2', name: 'Beta Inc', subdomain: 'beta', plan: 'free' }
  },
  users: {
    'user-1': { id: 'user-1', tenant_id: 'tenant-1', name: 'Alice', email: 'alice@acme.com', role: 'admin' },
    'user-2': { id: 'user-2', tenant_id: 'tenant-1', name: 'Bob', email: 'bob@acme.com', role: 'member' },
    'user-3': { id: 'user-3', tenant_id: 'tenant-2', name: 'Charlie', email: 'charlie@beta.com', role: 'admin' }
  },
  documents: {
    'doc-1': { id: 'doc-1', tenant_id: 'tenant-1', title: 'Acme Strategy', content: 'Secret plans...', owner_id: 'user-1' },
    'doc-2': { id: 'doc-2', tenant_id: 'tenant-1', title: 'Q4 Budget', content: '$1M allocation', owner_id: 'user-1' },
    'doc-3': { id: 'doc-3', tenant_id: 'tenant-2', title: 'Beta Roadmap', content: 'Phase 1: MVP', owner_id: 'user-3' }
  }
};

// Mock database query function (simulates RLS)
const createMockDb = () => ({
  currentTenant: null,
  
  query: async (sql, params = []) => {
    // Simulate RLS filtering
    if (sql.includes('SELECT') && sql.includes('FROM')) {
      if (sql.includes('users')) {
        const tenantId = mockDatabase.users[Object.keys(mockDatabase.users)[0]].tenant_id;
        const filtered = Object.values(mockDatabase.users)
          .filter(u => u.tenant_id === (mockDatabase.currentTenant || tenantId));
        return { rows: filtered };
      }
      if (sql.includes('documents')) {
        const tenantId = mockDatabase.documents[Object.keys(mockDatabase.documents)[0]].tenant_id;
        const filtered = Object.values(mockDatabase.documents)
          .filter(d => d.tenant_id === (mockDatabase.currentTenant || tenantId));
        return { rows: filtered };
      }
      if (sql.includes('tenants')) {
        return { rows: Object.values(mockDatabase.tenants) };
      }
    }
    
    if (sql.includes('SET app.current_tenant_id')) {
      this.currentTenant = params[0];
      return { rows: [] };
    }

    if (sql.includes('INSERT')) {
      const docId = 'doc-' + Date.now();
      const newDoc = { id: docId, ...params };
      mockDatabase.documents[docId] = newDoc;
      return { rows: [newDoc] };
    }

    return { rows: [] };
  }
});

let db = createMockDb();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });
  next();
});

// Tenant extraction and RLS middleware
const extractTenantFromToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.tenant_id = decoded.tenant_id;

    if (!req.tenant_id) {
      return res.status(401).json({ error: 'Invalid token: no tenant_id' });
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const setRLSContext = async (req, res, next) => {
  try {
    if (!req.tenant_id) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Simulate RLS context setting
    await db.query('SET app.current_tenant_id = $1', [req.tenant_id]);
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const validateTenantOwnership = async (req, res, next) => {
  try {
    if (!req.user || !req.tenant_id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = mockDatabase.users[req.user.id];
    if (!user || user.tenant_id !== req.tenant_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create controller and routes
const controller = new TenantController(db);
const customMiddleware = { extractTenantFromToken, setRLSContext, validateTenantOwnership };
const routes = createRoutes(controller, customMiddleware);

// Mount routes
app.use(routes);

// Auth endpoint (create test tokens)
app.post('/api/auth/login', (req, res) => {
  const { userId } = req.body;
  const user = mockDatabase.users[userId];

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, tenant_id: user.tenant_id, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, tenant_id: user.tenant_id, name: user.name } });
});

// Mock data endpoint
app.get('/api/mock/users', (req, res) => {
  res.json(mockDatabase.users);
});

app.get('/api/mock/tenants', (req, res) => {
  res.json(mockDatabase.tenants);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API docs: http://localhost:${PORT}/api/health`);
});

module.exports = app;
