# Error Handling Middleware

## What is this?
Global error handler middleware catches all errors from routes and converts them into consistent, user-friendly JSON responses with appropriate HTTP status codes.

## Why does it matter?
- **Consistency**: All errors formatted the same way
- **No White Screens**: Prevents exposing raw stack traces
- **Status Codes**: HTTP status codes inform clients of error type
- **Logging**: Errors can be logged for monitoring
- **Debugging**: Development mode shows full stack traces
- **Security**: Production hides sensitive error details

## How it works (step by step)
1. Route handler throws error or calls next(error)
2. Error propagates through middleware chain
3. Error handler middleware catches error (4-parameter signature)
4. Error status extracted or defaults to 500
5. User-friendly message prepared
6. Stack trace included if development mode
7. JSON response sent with error details
8. Response ends (no further processing)

## Key concepts
- **4-Parameter Signature**: (err, req, res, next) - identifies error handler
- **Status Codes**: 400 client error, 500 server error
- **Error Objects**: Can attach custom status: err.status = 400
- **Stack Traces**: Shown in development, hidden in production
- **Error Logging**: Errors logged before responding
- **Fallback**: Defaults to 500 if status not specified

## Common mistakes
- Not placing error handler as LAST middleware
- Forgetting 4-parameter signature
- Returning error responses without proper status codes
- Showing full stack traces in production
- Not handling async errors (need asyncHandler wrapper)

## Real world usage
```javascript
// Route throws error
app.get('/user/:id', (req, res) => {
  if (!req.params.id) {
    const err = new Error('User ID required');
    err.status = 400;
    throw err;  // Caught by error handler
  }
});

// Error handler (MUST be last middleware)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message,
    status
  });
});
```
