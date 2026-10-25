const express = require('express');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const PORT = process.env.HTTP_PORT || 4006;

app.use(helmet());
app.use(cors());

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const users = {
  1: {
    id: 1, username: 'alice', email: 'alice@test.com', password_hash: 'xxx',
    ssn: '123-45-6789', salary: 50000, department_id: 5, manager_notes: 'High performer',
    api_key: 'sk_live_abc123def456', internal_id: 'INT_001'
  },
  2: {
    id: 2, username: 'bob', email: 'bob@test.com', password_hash: 'yyy',
    ssn: '987-65-4321', salary: 120000, department_id: 1, manager_notes: 'Team lead',
    api_key: 'sk_live_ghi789jkl012', internal_id: 'INT_002'
  }
};

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

// VULNERABLE: Returns all user data including sensitive fields
app.get('/api/vulnerable/users/:id', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'Not found' });
  logger.warn('Excessive data exposure', { userId: req.params.id });
  res.json(user); // Exposes SSN, salary, API keys, etc!
});

// SECURE: Return only necessary public fields
app.get('/api/secure/users/:id', verifyToken, (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'Not found' });
  
  // Only expose safe fields
  const safe = {
    id: user.id,
    username: user.username,
    email: user.email
  };
  
  // Admin can see additional fields
  if (req.user.role === 'admin') {
    safe.department_id = user.department_id;
    safe.manager_notes = user.manager_notes;
  }
  
  logger.info('Safe profile returned', { userId: req.params.id, requester: req.user.id });
  res.json(safe);
});

// VULNERABLE: API responses contain unnecessary data
app.get('/api/vulnerable/products', (req, res) => {
  res.json({
    products: [
      { id: 1, name: 'Widget', price: 10, cost: 3, margin: 0.7, supplier_cost: 2.5 },
      { id: 2, name: 'Gadget', price: 20, cost: 7, margin: 0.65, supplier_cost: 6 }
    ]
  });
});

// SECURE: Return only needed fields in API response
app.get('/api/secure/products', (req, res) => {
  res.json({
    products: [
      { id: 1, name: 'Widget', price: 10 },
      { id: 2, name: 'Gadget', price: 20 }
    ]
  });
});

app.post('/api/secure/login', (req, res) => {
  const token = jwt.sign({ id: 1, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.post('/api/secure/login-admin', (req, res) => {
  const token = jwt.sign({ id: 2, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/api/lab/users', (req, res) => {
  res.json(Object.entries(users).map(([id, u]) => ({ id, username: u.username })));
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  logger.info(`Excessive Data Exposure module on port ${PORT}`);
  console.log(`📊 Module 06 running on http://localhost:${PORT}`);
});

module.exports = app;
