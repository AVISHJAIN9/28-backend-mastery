/**
 * Module 13.5: Discriminated Unions - Type-Safe Type Narrowing
 * All API responses use discriminated union pattern
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

const users = [
  { id: 1, name: 'Alice', email: 'alice@test.com', status: 'active' },
  { id: 2, name: 'Bob', email: 'bob@test.com', status: 'inactive' },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', status: 'active' }
];

let nextId = 4;

/**
 * Discriminated Union Response Pattern
 * { ok: true, data: T } | { ok: false, error: E }
 */

function successResponse(data, statusCode = 200, message = null) {
  return {
    type: 'success',
    ok: true,
    status: statusCode,
    data,
    message,
    timestamp: Date.now()
  };
}

function errorResponse(message, code = 'ERROR', statusCode = 400) {
  return {
    type: 'error',
    ok: false,
    status: statusCode,
    error: { message, code },
    timestamp: Date.now()
  };
}

/**
 * POST /api/users
 * Create user with discriminated response
 */
app.post('/api/users', (req, res) => {
  const { name, email, status } = req.body;

  if (!name || !email) {
    return res.status(400).json(
      errorResponse('Name and email required', 'VALIDATION_ERROR')
    );
  }

  const newUser = { id: nextId++, name, email, status: status || 'active' };
  users.push(newUser);

  res.status(201).json(successResponse(newUser, 201, 'User created'));
});

/**
 * GET /api/users
 */
app.get('/api/users', (req, res) => {
  res.json(successResponse(users, 200, 'Users retrieved'));
});

/**
 * GET /api/users/:id
 */
app.get('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json(
      errorResponse('User not found', 'NOT_FOUND', 404)
    );
  }

  res.json(successResponse(user, 200, 'User retrieved'));
});

/**
 * PUT /api/users/:id
 */
app.put('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json(
      errorResponse('User not found', 'NOT_FOUND', 404)
    );
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  if (req.body.status) user.status = req.body.status;

  res.json(successResponse(user, 200, 'User updated'));
});

/**
 * DELETE /api/users/:id
 */
app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json(
      errorResponse('User not found', 'NOT_FOUND', 404)
    );
  }

  users.splice(index, 1);
  res.json(successResponse({ deleted: true, id }, 200, 'User deleted'));
});

/**
 * POST /api/users/search
 * Search users - can fail at different stages
 */
app.post('/api/users/search', (req, res) => {
  const { query, status: filterStatus } = req.body;

  if (!query) {
    return res.status(400).json(
      errorResponse('Query required', 'VALIDATION_ERROR')
    );
  }

  let results = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  if (filterStatus) {
    results = results.filter(u => u.status === filterStatus);
  }

  res.json(successResponse(results, 200, `Found ${results.length} users`));
});

/**
 * Discriminated Union for Auth State
 */
const loginAttempts = {};

/**
 * POST /api/auth/login
 * Multi-stage response with discriminated union
 */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Stage 1: Input validation
  if (!email || !password) {
    return res.status(400).json(
      errorResponse('Email and password required', 'VALIDATION_ERROR')
    );
  }

  // Stage 2: User lookup
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json(
      errorResponse('Invalid credentials', 'AUTH_FAILED', 401)
    );
  }

  // Stage 3: Check account status
  if (user.status !== 'active') {
    return res.status(403).json(
      errorResponse('Account inactive', 'ACCOUNT_DISABLED', 403)
    );
  }

  // Success
  res.json({
    type: 'auth_success',
    ok: true,
    data: {
      user,
      token: 'eyJhbGc...',
      expiresIn: 3600
    },
    timestamp: Date.now()
  });
});

const PORT = process.env.HTTP_PORT || 13005;

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Discriminated Union pattern for all responses`);
  console.log(`   { ok: true, data: T } | { ok: false, error: E }`);
});
