const express = require('express');
const joi = require('joi');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4003;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);

// Mock database of users
let users = {
  1: {
    id: 1,
    name: 'Alice Admin',
    email: 'alice@test.com',
    password: 'hashedpassword123',
    role: 'admin',
    is_admin: true,
    balance: 1000,
    permissions: ['read', 'write', 'delete'],
    created_at: '2024-01-01'
  },
  2: {
    id: 2,
    name: 'Bob User',
    email: 'bob@test.com',
    password: 'hashedpassword456',
    role: 'user',
    is_admin: false,
    balance: 100,
    permissions: ['read'],
    created_at: '2024-01-02'
  },
  3: {
    id: 3,
    name: 'Charlie Customer',
    email: 'charlie@test.com',
    password: 'hashedpassword789',
    role: 'customer',
    is_admin: false,
    balance: 500,
    permissions: ['read', 'purchase'],
    created_at: '2024-01-03'
  }
};

let nextUserId = 4;

// Joi validation schemas
const loginSchema = joi.object({
  username: joi.string().required(),
  password: joi.string().required()
});

// IMPORTANT: VULNERABLE SCHEMA - accepts all fields
const vulnerableUserSchema = joi.object({
  name: joi.string().max(100),
  email: joi.string().email(),
  role: joi.string(),
  is_admin: joi.boolean(),
  balance: joi.number(),
  permissions: joi.array(),
  password: joi.string()
}).unknown(true);  // <- VULNERABLE: Accepts unknown fields

// SECURE SCHEMA - only whitelisted fields
const secureUserSchema = joi.object({
  name: joi.string().max(100).required(),
  email: joi.string().email().required()
}).unknown(false);  // <- SECURE: Rejects unknown fields

// Authentication middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && !req.user.is_admin) {
    logger.warn('Admin access denied', { user: req.user.id, path: req.path });
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Routes

