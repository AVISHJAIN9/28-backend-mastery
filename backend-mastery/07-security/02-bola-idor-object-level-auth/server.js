const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

// ====== CONFIGURATION ======
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const PORT = process.env.HTTP_PORT || 4002;

// ====== SECURITY MIDDLEWARE ======
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// ====== LOGGING SETUP ======
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'bola-idor-module' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    ...(process.env.NODE_ENV !== 'production' ? [new winston.transports.Console({
      format: winston.format.simple()
    })] : [])
  ]
});

// ====== MOCK DATABASE ======
const users = {
  1: {
    id: 1,
    username: 'alice',
    email: 'alice@example.com',
    role: 'user',
    bankAccount: '1234567890',
    salary: 50000,
    ssn: '123-45-6789',
    address: '123 Main St',
    dateCreated: '2024-01-01'
  },
  2: {
    id: 2,
    username: 'bob',
    email: 'bob@example.com',
    role: 'admin',
    bankAccount: '0987654321',
    salary: 120000,
    ssn: '987-65-4321',
    address: '456 Oak Ave',
    dateCreated: '2024-01-02'
  },
  3: {
    id: 3,
    username: 'charlie',
    email: 'charlie@example.com',
    role: 'user',
    bankAccount: '5555555555',
    salary: 60000,
    ssn: '555-55-5555',
    address: '789 Pine Rd',
    dateCreated: '2024-01-03'
  }
};

const documents = {
  1: {
    id: 1,
    title: 'Project Plan Q1',
    content: 'This is Alice\'s document',
    ownerId: 1,
    createdAt: '2024-01-10',
    salary: 50000
  },
  2: {
    id: 2,
    title: 'Admin Report',
    content: 'Confidential admin data',
    ownerId: 2,
    createdAt: '2024-01-11',
    salary: 120000
  },
  3: {
    id: 3,
    title: 'Charlie\'s Notes',
    content: 'Personal research notes',
    ownerId: 3,
    createdAt: '2024-01-12',
    salary: 60000
  },
  4: {
    id: 4,
    title: 'Team Budget',
    content: 'Confidential budget data - $2M allocation',
    ownerId: 2,
    createdAt: '2024-01-13',
    salary: 150000
  }
};

const invoices = {
  1: { id: 1, amount: 1000, userId: 1, status: 'paid', date: '2024-01-01' },
  2: { id: 2, amount: 5000, userId: 2, status: 'pending', date: '2024-01-02' },
  3: { id: 3, amount: 2000, userId: 1, status: 'pending', date: '2024-01-03' },
  4: { id: 4, amount: 10000, userId: 3, status: 'paid', date: '2024-01-04' }
};

// ====== RATE LIMITING ======
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100
});

// ====== MIDDLEWARE ======

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    logger.warn('Access attempt without token', { ip: req.ip });
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token', { ip: req.ip, error: error.message });
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization check - ensure user only accesses their own data
const ensureOwnership = (resourceOwnerId) => {
  return (req, res, next) => {
    if (req.user.id !== resourceOwnerId && req.user.role !== 'admin') {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        attemptedResourceOwner: resourceOwnerId,
        ip: req.ip
      });
      return res.status(403).json({ error: 'Forbidden - you can only access your own data' });
    }
    next();
  };
};

// ====== ENDPOINTS ======

