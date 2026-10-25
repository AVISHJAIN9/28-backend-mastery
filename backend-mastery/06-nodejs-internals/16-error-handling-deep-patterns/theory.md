# Error Handling: Deep Patterns - Complete Guide

## Overview

Error handling is critical for robust applications. This module covers Custom Error classes, error propagation strategies, async error patterns, and production-ready error handling with monitoring and logging.

## Part 1: Error Fundamentals

### Error Types in Node.js

```javascript
// 1. Standard Error
const err = new Error('Something went wrong');
console.log(err instanceof Error); // true
console.log(err.message); // 'Something went wrong'
console.log(err.stack); // Full stack trace

// 2. EvalError (rarely used)
// 3. RangeError
const arr = new Array(-1); // RangeError

// 4. ReferenceError
console.log(undefinedVariable); // ReferenceError

// 5. SyntaxError
eval('invalid syntax'); // SyntaxError

// 6. TypeError
const fn = 'string';
fn(); // TypeError: fn is not a function

// 7. URIError
decodeURIComponent('%'); // URIError
```

### Custom Error Classes

```javascript
// Basic custom error
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Usage
try {
  if (!email.includes('@')) {
    throw new ValidationError('Invalid email format');
  }
} catch (e) {
  if (e instanceof ValidationError) {
    console.log('Validation failed:', e.message);
  }
}

// Advanced custom error with metadata
class ApiError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode || 500;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.errorCode,
      statusCode: this.statusCode
    };
  }
}

// Usage in Express
app.get('/api/user/:id', (req, res, next) => {
  try {
    if (!req.params.id) {
      throw new ApiError('User ID required', 400, 'MISSING_ID');
    }
    // ...
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(err.toJSON());
  } else {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
```

## Part 2: Callback Error Handling

### Error-First Callback Pattern

```javascript
// Standard Node.js pattern: error is FIRST parameter
fs.readFile('file.txt', (err, data) => {
  if (err) {
    console.error('Failed to read file:', err.message);
    return; // MUST return to prevent further execution
  }
  console.log('File content:', data);
});

// Custom function with error-first callback
function fetchUser(userId, callback) {
  if (!userId) {
    return callback(new Error('User ID required'));
  }

  db.find(userId, (err, user) => {
    if (err) {
      return callback(err); // Propagate error
    }
    callback(null, user); // null = no error
  });
}

// Usage
fetchUser(123, (err, user) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('User found:', user);
  }
});
```

### Callback Hell & Error Propagation

```javascript
// ❌ Callback hell with error handling
fs.readFile('config.json', (err, data) => {
  if (err) {
    console.error('Config error:', err);
    return;
  }
  
  const config = JSON.parse(data);
  
  db.connect(config, (err) => {
    if (err) {
      console.error('Connection error:', err);
      return;
    }
    
    db.query('SELECT * FROM users', (err, users) => {
      if (err) {
        console.error('Query error:', err);
        return;
      }
      
      processUsers(users);
    });
  });
});

// ✅ Better: Extract to functions
async function initializeApp() {
  try {
    const data = await fs.promises.readFile('config.json');
    const config = JSON.parse(data);
    await db.connect(config);
    const users = await db.query('SELECT * FROM users');
    processUsers(users);
  } catch (err) {
    console.error('Initialization error:', err);
  }
}
```

## Part 3: Promise Error Handling

### Promise Chains

```javascript
// Using .catch()
fetchUser(123)
  .then(user => fetchUserPosts(user.id))
  .then(posts => displayPosts(posts))
  .catch(err => {
    console.error('Error:', err.message);
    displayErrorMessage('Failed to load posts');
  });

// Error stops chain and goes to catch
// Subsequent .then() blocks are skipped!

// .finally() always runs (cleanup)
fetchUser(123)
  .then(user => updateUser(user))
  .catch(err => console.error(err))
  .finally(() => {
    hideLoadingSpinner();
    closeDatabase();
  });
```

### Multiple Error Handlers