// 1. Login endpoint
app.post('/api/login', (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  
  // Mock authentication
  const users_list = Object.values(users);
  const user = users_list.find(u => u.email === `${value.username}@test.com`);
  
  if (!user || value.password !== 'password123') {
    logger.warn('Failed login attempt', { username: value.username });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { id: user.id, role: user.role, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  logger.info('User logged in', { user: user.id });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

// 2. VULNERABLE ENDPOINT - accepts all fields (mass assignment)
app.post('/api/vulnerable/users', verifyToken, (req, res) => {
  const { error, value } = vulnerableUserSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  
  // VULNERABLE: Directly assigns all provided fields
  const newUser = {
    id: nextUserId++,
    ...value,  // Spreads ALL properties including is_admin, role, balance
    created_at: new Date().toISOString()
  };
  
  // Log the vulnerability
  if (value.is_admin || value.role) {
    logger.warn('Mass assignment attempt detected', {
      user: req.user.id,
      attempted_fields: Object.keys(value),
      is_admin_set: value.is_admin,
      role_set: value.role
    });
  }
  
  users[newUser.id] = newUser;
  res.status(201).json({
    message: 'User created (VULNERABLE - all fields accepted)',
    user: newUser
  });
});

// 3. SECURE ENDPOINT - only whitelisted fields
app.post('/api/secure/users', verifyToken, (req, res) => {
  const { error, value } = secureUserSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  
  // SECURE: Only assign whitelisted fields
  const newUser = {
    id: nextUserId++,
    name: value.name,
    email: value.email,
    role: 'user',  // Always default, not from request
    is_admin: false,  // Always false, not from request
    balance: 0,  // Always 0, not from request
    permissions: ['read'],  // Default permissions
    password: 'default_temp',  // Should be hashed
    created_at: new Date().toISOString()
  };
  
  logger.info('User created securely', { user: newUser.id, email: newUser.email });
  
  users[newUser.id] = newUser;
  res.status(201).json({
    message: 'User created (SECURE - only name and email accepted)',
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
  });
});

// 4. VULNERABLE ENDPOINT - User profile update vulnerable to mass assignment
app.put('/api/vulnerable/profile/:id', verifyToken, (req, res) => {
  if (parseInt(req.params.id) !== req.user.id && !req.user.is_admin) {
    return res.status(403).json({ error: 'Cannot update other users' });
  }
  
  const user = users[parseInt(req.params.id)];
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // VULNERABLE: Accepts all fields
  const { error, value } = vulnerableUserSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  
  // VULNERABLE: Direct assignment of all fields
  Object.assign(user, value);
  
  logger.warn('Profile updated with mass assignment', {
    user: req.user.id,
    modified_fields: Object.keys(value),
    new_role: user.role,
    new_is_admin: user.is_admin,
    new_balance: user.balance
  });
  
  res.json({
    message: 'Profile updated (VULNERABLE - all fields modified)',
    user
  });
});

// 5. SECURE ENDPOINT - User profile update with whitelisting
app.put('/api/secure/profile/:id', verifyToken, (req, res) => {
  if (parseInt(req.params.id) !== req.user.id && !req.user.is_admin) {
    return res.status(403).json({ error: 'Cannot update other users' });
  }
  
  const user = users[parseInt(req.params.id)];
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // SECURE: Only whitelist specific fields
  const { error, value } = secureUserSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  
  // SECURE: Only update whitelisted fields
  user.name = value.name;
  user.email = value.email;
  // Never modify: role, is_admin, balance, permissions from user input
  
  logger.info('Profile updated securely', {
    user: req.user.id,
    fields_modified: ['name', 'email']
  });
  
  res.json({
    message: 'Profile updated (SECURE - only name and email)',
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// 6. VULNERABLE ENDPOINT - Demonstrate privilege escalation
app.post('/api/vulnerable/escalate', verifyToken, (req, res) => {
  const user = users[req.user.id];
  
  // VULNERABLE: Accept role changes from request
  if (req.body.role) {
    user.role = req.body.role;
    user.is_admin = req.body.role === 'admin';
    user.permissions = req.body.permissions || ['admin_access'];
    
    logger.warn('PRIVILEGE ESCALATION VULNERABILITY', {
      user_id: req.user.id,
      old_role: 'user',
      new_role: user.role,
      new_permissions: user.permissions
    });
  }
  
  res.json({
    message: 'Vulnerability: User escalated to ' + user.role,
    user
  });
});

// 7. SECURE ENDPOINT - Privilege escalation prevention
app.post('/api/secure/escalate', verifyToken, requireAdmin, (req, res) => {
  // Only admin can call this
  const targetUserId = req.body.user_id;
  const targetUser = users[targetUserId];
  
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  
  // SECURE: Only admin can set roles from admin endpoint
  targetUser.role = req.body.role;
  targetUser.is_admin = req.body.role === 'admin';
  targetUser.permissions = getPermissionsForRole(req.body.role);
  
  logger.info('Role changed by admin', {
    admin_id: req.user.id,
    target_user: targetUserId,
    new_role: targetUser.role
  });
  
  res.json({
    message: 'Role updated securely by admin',
    user: targetUser
  });
});

// Helper function
function getPermissionsForRole(role) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users', 'view_logs'],
    moderator: ['read', 'write', 'moderate_content'],
    user: ['read', 'write'],
    customer: ['read', 'purchase']
  };
  return permissions[role] || ['read'];
}

// 8. Show all users (for testing)
app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

// 9. Get user info
app.get('/api/users/:id', verifyToken, (req, res) => {
  const user = users[parseInt(req.params.id)];
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Don't expose password and system fields to non-admin
  const response = { ...user };
  if (req.user.id !== user.id && !req.user.is_admin) {
    delete response.password;
    delete response.is_admin;
    delete response.permissions;
  }
  
  res.json(response);
});

// 10. Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    module: 'Module 03 - Mass Assignment Protection',
    port: PORT,
    cvss: '7.8 (HIGH)',
    vulnerability: 'Unrestricted modification of object properties',
    endpoints: [
      'POST /api/login - Get JWT token',
      'POST /api/vulnerable/users - VULNERABLE: all fields accepted',
      'POST /api/secure/users - SECURE: only name and email',
      'PUT /api/vulnerable/profile/:id - VULNERABLE: mass assignment',
      'PUT /api/secure/profile/:id - SECURE: whitelist approach',
      'POST /api/vulnerable/escalate - VULNERABLE: privilege escalation',
      'POST /api/secure/escalate - SECURE: admin-only',
      'GET /api/users - List all users',
      'GET /api/users/:id - Get user by ID'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Module 03 - Mass Assignment Protection running on port ${PORT}`);
  logger.info(`Test credentials: alice/password123, bob/password123, charlie/password123`);
  logger.info(`Get token first: POST /api/login`);
  logger.info(`Then test vulnerable vs secure endpoints`);
});

module.exports = app;