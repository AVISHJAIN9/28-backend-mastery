# Timeout Middleware

## What is this?
Timeout middleware sets limits on how long requests can take, killing long-running requests to free server resources and prevent connection exhaustion.

## Why does it matter?
- **Resource Management**: Prevents hung connections
- **Server Protection**: Stops DOS attacks using slow requests
- **Clear Failure**: Tells clients connection failed
- **Cascading Recovery**: Prevents cascading failures
- **User Experience**: Users get timeout error instead of infinite wait
- **Monitoring**: Helps identify slow endpoints

## How it works (step by step)
1. Request arrives at server
2. Timeout middleware sets timer
3. Request processing begins
4. Timer counts down
5. If handler completes before timeout: Normal response sent
6. If timeout elapses: Server kills connection
7. Client receives timeout error
8. Connection cleaned up, resources freed

## Key concepts
- **Request Timeout**: How long entire request can take
- **Socket Timeout**: How long before TCP socket closes
- **Keep-Alive Timeout**: How long idle connection stays open
- **Graceful Recovery**: Server handles timeout, doesn't crash
- **Error Response**: 408 Request Timeout status code
- **Connection Pooling**: Timeouts prevent pool exhaustion

## Common mistakes
- Setting timeout too short (legitimate requests timeout)
- Not handling timeout errors in client
- Ignoring socket timeouts
- Not testing with slow endpoints
- Setting same timeout for all endpoints

## Real world usage
```javascript
const express = require('express');
const app = express();

// Set request timeout (30 seconds)
app.use((req, res, next) => {
  req.setTimeout(30000);
  next();
});

// Or set at server level
const server = app.listen(3000);
server.setTimeout(30000);
server.keepAliveTimeout = 65000;

// Handle timeout
app.use((err, req, res, next) => {
  if (err.code === 'ECONNABORTED') {
    res.status(408).json({ error: 'Request timeout' });
  } else {
    next(err);
  }
});
```