```javascript
// Different handlers for different errors
fetchUser(123)
  .then(user => {
    if (!user) throw new ValidationError('User not found');
    return user;
  })
  .catch(ValidationError, err => {
    console.log('Validation issue:', err.message);
    return { id: 0, name: 'Anonymous' }; // Default user
  })
  .catch(err => {
    console.error('Fatal error:', err);
    throw err; // Re-throw for global handler
  });

// Promise.allSettled() - handle multiple promises
const results = await Promise.allSettled([
  fetchUser(1),
  fetchUser(2),
  fetchUser(3)
]);

results.forEach((result, idx) => {
  if (result.status === 'fulfilled') {
    console.log(`User ${idx}:`, result.value);
  } else {
    console.error(`User ${idx} failed:`, result.reason);
  }
});
```

## Part 4: Async/Await Error Handling

### Try/Catch Blocks

```javascript
// Modern, synchronous-looking error handling
async function getUser(id) {
  try {
    if (!id) {
      throw new ValidationError('ID required');
    }
    
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const user = await response.json();
    return user;
  } catch (err) {
    console.error('Failed to get user:', err.message);
    throw err; // Re-throw for caller to handle
  } finally {
    console.log('User fetch completed');
  }
}

// Usage
try {
  const user = await getUser(123);
  console.log('Got user:', user.name);
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('Invalid request');
  } else {
    console.error('Unexpected error:', err);
  }
}
```

### Parallel Async Operations

```javascript
// Error handling with Promise.all()
async function loadUserData(userId) {
  try {
    const [user, posts, comments] = await Promise.all([
      fetchUser(userId),
      fetchPosts(userId),
      fetchComments(userId)
    ]);

    return { user, posts, comments };
  } catch (err) {
    // If ANY promise rejects, catch block runs
    console.error('Failed to load user data:', err);
    throw err;
  }
}

// Partial failure allowed (Promise.allSettled)
async function loadUserDataSafely(userId) {
  const results = await Promise.allSettled([
    fetchUser(userId),
    fetchPosts(userId),
    fetchComments(userId)
  ]);

  return {
    user: results[0].status === 'fulfilled' ? results[0].value : null,
    posts: results[1].status === 'fulfilled' ? results[1].value : [],
    comments: results[2].status === 'fulfilled' ? results[2].value : [],
    errors: results
      .map((r, i) => r.status === 'rejected' ? r.reason : null)
      .filter(Boolean)
  };
}
```

## Part 5: Error in Async Contexts

### Unhandled Promise Rejections

```javascript
// ❌ Promise rejection not caught
async function badFunction() {
  throw new Error('Oops!');
}

badFunction(); // Promise created but rejection not handled!

// ✅ Always handle or await
badFunction().catch(err => {
  console.error('Caught:', err.message);
});

// OR
const promise = badFunction();
promise.catch(err => {
  console.error('Caught:', err);
});
```

### Global Error Handlers

```javascript
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Log to monitoring service
  sendToMonitoring({
    type: 'unhandledRejection',
    error: reason,
    time: new Date()
  });
  // Exit or notify admins
  process.exit(1);
});

// Handle uncaught synchronous errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  sendToMonitoring({
    type: 'uncaughtException',
    error: err,
    stack: err.stack,
    time: new Date()
  });
  process.exit(1);
});
```

## Part 6: Best Practices

### Error Logging & Monitoring

```javascript
const logger = require('winston');

function handleError(err, context = {}) {
  logger.error({
    message: err.message,
    stack: err.stack,
    context,
    timestamp: new Date().toISOString()
  });

  // Send to monitoring service
  if (err.severity === 'critical') {
    alertOps(err);
  }
}

// Usage
try {
  await processPayment(order);
} catch (err) {
  handleError(err, {
    orderId: order.id,
    userId: user.id,
    endpoint: '/api/payment'
  });
}
```

### Structured Error Responses

```javascript
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Express error middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (err.isOperational) {
    // Expected errors - send to client
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Programming error - don't leak details
  console.error('ERROR 💥', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong. Please try again later.'
  });
});
```

## Summary

- **Error Types:** Know the built-in error types and when they occur
- **Custom Errors:** Extend Error for domain-specific errors
- **Callbacks:** Always check error parameter first
- **Promises:** Use .catch() for error handling
- **Async/Await:** Use try/catch for clean error handling
- **Global Handlers:** Listen for unhandled rejections and exceptions
- **Logging:** Log errors with context for debugging
- **Monitoring:** Send errors to services like Sentry for production tracking

This module provides hands-on experience with 16 error handling deep patterns patterns.