// VULNERABLE: Login endpoint - no security checks
app.post('/api/vulnerable/login', loginLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    const user = Object.values(users).find(u => u.email === email && u.password === password);

    if (!user) {
      logger.warn('Failed login attempt', { email, ip: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    logger.info('User logged in', { userId: user.id, email });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// VULNERABLE: Get user profile - directly by ID without authorization
app.get('/api/vulnerable/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = users[userId];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info('User profile accessed', { requestedUserId: userId, ip: req.ip });
    res.json(user); // Returns ALL data including salary, SSN, bank account
  } catch (error) {
    logger.error('Error fetching user', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// VULNERABLE: Get user documents - no authorization check
app.get('/api/vulnerable/documents/:id', (req, res) => {
  try {
    const docId = parseInt(req.params.id);
    const doc = documents[docId];

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    logger.warn('Unauthenticated document access - potential IDOR', {
      documentId: docId,
      documentOwner: doc.ownerId,
      ip: req.ip
    });

    res.json(doc); // Anyone can read any document
  } catch (error) {
    logger.error('Error fetching document', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// VULNERABLE: Get invoice - no authorization
app.get('/api/vulnerable/invoices/:id', (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const invoice = invoices[invoiceId];

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    logger.error('Error fetching invoice', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// VULNERABLE: Update user - no authorization
app.put('/api/vulnerable/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = users[userId];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Attacker can modify ANY user's data
    Object.assign(user, req.body);

    logger.warn('User data modified without authorization', {
      modifiedUserId: userId,
      ip: req.ip,
      changes: Object.keys(req.body)
    });

    res.json(user);
  } catch (error) {
    logger.error('Error updating user', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// ====== SECURE ENDPOINTS ======

// SECURE: Login with proper validation
app.post('/api/secure/login', loginLimiter, (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = Object.values(users).find(u => u.email === email && u.password === password);

    if (!user) {
      logger.warn('Failed secure login attempt', { email, ip: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    logger.info('User logged in securely', { userId: user.id, email });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Secure login error', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// SECURE: Get own profile with JWT verification
app.get('/api/secure/users/:id', verifyToken, (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check: User can only access their own profile or admin can access any
    if (req.user.id !== userId && req.user.role !== 'admin') {
      logger.warn('Unauthorized profile access attempt', {
        userId: req.user.id,
        attemptedUserId: userId,
        ip: req.ip
      });
      return res.status(403).json({ error: 'Forbidden - you can only access your own profile' });
    }

    const user = users[userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Sanitize sensitive data
    const sanitized = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      address: user.address,
      dateCreated: user.dateCreated
    };

    // Only admin can see salary (or user can see their own)
    if (req.user.role === 'admin') {
      sanitized.salary = user.salary;
    }

    logger.info('Secure profile accessed', { userId: req.user.id, targetUserId: userId });
    res.json(sanitized);
  } catch (error) {
    logger.error('Error fetching secure user', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// SECURE: Get documents with proper authorization
app.get('/api/secure/documents/:id', verifyToken, (req, res) => {
  try {
    const docId = parseInt(req.params.id);
    const doc = documents[docId];

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check ownership: User owns doc or is admin
    if (req.user.id !== doc.ownerId && req.user.role !== 'admin') {
      logger.warn('Secure IDOR prevention triggered', {
        userId: req.user.id,
        documentOwner: doc.ownerId,
        documentId: docId,
        ip: req.ip
      });
      return res.status(403).json({ error: 'Forbidden - this document belongs to another user' });
    }

    logger.info('Secure document accessed', { userId: req.user.id, documentId: docId });
    res.json(doc);
  } catch (error) {
    logger.error('Error fetching secure document', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// SECURE: Get invoices with authorization
app.get('/api/secure/invoices/:id', verifyToken, (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const invoice = invoices[invoiceId];

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // User can only see their own invoices, admin can see all
    if (req.user.id !== invoice.userId && req.user.role !== 'admin') {
      logger.warn('Unauthorized invoice access', {
        userId: req.user.id,
        invoiceOwner: invoice.userId,
        ip: req.ip
      });
      return res.status(403).json({ error: 'Forbidden' });
    }

    logger.info('Secure invoice accessed', { userId: req.user.id, invoiceId });
    res.json(invoice);
  } catch (error) {
    logger.error('Error fetching secure invoice', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// SECURE: Update own profile only
app.put('/api/secure/users/:id', verifyToken, (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Authorization check
    if (req.user.id !== userId && req.user.role !== 'admin') {
      logger.warn('Unauthorized user update attempt', {
        userId: req.user.id,
        targetUserId: userId,
        ip: req.ip
      });
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = users[userId];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow certain fields to be updated
    const allowedFields = ['username', 'address'];
    const updates = {};

    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    }

    Object.assign(user, updates);

    logger.info('User profile updated securely', {
      userId: req.user.id,
      targetUserId: userId,
      updatedFields: Object.keys(updates)
    });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      address: user.address
    });
  } catch (error) {
    logger.error('Error updating secure user', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Lab endpoint - get list of users (for testing)
app.get('/api/lab/users', (req, res) => {
  res.json(Object.values(users).map(u => ({ id: u.id, username: u.username, email: u.email })));
});

// Lab endpoint - get list of documents (for testing)
app.get('/api/lab/documents', (req, res) => {
  res.json(Object.values(documents).map(d => ({ id: d.id, title: d.title, ownerId: d.ownerId })));
});

// Lab endpoint - get list of invoices (for testing)
app.get('/api/lab/invoices', (req, res) => {
  res.json(Object.values(invoices).map(i => ({ id: i.id, amount: i.amount, userId: i.userId })));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'bola-idor' });
});

// ====== ERROR HANDLING ======
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  logger.info(`BOLA/IDOR Module server started on port ${PORT}`);
  console.log(`\n🔐 BOLA/IDOR Module`);
  console.log(`📝 Server running on http://localhost:${PORT}`);
  console.log(`\n🧪 Test the vulnerabilities:`);
  console.log(`  - Vulnerable endpoints: /api/vulnerable/*`);
  console.log(`  - Secure endpoints: /api/secure/*`);
  console.log(`  - Lab endpoints: /api/lab/*`);
});

module.exports = app;
