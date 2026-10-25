# Theory & Concepts
## Async Error Handling Overview
Async functions return Promises. Errors in Promises don't automatically reach Express error handlers. Async error wrapper solves this.

## The Problem
```javascript
app.get('/users/:id', async (req, res) => {
  const user = await db.getUser(req.params.id);  // If this throws...
  res.json(user);  // Does NOT reach error handler!
});
```
Why? Express error handlers don't catch Promise rejections by default.

## Error Propagation
- **Sync Error**: throw error → caught by error middleware
- **Async Error**: throw error → Promise rejection → NOT caught

## Solution 1: Manual try/catch (verbose)
```javascript
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await db.getUser(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);  // Pass to error handler
  }
});
```

## Solution 2: Async wrapper (reusable)
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

## Promise.resolve() Magic
- Wraps function result in resolved Promise
- Catches any rejection or throw
- Forwards error to next(error)
- Works with sync and async functions

## Solution 3: Library
Use express-async-errors package for auto-wrapping all routes.

## When Needed
- All async route handlers
- Async middleware
- Any .then()/.catch() chains

## Prevention
Without proper error handling, unhandled Promise rejections crash server. Always handle async errors.
