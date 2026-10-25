import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 13009;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(helmet());
app.use(express.json());

// Decorator Examples

// 1. Method Decorator - Logging
function LogMethod(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args) {
    console.log(`[LOG] Method called: ${propertyKey} with args:`, args);
    const result = originalMethod.apply(this, args);
    console.log(`[LOG] Method returned:`, result);
    return result;
  };
  return descriptor;
}

// 2. Method Decorator - Timer
function Timer(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args) {
    const start = Date.now();
    const result = originalMethod.apply(this, args);
    const duration = Date.now() - start;
    console.log(`[TIMER] ${propertyKey} took ${duration}ms`);
    return result;
  };
  return descriptor;
}

// 3. Parameter Decorator - Validate
function Validate(maxLength = 100) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(value) {
      if (typeof value === 'string' && value.length > maxLength) {
        throw new Error(`Value exceeds max length of ${maxLength}`);
      }
      return originalMethod.apply(this, [value]);
    };
  };
}

// User service with decorators
class UserService {
  @LogMethod
  @Timer
  getUser(id) {
    return { id, name: 'Alice', email: 'alice@test.com' };
  }

  @LogMethod
  createUser(name, email) {
    return { id: Math.random(), name, email };
  }
}

const userService = new UserService();

// Routes

app.get('/api/decorator-info', (req, res) => {
  res.json({
    message: 'Decorators in Express',
    examples: [
      '@LogMethod - Logs method calls',
      '@Timer - Measures execution time',
      '@Validate - Validates parameters',
      '@Authenticated - Auth guard',
      '@RateLimit - Rate limiting'
    ]
  });
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = userService.getUser(parseInt(req.params.id));
    res.json({
      status: 'success',
      data: user,
      message: 'User retrieved (with decorators)'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      error: error.message
    });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({
        status: 'error',
        error: 'Name and email required'
      });
    }
    const user = userService.createUser(name, email);
    res.status(201).json({
      status: 'success',
      data: user,
      message: 'User created'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(HTTP_PORT, () => {
  console.log(`Server running on http://localhost:${HTTP_PORT}`);
});
