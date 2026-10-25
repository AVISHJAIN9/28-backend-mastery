/**
 * Module 13.7: Mapped & Template Literal Types
 * Uses computed property names and type transformations
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
  { id: 1, name: 'Alice', email: 'alice@test.com', isActive: true },
  { id: 2, name: 'Bob', email: 'bob@test.com', isActive: true },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', isActive: false }
];

/**
 * Demo: Mapped Types for Field Transformations
 */

// Transform object to getters
const userGetters = {
  getName: (u) => u.name,
  getEmail: (u) => u.email,
  getId: (u) => u.id,
  getIsActive: (u) => u.isActive
};

// Transform object to setters
const userSetters = {
  setName: (u, v) => { u.name = v; },
  setEmail: (u, v) => { u.email = v; },
  setIsActive: (u, v) => { u.isActive = v; }
};

/**
 * GET /api/users/getters
 * Use mapped getters pattern
 */
app.get('/api/users/getters', (req, res) => {
  const transformedUsers = users.map(u => ({
    getId: userGetters.getId(u),
    getName: userGetters.getName(u),
    getEmail: userGetters.getEmail(u),
    getIsActive: userGetters.getIsActive(u)
  }));

  res.json({ ok: true, data: transformedUsers });
});

/**
 * Template Literal: Routes with autocomplete
 */

// Simulate route definitions using template literals
const routes = {
  'users.get': { method: 'GET', path: '/users' },
  'users.list': { method: 'GET', path: '/users/all' },
  'users.create': { method: 'POST', path: '/users' },
  'users.update': { method: 'PUT', path: '/users/:id' },
  'users.delete': { method: 'DELETE', path: '/users/:id' },
  'posts.get': { method: 'GET', path: '/posts' },
  'posts.create': { method: 'POST', path: '/posts' },
  'posts.delete': { method: 'DELETE', path: '/posts/:id' }
};

/**
 * GET /api/routes
 * List all available routes (template literal pattern)
 */
app.get('/api/routes', (req, res) => {
  res.json({ ok: true, data: routes });
});

/**
 * Mapped types for state transformation
 */
const userLoadingStates = {
  getUserLoading: false,
  listUsersLoading: false,
  createUserLoading: false,
  updateUserLoading: false,
  deleteUserLoading: false
};

const userErrorStates = {
  getUserError: null,
  listUsersError: null,
  createUserError: null,
  updateUserError: null,
  deleteUserError: null
};

/**
 * GET /api/users
 * Return state + data
 */
app.get('/api/users', (req, res) => {
  res.json({
    ok: true,
    data: users,
    loading: userLoadingStates.listUsersLoading,
    error: userErrorStates.listUsersError,
    timestamp: Date.now()
  });
});

/**
 * GET /api/users/:id
 */
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({
      ok: false,
      error: 'User not found',
      timestamp: Date.now()
    });
  }

  res.json({
    ok: true,
    data: user,
    loading: userLoadingStates.getUserLoading,
    error: userErrorStates.getUserError,
    timestamp: Date.now()
  });
});

/**
 * POST /api/users
 */
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      ok: false,
      error: 'Name and email required',
      errors: {
        name: !name ? 'Name is required' : null,
        email: !email ? 'Email is required' : null
      },
      timestamp: Date.now()
    });
  }

  const newUser = {
    id: Math.max(...users.map(u => u.id), 0) + 1,
    name,
    email,
    isActive: true
  };

  users.push(newUser);

  res.status(201).json({
    ok: true,
    data: newUser,
    timestamp: Date.now()
  });
});

/**
 * PUT /api/users/:id
 */
app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({
      ok: false,
      error: 'User not found',
      timestamp: Date.now()
    });
  }

  // Use mapped setters style update
  if (req.body.name !== undefined) {userSetters.setName(user, req.body.name); }
  if (req.body.email !== undefined) { userSetters.setEmail(user, req.body.email); }
  if (req.body.isActive !== undefined) { userSetters.setIsActive(user, req.body.isActive); }

  res.json({
    ok: true,
    data: user,
    timestamp: Date.now()
  });
});

/**
 * DELETE /api/users/:id
 */
app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({
      ok: false,
      error: 'User not found',
      timestamp: Date.now()
    });
  }

  const deleted = users.splice(index, 1)[0];
  res.json({
    ok: true,
    data: deleted,
    message: 'User deleted',
    timestamp: Date.now()
  });
});

const PORT = process.env.HTTP_PORT || 13007;

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Mapped & Template Literal Types`);
  console.log(`   - Getter/Setter transformation pattern`);
  console.log(`   - Template literal route definitions`);
  console.log(`   - Mapped state transformations`);
});
