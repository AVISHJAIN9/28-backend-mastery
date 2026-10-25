# Async Error Handling Middleware

## What is this?
Async error handling middleware catches errors thrown in async/await functions and passes them to error handlers, preventing unhandled promise rejections.

## Why does it matter?
- **Error Handling**: Async errors don't auto-propagate to error handlers
- **Crash Prevention**: Unhandled rejections would crash server
- **Consistency**: Async errors handled same as sync errors
- **Reliability**: All errors reach error handler
- **Clean Code**: No try/catch needed in every function
- **Production Ready**: Essential for production servers

## How it works (step by step)
1. Route handler is async function
2. Handler throws error or promise rejects
3. Error thrown in async function
4. Normal Express error handler DOESN'T catch it (async issue)
5. Async handler wrapper intercepts
6. Error caught by Promise.catch()
7. Error passed to next(error)
8. Error handler middleware receives error
9. Error handled consistently

## Key concepts
- **Async/Await**: Modern promise handling
- **Promise Rejection**: Error in promise not caught
- **try/catch**: Manual error handling in async
- **Async Wrapper**: Higher-order function catching errors
- **next(error)**: Passing to error middleware
- **Promise.resolve()**: Normalizing promise handling

## Common mistakes
- Forgetting to wrap async routes
- Using .catch() on every endpoint (verbose)
- Not forwarding error to next()
- Not using 4-param error handler
- Mixing sync and async error handling

## Real world usage
```javascript
// Problem: Error not caught
app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);  // If this throws...
  res.json(user);  // Error NOT caught by error handler!
});

// Solution: Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Now errors are caught
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.getUser(req.params.id);
  res.json(user);
}));

// Or use middleware to wrap all async routes
app.get('/posts', asyncHandler(async (req, res) => {
  const posts = await db.getPosts();
  res.json(posts);
}));

// Errors caught by error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```
