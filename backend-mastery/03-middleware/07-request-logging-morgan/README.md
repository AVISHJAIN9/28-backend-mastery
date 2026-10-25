# Request Logging with Morgan Middleware

## What is this?
Morgan is HTTP request logging middleware that logs details about each request/response for debugging, monitoring, and audit trails.

## Why does it matter?
- **Debugging**: See request/response details when issues occur
- **Monitoring**: Track API usage patterns and performance
- **Audit Trail**: Record who accessed what and when
- **Performance Analysis**: Identify slow endpoints
- **Error Investigation**: Trace requests leading to errors
- **Analytics**: Historical data for business metrics

## How it works (step by step)
1. Request arrives at Express app
2. Morgan middleware intercepts request
3. Request details recorded (method, URL, headers)
4. Request passes to route handler
5. Handler processes and sends response
6. Morgan records response details (status, size, duration)
7. Log entry formatted and output
8. Request/response complete

## Key concepts
- **Format**: Predefined log output format (combined, common, dev, short)
- **Method**: HTTP verb (GET, POST, PUT, DELETE)
- **URL**: Request path and query string
- **Status**: HTTP response code (200, 404, 500, etc)
- **Response-Time**: Duration in milliseconds
- **User-Agent**: Browser/client information
- **Remote Address**: Client IP address

## Common mistakes
- Logging sensitive data (passwords, tokens)
- Logging in test environments
- Not rotating log files (disk fills)
- Using verbose format in production
- Logging before time tracking starts

## Real world usage
```javascript
const morgan = require('morgan');

// Use 'combined' format (Apache format)
app.use(morgan('combined'));
// Logs: 127.0.0.1 - - [timestamp] "GET /api/users HTTP/1.1" 200 1234

// Use 'dev' format (colored output)
app.use(morgan('dev'));
// Logs: GET /api/users 200 1.234 ms - 1234

// Log to file
const fs = require('fs');
const stream = fs.createWriteStream('access.log', { flags: 'a' });
app.use(morgan('combined', { stream: stream }));
```
