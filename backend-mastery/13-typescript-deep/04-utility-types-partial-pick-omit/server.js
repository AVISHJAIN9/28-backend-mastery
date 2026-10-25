/**
 * Module 13.4: Utility Types - Partial, Pick, Omit, Record, Readonly
 * Demonstrates type transformation utilities
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// Full User model
const users = [
  { id: 1, name: 'Alice', email: 'alice@test.com', password: 'hashed1', role: 'admin', createdAt: new Date() },
  { id: 2, name: 'Bob', email: 'bob@test.com', password: 'hashed2', role: 'user', createdAt: new Date() },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', password: 'hashed3', role: 'user', createdAt: new Date() }
];

let nextId = 4;

// Helper responses
function ok(data) {
  return { ok: true, data, timestamp: Date.now() };
}

function err(message) {
  return { ok: false, error: message, timestamp: Date.now() };
}

/**
 * POST /api/users
 * Create user (Omit id, createdAt)
 */
app.post('/api/users', (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json(err('Missing required fields'));
  }

  const newUser = {
    id: nextId++,
    name,
    email,
    password,
    role: role || 'user',
    createdAt: new Date()
  };

  users.push(newUser);
  res.status(201).json(ok(newUser));
});

/**
 * GET /api/users
 * List users with pagination
 */
app.get('/api/users', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const start = (page - 1) * pageSize;
  const items = users.slice(start, start + pageSize);

  res.json(ok({
    items,
    total: users.length,
    page,
    hasMore: start + pageSize < users.length
  }));
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json(err('User not found'));
  res.json(ok(user));
});

/**
 * PUT /api/users/:id
 * Update user (Partial fields)
 */
app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json(err('User not found'));

  // Only allow updating certain fields
  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  if (req.body.role) user.role = req.body.role;

  res.json(ok(user));
});

/**
 * GET /api/users-public
 * Public view (Pick only safe fields, Readonly)
 */
app.get('/api/users-public', (req, res) => {
  const publicUsers = users.map(u => ({
    id: u.id,
    name: u.name,
    role: u.role
  }));
  res.json(ok(publicUsers));
});

/**
 * POST /api/validate-permissions
 * Validate role-based permissions (Record<Role, Permissions>)
 */
const permissionMatrix = {
  admin: ['read', 'write', 'delete', 'manage_users'],
  user: ['read', 'write'],
  moderator: ['read', 'write', 'moderate']
};

app.post('/api/validate-permissions', (req, res) => {
  const { role, action } = req.body;
  
  if (!permissionMatrix[role]) {
    return res.status(400).json(err('Invalid role'));
  }

  const hasPermission = permissionMatrix[role].includes(action);
  res.json(ok({ role, action, hasPermission, allowed: permissionMatrix[role] }));
});

/**
 * GET /api/stats
 * Statistics endpoint
 */
app.get('/api/stats', (req, res) => {
  res.json(ok({
    totalUsers: users.length,
    byRole: {
      admin: users.filter(u => u.role === 'admin').length,
      user: users.filter(u => u.role === 'user').length,
      moderator: users.filter(u => u.role === 'moderator').length
    }
  }));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json(err('Internal server error'));
});

const PORT = process.env.HTTP_PORT || 13004;

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Utility Types demonstration`);
  console.log(`   - Partial<T> in updates`);
  console.log(`   - Pick<T,K> in public API`);
  console.log(`   - Omit<T,K> in create`);
  console.log(`   - Record<K,V> in permissions`);
});
