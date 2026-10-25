/**
 * Module 13.6: Declaration Merging & Extend Express
 * Augments Express Request/Response with custom properties
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

// Mock users
const users = [
  { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin' },
  { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user' },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', role: 'moderator' }
];

/**
 * REQUEST AUGMENTATION
 * Add custom properties to Express.Request
 */

// Auth middleware - sets req.user
app.use((req, res, next) => {
  // Simulate authenticated user
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const userId = parseInt(authHeader.split(' ')[1]) || 1;
    req.user = users.find(u => u.id === userId) || users[0];
  }
  next();
});

// Request context middleware - sets req.context
app.use((req, res, next) => {
  req.context = {
    requestId: `req_${Date.now()}`,
    startTime: Date.now(),
    method: req.method,
    path: req.path
  };
  next();
});

// Validation middleware - sets req.validated
app.use((req, res, next) => {
  req.validated = {};
  next();
});

/**
 * RESPONSE AUGMENTATION
 * Add helper methods to Express.Response
 */

app.use((req, res, next) => {
  // Helper: Send success response
  res.sendSuccess = function(data, message = null) {
    return this.json({
      ok: true,
      data,
      message,
      requestId: req.context?.requestId,
      timestamp: Date.now()
    });
  };

  // Helper: Send error response
  res.sendError = function(error, statusCode = 400) {
    return this.status(statusCode).json({
      ok: false,
      error: typeof error === 'string' ? error : error.message,
      requestId: req.context?.requestId,
      timestamp: Date.now()
    });
  };

  // Helper: Send paginated response
  res.sendPaginated = function(items, total, page = 1, pageSize = 10) {
    return this.json({
      ok: true,
      data: {
        items,
        total,
        page,
        pageSize,
        hasMore: (page * pageSize) < total
      },
      requestId: req.context?.requestId,
      timestamp: Date.now()
    });
  };

  next();
});

/**
 * ROUTES using augmented Request/Response
 */

/**
 * GET /api/users
 * Requires authentication via req.user
 */
app.get('/api/users', (req, res) => {
  if (!req.user) {
    return res.sendError('Not authenticated', 401);
  }

  res.sendSuccess(users, 'Users retrieved');
});

/**
 * GET /api/users/:id
 */
app.get('/api/users/:id', (req, res) => {
  if (!req.user) {
    return res.sendError('Not authenticated', 401);
  }

  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.sendError('User not found', 404);
  }

  res.sendSuccess(user, 'User retrieved');
});

/**
 * POST /api/users
 * Create user - requires admin role
 */
app.post('/api/users', (req, res) => {
  if (!req.user) {
    return res.sendError('Not authenticated', 401);
  }

  if (req.user.role !== 'admin') {
    return res.sendError('Insufficient permissions', 403);
  }

  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.sendError({ message: 'Name and email required' }, 400);
  }

  const newUser = {
    id: Math.max(...users.map(u => u.id)) + 1,
    name,
    email,
    role: role || 'user'
  };

  users.push(newUser);
  res.sendSuccess(newUser, 'User created');
});

/**
 * PUT /api/users/:id
 */
app.put('/api/users/:id', (req, res) => {
  if (!req.user) {
    return res.sendError('Not authenticated', 401);
  }

  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.sendError('User not found', 404);
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  if (req.body.role && req.user.role === 'admin') {
    user.role = req.body.role;
  }

  res.sendSuccess(user, 'User updated');
});

/**
 * DELETE /api/users/:id
 */
app.delete('/api/users/:id', (req, res) => {
  if (!req.user) {
    return res.sendError('Not authenticated', 401);
  }

  if (req.user.role !== 'admin') {
    return res.sendError('Insufficient permissions', 403);
  }

  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) {
    return res.sendError('User not found', 404);
  }

  const deleted = users.splice(index, 1)[0];
  res.sendSuccess(deleted, 'User deleted');
});

/**
 * GET /api/context
 * Return request context
 */
app.get('/api/context', (req, res) => {
  const duration = Date.now() - req.context.startTime;
  res.json({
    ...req.context,
    duration,
    user: req.user ? { id: req.user.id, role: req.user.role } : null
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.sendError('Internal server error', 500);
});

const PORT = process.env.HTTP_PORT || 13006;

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Declaration Merging - Express Request/Response augmented`);
  console.log(`   - req.user: Authentication context`);
  console.log(`   - req.context: Request metadata`);
  console.log(`   - res.sendSuccess(): Helper method`);
  console.log(`   - res.sendError(): Helper method`);
  console.log(`   - res.sendPaginated(): Pagination helper`);
});
