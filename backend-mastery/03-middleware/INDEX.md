# Middleware - Module Index

## Tier 1: Security & Authentication (3 modules)

### 01 - JWT Verify
- **Purpose**: JWT token management and verification
- **Key Methods**: generateJWT(), verifyJWT(), refreshJWT()
- **Middleware**: jwtVerifyMiddleware, requireAuth
- **Use Case**: User authentication, token refresh cycles
- **Files**: 10 (controller.js, middleware.js, routes.js, schema.js, .env.example, App.jsx, 4 docs)

### 02 - Helmet Security Headers
- **Purpose**: Security headers to prevent common attacks
- **Key Methods**: getSecurityHeaders(), testHeaders()
- **Headers**: X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, CSP
- **Use Case**: Protection against XSS, clickjacking, MIME sniffing
- **Files**: 10

### 13 - Role Check
- **Purpose**: Role-based access control
- **Key Methods**: requireRole(role)
- **Middleware**: requireRole middleware
- **Use Case**: Admin endpoints, permission checks
- **Files**: 10

---

## Tier 2: Request Processing (4 modules)

### 03 - Error Handling
- **Purpose**: Global error handler
- **Key Methods**: handleError(err, req, res, next)
- **Middleware**: errorHandler (4-parameter signature)
- **Use Case**: Centralized error management, error messages
- **Files**: 10

### 04 - Request Validation
- **Purpose**: Request body validation
- **Key Methods**: validateMiddleware(schema)
- **Validation**: Joi schemas
- **Use Case**: Input sanitization, schema enforcement
- **Files**: 10

### 09 - Body Parser
- **Purpose**: Parse HTTP request bodies
- **Key Methods**: jsonParser, urlencodedParser
- **Types**: JSON, URL-encoded, text
- **Use Case**: Request body parsing, data extraction
- **Files**: 10

### 11 - Multer File Upload
- **Purpose**: Multipart file upload handling
- **Key Methods**: upload.single(), upload.multiple()
- **Features**: File validation, size limits, MIME type checking
- **Use Case**: File uploads, document handling
- **Files**: 10

---

## Tier 3: HTTP Middleware (4 modules)

### 05 - CORS Middleware
- **Purpose**: Cross-Origin Resource Sharing
- **Middleware**: corsMiddleware
- **Config**: Allowed origins, methods, headers
- **Use Case**: Allow cross-domain requests, CORS preflight
- **Files**: 10

### 06 - Response Caching
- **Purpose**: ETag-based response caching
- **Key Methods**: generateETag(), getCachedData()
- **Middleware**: cacheMiddleware
- **Use Case**: Bandwidth optimization, client-side caching
- **Files**: 10

### 07 - Request Logging
- **Purpose**: HTTP request logging
- **Middleware**: Morgan logging middleware
- **Formats**: Combined, common, dev, short
- **Use Case**: Debugging, monitoring, audit trails
- **Files**: 10

### 08 - Compression
- **Purpose**: Response compression
- **Middleware**: compressionMiddleware
- **Algorithms**: Gzip, Brotli
- **Use Case**: Bandwidth reduction, faster transfers
- **Files**: 10

---

## Tier 4: Advanced Patterns (4 modules)

### 10 - Timeout Middleware
- **Purpose**: Request and socket timeouts
- **Key Methods**: timeoutMiddleware(timeout)
- **Config**: Request timeout, socket timeout, keepalive timeout
- **Use Case**: Prevent hanging requests, resource cleanup
- **Files**: 10

### 12 - API Versioning
- **Purpose**: API version routing
- **Key Methods**: getVersion(version)
- **Middleware**: versionMiddleware
- **Versions**: v1, v2, v3 with different features
- **Use Case**: Backward compatibility, feature management
- **Files**: 10

### 14 - Request Tracing
- **Purpose**: Distributed request tracing
- **Key Methods**: getTraceId()
- **Middleware**: tracingMiddleware
- **IDs**: Correlation ID (uuidv4)
- **Use Case**: Request tracking, debugging distributed systems
- **Files**: 10

### 15 - Async Errors
- **Purpose**: Catch errors in async/await
- **Key Methods**: asyncHandler(fn)
- **Middleware**: asyncHandler wrapper
- **Use Case**: Promise error handling, async route handlers
- **Files**: 10

---

## Module Statistics

- **Total Modules**: 15
- **Total Files**: 150 (10 per module)
- **Total Lines of Code**: 1,500+
- **Completion**: 100% ✅

## By Category

| Category | Modules | Purpose |
|----------|---------|---------|
| Security | 01, 02, 13 | Authentication & authorization |
| Input | 04, 09, 11 | Parsing & validation |
| HTTP | 05, 06, 07, 08 | HTTP standards |
| Advanced | 10, 12, 14, 15 | Performance & tracing |
| Error | 03, 15 | Error handling |

## Implementation Patterns

**Standard Middleware**:
```javascript
const middleware = (req, res, next) => {
  // Process request
  next();
};
```

**Error Handling Middleware** (must have 4 parameters):
```javascript
const errorHandler = (err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
};
```

**Async Handler Wrapper**:
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

**Higher-Order Middleware** (returns middleware):
```javascript
const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};
```

## Quick Links

- JWT Auth: Module 01
- Security Headers: Module 02
- Global Errors: Module 03
- Input Validation: Module 04
- Cross-origin: Module 05
- Caching: Module 06
- Logging: Module 07
- Compression: Module 08
- Body Parsing: Module 09
- Timeouts: Module 10
- File Upload: Module 11
- Versioning: Module 12
- Permissions: Module 13
- Tracing: Module 14
- Async Errors: Module 15

---

**Next Steps**: Pick a module and explore the implementation. Start with 01-JWT for auth, or 03-ErrorHandling for a global error strategy.
