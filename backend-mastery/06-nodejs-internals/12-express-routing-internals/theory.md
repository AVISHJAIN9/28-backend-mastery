# Express Routing Internals Theory

## Express Router Architecture

Express routing has multiple layers.

```
HTTP Request
   ↓
App middleware
   ↓
Route matching (Express Router)
   ├─ Path matching
   ├─ Method matching
   └─ Parameter extraction
   ↓
Route middleware
   ↓
Route handler
   ↓
Response sent
```

## Route Definition

### Basic Route
```javascript
app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});

// Method: GET
// Path: /users/:id
// Handler: Function
```

### Parameters
```javascript
// /:id → req.params.id
app.get('/users/:id', (req, res) => {
  console.log(req.params.id); // "123"
});

// /:userId/posts/:postId
app.get('/:userId/posts/:postId', (req, res) => {
  console.log(req.params.userId);  // User ID
  console.log(req.params.postId);  // Post ID
});
```

## Route Matching

### Exact Match First
```javascript
app.get('/users', (req, res) => res.send('List'));
app.get('/users/:id', (req, res) => res.send('Single'));
app.get('/users/admin', (req, res) => res.send('Admin'));

// GET /users → "List"
// GET /users/admin → "ADMIN" (exact match wins)
// GET /users/123 → "Single"
```

### Pattern Matching
```javascript
// Literal
app.get('/api/users', handler); // Only /api/users

// Parameter
app.get('/api/:resource', handler); // /api/users, /api/posts

// Regex
app.get(/\/api\/\d+/, handler); // /api/123 but not /api/abc

// Optional
app.get('/files/:name?', handler); // /files or /files/document
```

## Middleware Stack

### Order Matters
```javascript
// ✅ Correct
app.use(authenticate);
app.get('/secret', handler);

// ❌ Wrong
app.get('/secret', handler);
app.use(authenticate);
// authenticate never runs for /secret
```

### Route-Level Middleware
```javascript
app.get(
  '/admin',
  authenticate,      // Runs first
  authorize('admin'), // Runs second
  (req, res) => {     // Handler
    res.send('Done');
  }
);
```

### Multiple Middleware
```javascript
// Array syntax
app.get('/route', [auth, validate, handler]);

// Inline
app.get('/route', auth, validate, handler);
```

## Router Nesting

### Sub-router
```javascript
const userRouter = express.Router();

userRouter.get('/', (req, res) => {
  res.send('All users');
});

userRouter.get('/:id', (req, res) => {
  res.send(`User ${req.params.id}`);
});

app.use('/api/users', userRouter);

// GET /api/users → "All users"
// GET /api/users/123 → "User 123"
```

### Advantages
```
✅ Modular routing
✅ Separate by feature
✅ Cleaner code
✅ Reusable routers
```

## Route Priority

### Registration Order
```javascript
// Registered first
app.get('/users/:id', handler1);

// Registered second
app.get('/users/admin', handler2);

// GET /users/admin → Matches FIRST route
// handler1 receives { id: 'admin' }
// handler2 never runs!

// Fix: Exact routes first
app.get('/users/admin', handler2);
app.get('/users/:id', handler1);
```

## Parameter Extraction

### URL Parameters
```javascript
app.get('/posts/:postId', (req, res) => {
  console.log(req.params.postId); // "123"
});
```

### Query String
```javascript
app.get('/search', (req, res) => {
  console.log(req.query.q); // "javascript"
});

// GET /search?q=javascript
```

### Request Body
```javascript
app.post('/users', (req, res) => {
  console.log(req.body.name); // "John"
});

// Requires body-parser middleware
```

## Route Methods

### All HTTP Methods
```javascript
app.get('/route', handler);      // GET
app.post('/route', handler);     // POST
app.put('/route', handler);      // PUT
app.patch('/route', handler);    // PATCH
app.delete('/route', handler);   // DELETE
app.options('/route', handler);  // OPTIONS

app.all('/route', handler);      // ANY method
```

## Next Function

### Passing to Next Handler
```javascript
const mw1 = (req, res, next) => {
  console.log('MW1');
  req.user = { id: 1 };
  next(); // Continue to next
};

const mw2 = (req, res, next) => {
  console.log('MW2');
  console.log(req.user.id); // 1
  next();
};

app.get('/route', mw1, mw2, (req, res) => {
  res.send('Done');
});

// Output:
// MW1
// MW2
// Done
```

### Skipping Routes
```javascript
app.get('/route1', (req, res, next) => {
  if (someCondition) {
    return next('route'); // Skip other routes
  }
  res.send('Route 1');
});

app.get('/route2', (req, res) => {
  res.send('Route 2');
});

// If condition true, goes to /route2
```

## Error Handling Routes

### Error Middleware
```javascript
// Must have 4 parameters (err, req, res, next)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// Must be last
```

## Route Caching

### Express Routes Cached
```javascript
// First request: Compile route
app.get('/users/:id', (req, res) => {
  res.send('Handling');
});

// Subsequent requests: Use cached route matcher
// Very fast (microseconds)
```

## RESTful Conventions

### Standard Pattern
```javascript
// List all
app.get('/api/users', getUsers);

// Get one
app.get('/api/users/:id', getUser);

// Create
app.post('/api/users', createUser);

// Update
app.put('/api/users/:id', updateUser);

// Delete
app.delete('/api/users/:id', deleteUser);
```

## Best Practices

✅ Define exact routes before parameters
✅ Use routers for large apps
✅ Place error handler last
✅ Handle all errors with try/catch
✅ Use consistent naming
✅ Document routes
✅ Return early to avoid extra work
✅ Use middleware for cross-cutting concerns
✅ Test route parameters
✅ Consider route performance
