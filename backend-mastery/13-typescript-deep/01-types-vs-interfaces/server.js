import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 13001;

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

// ==================== Type Examples ====================

// Type: Union for API status
// type ApiStatus = 'success' | 'error' | 'pending';

// Type: API Response shape
// type ApiResponse<T> = {
//   status: ApiStatus;
//   data?: T;
//   error?: { message: string; code: string };
//   timestamp: number;
// };

// Type: User with optional fields
// type User = {
//   id: number;
//   name: string;
//   email: string;
//   age?: number;
//   role: 'admin' | 'user' | 'moderator';
// };

// Type: Request payload
// type CreateUserRequest = Omit<User, 'id'>;

// ==================== Interface Examples ====================

// Interface: Database entity base
// interface Entity {
//   id: number;
//   createdAt: Date;
//   updatedAt: Date;
// }

// Interface: User extending Entity
// interface User extends Entity {
//   name: string;
//   email: string;
// }

// Interface: Admin extending User
// interface Admin extends User {
//   permissions: string[];
// }

// ==================== Mock Database ====================

const users = {
  1: {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  2: {
    id: 2,
    name: 'Bob',
    email: 'bob@example.com',
    role: 'user',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  3: {
    id: 3,
    name: 'Charlie',
    email: 'charlie@example.com',
    role: 'moderator',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  }
};

let nextId = 4;

// ==================== API Endpoints ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/users - Type-based response
app.get('/api/users', (req, res) => {
  try {
    const userList = Object.values(users);
    res.json({
      status: 'success',
      data: userList,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Get users error', { error: error.message });
    res.status(500).json({
      status: 'error',
      error: { message: error.message, code: 'GET_USERS_ERROR' },
      timestamp: Date.now()
    });
  }
});

// GET /api/users/:id - Return single user
app.get('/api/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = users[userId];

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
        timestamp: Date.now()
      });
    }

    res.json({
      status: 'success',
      data: user,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Get user error', { error: error.message });
    res.status(500).json({
      status: 'error',
      error: { message: error.message, code: 'GET_USER_ERROR' },
      timestamp: Date.now()
    });
  }
});

// POST /api/users - Create new user
app.post('/api/users', (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        status: 'error',
        error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' },
        timestamp: Date.now()
      });
    }

    const newUser = {
      id: nextId++,
      name,
      email,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users[newUser.id] = newUser;

    res.status(201).json({
      status: 'success',
      data: newUser,
      timestamp: Date.now()
    });

    logger.info('User created', { userId: newUser.id });
  } catch (error) {
    logger.error('Create user error', { error: error.message });
    res.status(500).json({
      status: 'error',
      error: { message: error.message, code: 'CREATE_USER_ERROR' },
      timestamp: Date.now()
    });
  }
});

// PUT /api/users/:id - Update user
app.put('/api/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = users[userId];

    if (!user) {
      return res.status(404).json({
        status: 'error',
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
        timestamp: Date.now()
      });
    }

    const { name, email, role } = req.body;
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.updatedAt = new Date();

    res.json({
      status: 'success',
      data: user,
      timestamp: Date.now()
    });

    logger.info('User updated', { userId });
  } catch (error) {
    logger.error('Update user error', { error: error.message });
    res.status(500).json({
      status: 'error',
      error: { message: error.message, code: 'UPDATE_USER_ERROR' },
      timestamp: Date.now()
    });
  }
});

// DELETE /api/users/:id
app.delete('/api/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (!users[userId]) {
      return res.status(404).json({
        status: 'error',
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
        timestamp: Date.now()
      });
    }

    delete users[userId];

    res.json({
      status: 'success',
      data: { deleted: true },
      timestamp: Date.now()
    });

    logger.info('User deleted', { userId });
  } catch (error) {
    logger.error('Delete user error', { error: error.message });
    res.status(500).json({
      status: 'error',
      error: { message: error.message, code: 'DELETE_USER_ERROR' },
      timestamp: Date.now()
    });
  }
});

// GET /api/docs - Documentation of types vs interfaces
app.get('/api/docs', (req, res) => {
  res.json({
    status: 'success',
    data: {
      title: 'Types vs Interfaces',
      endpoints: {
        'GET /api/users': 'Returns all users (Type-based response)',
        'GET /api/users/:id': 'Get single user by ID',
        'POST /api/users': 'Create new user (expects name, email, role)',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user'
      },
      requestFormat: {
        name: 'string',
        email: 'string',
        role: 'admin | user | moderator'
      },
      responseFormat: {
        status: 'success | error',
        data: 'object (on success)',
        error: { message: 'string', code: 'string' },
        timestamp: 'number'
      }
    },
    timestamp: Date.now()
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({
    status: 'error',
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    timestamp: Date.now()
  });
});

// Start server
app.listen(HTTP_PORT, () => {
  logger.info(`✅ TypeScript Types vs Interfaces server running on port ${HTTP_PORT}`);
  logger.info(`📊 API docs: http://localhost:${HTTP_PORT}/api/docs`);
  logger.info(`🏥 Health check: http://localhost:${HTTP_PORT}/api/health`);
});

export default app;
