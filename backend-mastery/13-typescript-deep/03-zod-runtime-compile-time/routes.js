/**
 * Routes using Zod schema validation
 * All endpoints validate input through schemas
 */

import express from 'express';
import {
  userSchema,
  createUserSchema,
  updateUserSchema,
  passwordSchema,
  signupSchema,
  searchQuerySchema,
  batchCreateSchema,
  createResultSchema,
  ValidationService
} from './controller.js';

const router = express.Router();

// Mock database
const users = [
  { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin', isActive: true },
  { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user', isActive: true },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', role: 'moderator', isActive: true },
  { id: 4, name: 'Diana', email: 'diana@test.com', role: 'user', isActive: false },
  { id: 5, name: 'Eve', email: 'eve@test.com', role: 'user', isActive: true }
];

let nextId = 6;

function createSuccessResponse(data, startTime = Date.now()) {
  return {
    ok: true,
    data,
    timestamp: Date.now(),
    duration: Date.now() - startTime
  };
}

function createErrorResponse(message, code) {
  return {
    ok: false,
    error: { message, code },
    timestamp: Date.now()
  };
}

/**
 * POST /validate/user - Validate user schema
 */
router.post('/validate/user', (req, res) => {
  const startTime = Date.now();
  const result = ValidationService.validate(createUserSchema, req.body);

  if (!result.success) {
    return res.status(400).json({
      ...createErrorResponse('Validation failed', 'VALIDATION_ERROR'),
      errors: result.error.flatten()
    });
  }

  res.json(createSuccessResponse(result.data, startTime));
});

/**
 * POST /validate/password - Validate password rules
 */
router.post('/validate/password', (req, res) => {
  const startTime = Date.now();
  const { password } = req.body;

  const result = ValidationService.validate(passwordSchema, password);

  if (!result.success) {
    const error = ValidationService.getFirstError(result.error);
    return res.status(400).json({
      ...createErrorResponse(error.message, 'PASSWORD_INVALID'),
      issues: result.error.issues
    });
  }

  res.json(createSuccessResponse({ valid: true }, startTime));
});

/**
 * POST /validate/signup - Validate signup form
 */
router.post('/validate/signup', (req, res) => {
  const startTime = Date.now();
  const result = ValidationService.validate(signupSchema, req.body);

  if (!result.success) {
    const flatErrors = result.error.flatten();
    return res.status(400).json({
      ...createErrorResponse('Form validation failed', 'FORM_INVALID'),
      errors: flatErrors
    });
  }

  res.json(createSuccessResponse({ email: result.data.email }, startTime));
});

/**
 * POST /users - Create user
 */
router.post('/users', (req, res) => {
  const startTime = Date.now();
  const result = ValidationService.validate(createUserSchema, req.body);

  if (!result.success) {
    return res.status(400).json(
      createErrorResponse('Invalid user data', 'VALIDATION_ERROR')
    );
  }

  const newUser = {
    id: nextId++,
    ...result.data
  };

  users.push(newUser);

  res.status(201).json(createSuccessResponse(newUser, startTime));
});

/**
 * GET /users - List users (paginated)
 */
router.get('/users', (req, res) => {
  const startTime = Date.now();

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, parseInt(req.query.pageSize) || 10);

  const total = users.length;
  const start = (page - 1) * pageSize;
  const items = users.slice(start, start + pageSize);

  res.json(createSuccessResponse({
    items,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total
  }, startTime));
});

/**
 * GET /users/:id - Get user by ID
 */
router.get('/users/:id', (req, res) => {
  const startTime = Date.now();
  const id = parseInt(req.params.id);

  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json(
      createErrorResponse('User not found', 'NOT_FOUND')
    );
  }

  res.json(createSuccessResponse(user, startTime));
});

/**
 * PUT /users/:id - Update user
 */
router.put('/users/:id', (req, res) => {
  const startTime = Date.now();
  const id = parseInt(req.params.id);

  const result = ValidationService.validate(updateUserSchema, req.body);
  if (!result.success) {
    return res.status(400).json(
      createErrorResponse('Invalid update data', 'VALIDATION_ERROR')
    );
  }

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json(
      createErrorResponse('User not found', 'NOT_FOUND')
    );
  }

  users[userIndex] = { ...users[userIndex], ...result.data };
  res.json(createSuccessResponse(users[userIndex], startTime));
});

/**
 * DELETE /users/:id - Delete user
 */
router.delete('/users/:id', (req, res) => {
  const startTime = Date.now();
  const id = parseInt(req.params.id);

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json(
      createErrorResponse('User not found', 'NOT_FOUND')
    );
  }

  const deleted = users.splice(userIndex, 1)[0];
  res.json(createSuccessResponse(deleted, startTime));
});

/**
 * POST /search - Search users
 */
router.post('/search', (req, res) => {
  const startTime = Date.now();

  // Validate and transform query parameters
  const result = ValidationService.validate(searchQuerySchema, {
    query: req.body.query,
    role: req.body.role,
    isActive: req.body.isActive,
    page: req.body.page || 1,
    pageSize: req.body.pageSize || 10
  });

  if (!result.success) {
    return res.status(400).json(
      createErrorResponse('Invalid search', 'INVALID_SEARCH')
    );
  }

  const { query, role, isActive, page, pageSize } = result.data;

  let filtered = users;
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }
  if (role) filtered = filtered.filter(u => u.role === role);
  if (typeof isActive === 'boolean') filtered = filtered.filter(u => u.isActive === isActive);

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  res.json(createSuccessResponse({
    items,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total
  }, startTime));
});

/**
 * POST /batch-create - Create multiple users
 */
router.post('/batch-create', (req, res) => {
  const startTime = Date.now();

  const result = ValidationService.validate(batchCreateSchema, req.body);
  if (!result.success) {
    return res.status(400).json(
      createErrorResponse('Invalid batch', 'VALIDATION_ERROR')
    );
  }

  const created = result.data.users.map(userData => {
    const newUser = { id: nextId++, ...userData };
    users.push(newUser);
    return newUser;
  });

  res.status(201).json(createSuccessResponse({
    created: created.length,
    users: created
  }, startTime));
});

/**
 * GET /stats - Get stats
 */
router.get('/stats', (req, res) => {
  const startTime = Date.now();

  res.json(createSuccessResponse({
    total: users.length,
    active: users.filter(u => u.isActive).length,
    byRole: {
      admin: users.filter(u => u.role === 'admin').length,
      user: users.filter(u => u.role === 'user').length,
      moderator: users.filter(u => u.role === 'moderator').length
    }
  }, startTime));
});

export default router;

