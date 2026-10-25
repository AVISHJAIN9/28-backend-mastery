# Theory & Concepts
## Error Handling Middleware Pattern
A centralized error handler (with 4 parameters) catches all errors from routes and middleware, formats them consistently, and sends appropriate HTTP responses.

## Why 4 Parameters?
Express distinguishes error middleware by requiring exactly 4 parameters: (err, req, res, next). This is how Express knows it's an error handler.

## Error Flow
1. Route throws error or calls next(error)
2. Express skips normal middleware/routes
3. Error handler catches it
4. Formats error response
5. Sends JSON response with status code

## Status Code Conventions
- 400: Bad Request (client fault)
- 401: Unauthorized (needs authentication)
- 403: Forbidden (authenticated but not allowed)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (duplicate data)
- 500: Internal Server Error (server fault)
- 503: Service Unavailable (maintenance/down)

## Benefits
- Consistent error format for all endpoints
- Stack traces logged but not exposed to clients
- Errors tracked and monitored
- No need for try/catch in every route (if using async wrapper)
