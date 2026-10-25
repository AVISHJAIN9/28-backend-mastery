import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 13002;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(helmet());
app.use(express.json());

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// ==================== Generic API Response Types ====================

// Generic Result type with discriminated union
// type Result<T, E = { message: string; code: string }> =
//   | { ok: true; data: T; timestamp: number; duration: number }
//   | { ok: false; error: E; timestamp: number };

// type PaginatedResponse<T> = {
//   items: T[];
//   total: number;
//   page: number;
//   pageSize: number;
//   hasMore: boolean;
//   timestamp: number;
// };

// type User = {
//   id: number;
//   name: string;
//   email: string;
//   role: 'admin' | 'user' | 'moderator';
//   createdAt: Date;
// };

// type UserResult = Result<User>;
// type UserListResult = Result<PaginatedResponse<User>>;

// ==================== Mock Database ====================

const users = [
  { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin', createdAt: new Date('2024-01-01') },
  { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user', createdAt: new Date('2024-01-02') },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', role: 'moderator', createdAt: new Date('2024-01-03') },
  { id: 4, name: 'Diana', email: 'diana@test.com', role: 'user', createdAt: new Date('2024-01-04') },
  { id: 5, name: 'Eve', email: 'eve@test.com', role: 'user', createdAt: new Date('2024-01-05') }
];

let nextId = 6;

// ==================== Generic Response Builders ====================

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

function createPaginatedResponse(items, total, page, pageSize) {
  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
    timestamp: Date.now()
  };
}

// ==================== API Endpoints ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/users - Paginated list with generic pattern
app.get('/api/users', (req, res) => {
  const startTime = Date.now();
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedUsers = users.slice(start, end);
    
    const data = createPaginatedResponse(paginatedUsers, users.length, page, pageSize);
    res.json(createSuccessResponse(data, startTime));
  } catch (error) {
    logger.error('Get users error', { error: error.message });
    res.status(500).json(createErrorResponse(error.message, 'GET_ERROR'));
  }
});

// GET /api/users/:id - Single user with generic pattern
app.get('/api/users/:id', (req, res) => {
  const startTime = Date.now();
  try {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json(createErrorResponse('User not found', 'NOT_FOUND'));
    }

    res.json(createSuccessResponse(user, startTime));
  } catch (error) {
    logger.error('Get user error', { error: error.message });
    res.status(500).json(createErrorResponse(error.message, 'GET_ERROR'));
  }
});

// POST /api/users - Create user with generic validation
app.post('/api/users', (req, res) => {
  const startTime = Date.now();
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json(createErrorResponse('Missing required fields', 'VALIDATION_ERROR'));
    }

    if (!['admin', 'user', 'moderator'].includes(role)) {
      return res.status(400).json(createErrorResponse('Invalid role', 'INVALID_ROLE'));
    }

    const newUser = {
      id: nextId++,
      name,
      email,
      role,
      createdAt: new Date()
    };

    users.push(newUser);
    res.status(201).json(createSuccessResponse(newUser, startTime));
  } catch (error) {
    logger.error('Create user error', { error: error.message });
    res.status(500).json(createErrorResponse(error.message, 'CREATE_ERROR'));
  }
});

// PUT /api/users/:id - Update user
app.put('/api/users/:id', (req, res) => {
  const startTime = Date.now();
  try {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json(createErrorResponse('User not found', 'NOT_FOUND'));
    }

    const { name, email, role } = req.body;
    const user = users[userIndex];

    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ['admin', 'user', 'moderator'].includes(role)) user.role = role;

    users[userIndex] = user;
    res.json(createSuccessResponse(user, startTime));
  } catch (error) {
    logger.error('Update user error', { error: error.message });
    res.status(500).json(createErrorResponse(error.message, 'UPDATE_ERROR'));
  }
});

// DELETE /api/users/:id
app.delete('/api/users/:id', (req, res) => {
  const startTime = Date.now();
  try {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json(createErrorResponse('User not found', 'NOT_FOUND'));
    }

    const deleted = users.splice(userIndex, 1)[0];
    res.json(createSuccessResponse({ deleted: true, user: deleted }, startTime));
  } catch (error) {
    logger.error('Delete user error', { error: error.message });
    res.status(500).json(createErrorResponse(error.message, 'DELETE_ERROR'));
  }
});

// GET /api/users/filter/:role - Filter by role (generic pattern)
app.get('/api/users-by-role/:role', (req, res) => {
  const startTime = Date.now();
  try {
    const { role } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));

    const filtered = users.filter(u => u.role === role);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const data = createPaginatedResponse(filtered.slice(start, end), filtered.length, page, pageSize);
    res.json(createSuccessResponse(data, startTime));
  } catch (error) {
    logger.error('Filter users error', { error: error.message });
    res.status(500).json(createErrorResponse(error.message, 'FILTER_ERROR'));
  }
});

// GET /api/batch/:ids - Get multiple users (generic batch operation)
app.get('/api/batch', (req, res) => {
  const startTime = Date.now();
  try {
    const { ids } = req.query;
    if (!ids || typeof ids !== 'string') {
      return res.status(400).json(createErrorResponse('ids query parameter required', 'INVALID_INPUT'));
    }

    const idArray = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    const batchUsers = users.filter(u => idArray.includes(u.id));

    res.json(createSuccessResponse({ requested: idArray.length, found: batchUsers.length, users: batchUsers }, startTime));
  } catch (error) {
    logger.error('Batch get error', { error: error.message });
    res.status(500).json(createErrorResponse(error.message, 'BATCH_ERROR'));
  }
});

// POST /api/search - Search with generic filters
app.post('/api/search', (req, res) => {
  const startTime = Date.now();
  try {
    const { query, filters } = req.body;

    let results = users;

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(u =>
        u.name.toLowerCase().includes(lowerQuery) ||
        u.email.toLowerCase().includes(lowerQuery)
      );
    }

    if (filters) {
      if (filters.role) {
        results = results.filter(u => u.role === filters.role);
      }
    }

    res.json(createSuccessResponse({ count: results.length, results }, startTime));
  } catch (error) {
    logger.error('Search error', { error: error.message });
    res.status(500).json(createErrorResponse(error.message, 'SEARCH_ERROR'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'));
});

// Start server
app.listen(HTTP_PORT, () => {
  logger.info(`✅ TypeScript Generics & API Response patterns server running on port ${HTTP_PORT}`);
  logger.info(`📊 API docs: http://localhost:${HTTP_PORT}/api/health`);
});

export default app;
