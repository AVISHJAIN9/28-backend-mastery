const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3016;

// Module 16: Error Handling Deep Patterns

// Custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}

// Route: Error types
app.get('/api/errors/types', (req, res) => {
  res.json({
    builtIn: [
      {
        type: 'Error',
        description: 'Generic error'
      },
      {
        type: 'TypeError',
        description: 'Type mismatch',
        example: 'JSON.parse(undefined)'
      },
      {
        type: 'RangeError',
        description: 'Invalid range',
        example: 'new Array(-1)'
      },
      {
        type: 'SyntaxError',
        description: 'Parse error',
        example: 'JSON.parse("invalid")'
      },
      {
        type: 'ReferenceError',
        description: 'Undefined variable',
        example: 'console.log(undefined_var)'
      }
    ]
  });
});

// Route: Custom error demo
app.post('/api/errors/custom', (req, res) => {
  const { errorType } = req.body;

  try {
    switch (errorType) {
      case 'validation':
        throw new ValidationError('Invalid input format');

      case 'notfound':
        throw new NotFoundError('Resource not found');

      case 'database':
        throw new DatabaseError('DB connection failed');

      default:
        throw new Error('Unknown error type');
    }
  } catch (error) {
    res.status(error.statusCode || 500).json({
      name: error.name,
      message: error.message,
      statusCode: error.statusCode || 500
    });
  }
});

// Route: Stack traces
app.post('/api/errors/stack-trace', (req, res) => {
  try {
    throw new Error('Intentional error for demonstration');
  } catch (error) {
    res.json({
      name: error.name,
      message: error.message,
      stack: error.stack,
      stackLines: error.stack.split('\n').length,
      explanation: 'Shows function call hierarchy'
    });
  }
});

// Route: Error propagation
app.post('/api/errors/propagation', async (req, res) => {
  const { pattern } = req.body;

  try {
    switch (pattern) {
      case 'throw': {
        throw new Error('Thrown error');
      }

      case 'promise-reject': {
        return await Promise.reject(new Error('Rejected promise'));
      }

      case 'async-throw': {
        async function asyncFunc() {
          throw new Error('Async function error');
        }
        return await asyncFunc();
      }

      case 'callback': {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Callback error'));
          }, 10);
        });
      }

      default:
        throw new Error('Unknown pattern');
    }
  } catch (error) {
    res.status(500).json({
      pattern,
      caught: true,
      error: error.message
    });
  }
});

// Route: Error handling strategies
app.get('/api/errors/strategies', (req, res) => {
  res.json({
    strategies: [
      {
        name: 'Try-Catch',
        use: 'Synchronous and async/await code',
        code: 'try { } catch (e) { }',
        scope: 'Current scope'
      },
      {
        name: 'Promise.catch()',
        use: 'Promise chains',
        code: 'promise.catch(error => {})',
        scope: 'Promise chain'
      },
      {
        name: 'Error Event',
        use: 'Streams, emitters',
        code: 'emitter.on("error", (e) => {})',
        scope: 'Emitter listeners'
      },
      {
        name: 'Middleware',
        use: 'Express/Connect',
        code: 'app.use((err, req, res, next) => {})',
        scope: 'HTTP requests'
      },
      {
        name: 'Global Handlers',
        use: 'Uncaught errors',
        code: 'process.on("uncaughtException", (err) => {})',
        scope: 'Process-wide'
      }
    ]
  });
});

// Route: Async error handling patterns
app.post('/api/errors/async-patterns', async (req, res) => {
  const { pattern } = req.body;

  try {
    switch (pattern) {
      case 'try-catch': {
        try {
          throw new Error('Async error');
        } catch (error) {
          res.json({ pattern, caught: true, method: 'try-catch' });
        }
        break;
      }

      case 'promise-chain': {
        return Promise.reject(new Error('Chain error'))
          .catch(error => {
            res.json({ pattern, caught: true, method: 'promise-chain' });
          });
      }

      case 'finally': {
        let cleaned = false;
        try {
          throw new Error('Error in finally demo');
        } catch (error) {
          // Handle
        } finally {
          cleaned = true;
        }
        res.json({ pattern, cleaned, finally: 'always executes' });
        break;
      }

      default:
        res.json({ error: 'Unknown pattern' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Error wrapping
app.post('/api/errors/wrapping', async (req, res) => {
  try {
    try {
      throw new Error('Original error');
    } catch (error) {
      // Wrap with context
      const wrapped = new Error('Database operation failed');
      wrapped.originalError = error;
      wrapped.operation = 'SELECT * FROM users';
      wrapped.timestamp = new Date();
      throw wrapped;
    }
  } catch (error) {
    res.json({
      message: error.message,
      operation: error.operation,
      originalError: error.originalError.message,
      timestamp: error.timestamp,
      benefit: 'Adds context to errors'
    });
  }
});

// Route: Structured error responses
app.get('/api/errors/structured', (req, res) => {
  res.json({
    errorResponse: {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        requestId: 'req-123',
        details: {
          field: 'email',
          reason: 'Invalid format'
        }
      }
    },
    benefits: [
      'Consistent error format',
      'Easy client-side handling',
      'Better logging/monitoring',
      'Debugging friendly'
    ]
  });
});

// Route: Common error patterns
app.get('/api/errors/common-patterns', (req, res) => {
  res.json({
    patterns: [
      {
        name: 'Null Check',
        code: 'if (!value) throw new Error("Value required")',
        why: 'Prevent undefined errors'
      },
      {
        name: 'Type Check',
        code: 'if (typeof value !== "string") throw new TypeError()',
        why: 'Ensure correct types'
      },
      {
        name: 'Range Check',
        code: 'if (value < 0 || value > 100) throw new RangeError()',
        why: 'Validate boundaries'
      },
      {
        name: 'Timeout',
        code: 'Promise.race([op, timeout])',
        why: 'Prevent infinite hangs'
      },
      {
        name: 'Retry',
        code: 'async function retry(fn, n) { ... }',
        why: 'Handle transient failures'
      }
    ]
  });
});

// Route: Error monitoring
app.post('/api/errors/monitor', (req, res) => {
  res.json({
    tools: [
      'Sentry - Error tracking',
      'LogRocket - Session replay',
      'DataDog - Monitoring',
      'New Relic - APM',
      'Rollbar - Error aggregation'
    ],
    whatToTrack: [
      'Error type and message',
      'Stack trace',
      'Request context',
      'User information',
      'System state',
      'Frequency and patterns'
    ],
    metadata: {
      shouldInclude: [
        'userId',
        'requestId',
        'url',
        'userAgent',
        'serverVersion',
        'environmentName'
      ],
      shouldNOTInclude: [
        'passwords',
        'tokens',
        'sensitive PII',
        'API keys'
      ]
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Error Handling server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  GET /api/errors/types - Built-in error types');
  console.log('  POST /api/errors/custom - Custom errors');
  console.log('  POST /api/errors/stack-trace - Stack traces');
  console.log('  POST /api/errors/propagation - Propagation');
  console.log('  GET /api/errors/strategies - Strategies');
  console.log('  POST /api/errors/async-patterns - Async patterns');
  console.log('  POST /api/errors/wrapping - Error wrapping');
  console.log('  GET /api/errors/structured - Structured responses');
  console.log('  GET /api/errors/common-patterns - Common patterns');
  console.log('  POST /api/errors/monitor - Monitoring');
});

module.exports = app;
