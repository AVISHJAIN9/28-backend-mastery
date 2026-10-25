# CORS Middleware

## What is this?
CORS (Cross-Origin Resource Sharing) middleware enables controlled access to resources from different domains by setting appropriate headers and handling preflight requests.

## Why does it matter?
- **API Sharing**: Allow frontend from different domain to call API
- **Security**: Controls which origins can access resources
- **Browser Compliance**: Handles browser's same-origin policy
- **Preflight Handling**: Automatically responds to OPTIONS requests
- **Credentials**: Can allow/deny cookies with requests
- **Production-Ready**: Essential for public APIs

## How it works (step by step)
1. Browser makes request from https://app.com to https://api.com
2. Browser sends Origin header
3. CORS middleware checks if origin is allowed
4. If preflight (OPTIONS): Respond with CORS headers immediately
5. If not allowed: Reject request
6. If allowed: Set Access-Control-Allow-Origin header
7. Browser receives response with CORS headers
8. Browser allows JavaScript to access response

## Key concepts
- **Origin**: Combination of protocol + domain + port
- **Same-Origin Policy**: Browser blocks cross-origin requests by default
- **Preflight Request**: Browser auto-sends OPTIONS before actual request
- **Access-Control-Allow-Origin**: Tells browser which origins can access
- **Access-Control-Allow-Methods**: Specifies allowed HTTP methods
- **Access-Control-Allow-Headers**: Specifies allowed request headers
- **Credentials**: Including cookies in cross-origin requests

## Common mistakes
- CORS header: Access-Control-Allow-Origin: * (allows everyone, not secure)
- Not specifying allowed methods
- Not handling preflight requests
- Hardcoding single origin (need dynamic check)
- Forgetting credentials flag

## Real world usage
```javascript
// Enable CORS for specific origins
const cors = require('cors');
app.use(cors({
  origin: ['https://app.com', 'https://app2.com'],
  methods: ['GET', 'POST', 'PUT'],
  credentials: true,
  maxAge: 3600
}));

// Browser request from https://app.com:
// GET https://api.com/data
// Response includes: Access-Control-Allow-Origin: https://app.com
// Browser allows access to response
```
