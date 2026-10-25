const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const winston = require('winston');

const app = express();
app.use(express.json());

// ====== SETUP ======
const JWT_SECRET = 'your-secret-key-change-in-production';
const PORT = 4001;

// Configure security headers
app.use(helmet());

// Setup logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Simulated database
const users = [
  { id: 1, username: 'alice', password: 'password123', email: 'alice@example.com', role: 'user', ssn: '123-45-6789' },
  { id: 2, username: 'bob', password: 'password456', email: 'bob@example.com', role: 'admin', ssn: '987-65-4321' },
  { id: 3, username: 'charlie', password: 'password789', email: 'charlie@example.com', role: 'user', ssn: '555-55-5555' }
];

const products = [
  { id: 1, name: 'Laptop', price: 999, ownerId: 1 },
  { id: 2, name: 'Phone', price: 499, ownerId: 2 },
  { id: 3, name: 'Tablet', price: 299, ownerId: 1 }
];

// ====== MIDDLEWARE ======

// Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

// JWT middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    logger.warn('Invalid token attempt', { ip: req.ip });
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    logger.warn('Unauthorized admin access attempt', { user: req.user.id, ip: req.ip });
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ====== VULNERABILITIES & FIXES ======

// API1: Broken Object Level Authorization (BOLA)
// VULNERABLE: No authorization check
app.get('/api/vulnerable/users/:id', (req, res) => {
  logger.info('VULNERABLE BOLA: Accessing user', { targetId: req.params.id });
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Returns sensitive data without checking if requester owns it
  res.json(user);
});

// SECURE: Verify ownership
app.get('/api/secure/users/:id', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Only admin can see all, users can only see themselves
  if (req.user.role !== 'admin' && req.user.id !== userId) {
    logger.warn('BOLA Prevention: Unauthorized access attempt', { 
      attemptedId: userId, 
      userId: req.user.id 
    });
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  res.json({ id: user.id, username: user.username, email: user.email });
});

// API2: Broken Authentication
// VULNERABLE: No rate limiting, weak password check
app.post('/api/vulnerable/login', (req, res) => {
  const { username, password } = req.body;
  
  // No rate limiting allows brute force
  // No strong password requirements
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    logger.info('Failed login attempt', { username, ip: req.ip });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' }); // Long expiry!
  res.json({ token });
});

// SECURE: Rate limiting, strong requirements
app.post('/api/secure/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  
  if (!username || password.length < 8) {
    logger.warn('Login with weak credentials', { username, ip: req.ip });
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    logger.warn('Failed login attempt', { username, ip: req.ip });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Short expiry (15 minutes)
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
  logger.info('Successful login', { userId: user.id, ip: req.ip });
  res.json({ token });
});

// API3: Excessive Data Exposure
// VULNERABLE: Returns all fields
app.get('/api/vulnerable/profile/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });
  
  // Exposes sensitive fields!
  res.json(user);
});

// SECURE: Only necessary fields
app.get('/api/secure/profile/:id', verifyToken, (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });
  
  // Return only public data
  res.json({
    id: user.id,
    username: user.username,
    email: user.email
  });
});

// API4: Lack of Resources & Rate Limiting
// Applied globally via rate limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30 // 30 requests per minute
});

app.use('/api/secure/', globalLimiter);

// API5: Broken Function Level Authorization
// VULNERABLE: No role check
app.delete('/api/vulnerable/users/:id', verifyToken, (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  // Any authenticated user can delete!
  const deleted = users.splice(index, 1);
  logger.warn('VULNERABLE: User deleted without admin check', { 
    deletedId: deleted[0].id, 
    deletedBy: req.user.id 
  });
  res.json({ message: 'User deleted', user: deleted[0] });
});

// SECURE: Admin only
app.delete('/api/secure/users/:id', verifyToken, isAdmin, (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  
  const deleted = users.splice(index, 1);
  logger.info('User deleted by admin', { deletedId: deleted[0].id, adminId: req.user.id });
  res.json({ message: 'User deleted', user: { id: deleted[0].id, username: deleted[0].username } });
});

// API6: Mass Assignment
// VULNERABLE: Accepts all fields
app.put('/api/vulnerable/users/:id', verifyToken, (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });
  
  // Allows setting role to admin!
  Object.assign(user, req.body);
  logger.warn('VULNERABLE: Mass assignment allowed', { 
    userId: user.id, 
    changes: req.body 
  });
  res.json(user);
});

