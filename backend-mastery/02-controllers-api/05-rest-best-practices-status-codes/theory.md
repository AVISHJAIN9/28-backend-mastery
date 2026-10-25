# REST Status Codes - Comprehensive Guide

## 2xx Success Codes

```
200 OK
  - Standard response for successful requests
  - Include full resource in body
  - Idempotent operations

201 Created
  - POST created a new resource
  - Include Location header: Location: /api/users/123
  - Include created resource in body

202 Accepted
  - Request accepted but not finished
  - Async operations, background jobs
  - Include job ID or status endpoint

204 No Content
  - Success with empty body
  - DELETE operations
  - PATCH with no response needed
```

### Example 200 Response
```json
GET /api/users/123
200 OK
Content-Type: application/json

{
  "id": 123,
  "name": "Alice",
  "email": "alice@example.com"
}
```

### Example 201 Response
```json
POST /api/users
201 Created
Location: /api/users/456
Content-Type: application/json

{
  "id": 456,
  "name": "Bob",
  "email": "bob@example.com"
}
```

## 4xx Client Error Codes

```
400 Bad Request
  - Malformed request syntax
  - Invalid JSON
  - Missing required fields

401 Unauthorized
  - Authentication required
  - Invalid/expired token
  - Missing credentials

403 Forbidden
  - Authenticated but not authorized
  - Insufficient permissions
  - Resource access denied

404 Not Found
  - Resource doesn't exist
  - Wrong endpoint path
  - Invalid resource ID

409 Conflict
  - Resource state conflicts
  - Duplicate entry
  - Concurrent modification

422 Unprocessable Entity
  - Validation failed
  - Invalid field values
  - Business logic rejection

429 Too Many Requests
  - Rate limit exceeded
  - Exceeded quota
  - Include Retry-After header
```

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "must be valid email"
      }
    ]
  }
}
```

## 5xx Server Error Codes

```
500 Internal Server Error
  - Unhandled exception
  - Database connection failed
  - Unknown server error

502 Bad Gateway
  - Upstream service unavailable
  - Invalid gateway response

503 Service Unavailable
  - Server maintenance
  - Temporary overload
  - Database migration

504 Gateway Timeout
  - Request took too long
  - Upstream timeout
  - Include Retry-After header
```

## Status Code Decision Tree

```
Request made?
├── No → 5xx (server error)
├── Yes, malformed? → 400 Bad Request
├── Yes, auth missing? → 401 Unauthorized
├── Yes, auth invalid? → 403 Forbidden
├── Yes, resource not found? → 404 Not Found
├── Yes, validation failed? → 422 Unprocessable Entity
├── Yes, success? → 200-204
└── Async operation? → 202 Accepted
```