// SECURE: Whitelist fields
app.put('/api/secure/users/:id', verifyToken, (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });
  
  // Only allow specific fields
  if (req.body.username) user.username = req.body.username;
  if (req.body.email) user.email = req.body.email;
  // role is NOT allowed to be updated by users
  
  logger.info('User updated securely', { userId: user.id });
  res.json({ id: user.id, username: user.username, email: user.email });
});

// API7: Security Misconfiguration
// VULNERABLE: Debug enabled
app.get('/api/vulnerable/debug', (req, res) => {
  logger.warn('Debug endpoint accessed', { ip: req.ip });
  res.json({
    debug: true,
    nodeEnv: process.env.NODE_ENV,
    stack: 'Example stack trace here',
    config: {
      dbUrl: 'mongodb://user:password@localhost/mydb', // Exposing secrets!
      apiKey: 'sk_live_123456789'
    }
  });
});

// SECURE: No debug info
app.get('/api/secure/status', (req, res) => {
  res.json({ status: 'ok' });
});

// API8: Injection
// VULNERABLE: No input validation
app.post('/api/vulnerable/search', (req, res) => {
  const query = req.body.query;
  
  // Simulating vulnerable query (would be SQL injection in real DB)
  logger.warn('VULNERABLE: No input validation', { query });
  const results = users.filter(u => u.username.includes(query));
  res.json(results);
});

// SECURE: Input validation
app.post('/api/secure/search', (req, res) => {
  const query = req.body.query;
  
  // Validate input
  if (!query || typeof query !== 'string' || query.length > 100) {
    return res.status(400).json({ error: 'Invalid query' });
  }
  
  // Sanitize (in real scenario, use parameterized queries)
  const safe = query.replace(/[^a-zA-Z0-9_]/g, '');
  const results = users.filter(u => u.username.includes(safe));
  res.json(results.map(u => ({ id: u.id, username: u.username })));
});

// API9: Improper Assets Management
// VULNERABLE: Old version with no auth
app.get('/api/v1/users', (req, res) => {
  logger.warn('Old API v1 accessed (should be deprecated)', { ip: req.ip });
  res.json(users);
});

// SECURE: Current version with auth and versioning
app.get('/api/v2/users', verifyToken, isAdmin, (req, res) => {
  res.json(users.map(u => ({ id: u.id, username: u.username })));
});

// API10: Insufficient Logging & Monitoring
// All endpoints above include logging
// This endpoint shows current logs
app.get('/api/secure/logs', verifyToken, isAdmin, (req, res) => {
  res.json({
    message: 'Logs available in security.log file',
    tip: 'Check logs for: failed logins, unauthorized access, suspicious patterns'
  });
});

// ====== SUMMARY ENDPOINTS ======

app.get('/api/vulnerabilities', (req, res) => {
  res.json({
    vulnerabilities: {
      '1': { name: 'BOLA', vulnerable: '/api/vulnerable/users/:id', secure: '/api/secure/users/:id' },
      '2': { name: 'Broken Auth', vulnerable: '/api/vulnerable/login', secure: '/api/secure/login' },
      '3': { name: 'Excessive Data', vulnerable: '/api/vulnerable/profile/:id', secure: '/api/secure/profile/:id' },
      '4': { name: 'No Rate Limits', note: 'Demonstrated via global limiter on /api/secure/*' },
      '5': { name: 'Function Auth', vulnerable: '/api/vulnerable/users/:id (DELETE)', secure: '/api/secure/users/:id (DELETE)' },
      '6': { name: 'Mass Assignment', vulnerable: '/api/vulnerable/users/:id (PUT)', secure: '/api/secure/users/:id (PUT)' },
      '7': { name: 'Misc Config', vulnerable: '/api/vulnerable/debug', secure: '/api/secure/status' },
      '8': { name: 'Injection', vulnerable: '/api/vulnerable/search', secure: '/api/secure/search' },
      '9': { name: 'Asset Management', vulnerable: '/api/v1/users', secure: '/api/v2/users' },
      '10': { name: 'Logging', note: 'View logs at /api/secure/logs (admin only)' }
    }
  });
});

app.get('/api/demo-user', (req, res) => {
  res.json({
    credentials: {
      username: 'alice',
      password: 'password123'
    },
    message: 'Use these to test secure login'
  });
});

// ====== ERROR HANDLING ======
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`OWASP API Top 10 Security Server running on port ${PORT}`);
  console.log(`GET http://localhost:${PORT}/api/vulnerabilities to see all demos`);
  console.log(`GET http://localhost:${PORT}/api/demo-user to get test credentials`);
});
