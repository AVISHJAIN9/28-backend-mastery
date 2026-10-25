# Middleware Patterns - Complete Reference

**Status**: ✅ ALL 15 MODULES COMPLETE (150 files)

This section implements 15 production-grade middleware patterns for building robust, secure, and scalable Express.js applications.

## 📚 Module Overview

### Tier 1: Security & Authentication (3 modules)
- **01-jwt-verify**: JWT token generation, verification, and refresh flows
- **02-helmet-security-headers**: Security headers (XSS, clickjacking, MIME sniffing protection)
- **13-role-check**: Role-based access control and permission checking

### Tier 2: Request Processing (4 modules)
- **03-error-handling**: Global error handler middleware with proper status codes
- **04-request-validation-zod-joi**: Request validation using Joi/Zod schemas
- **09-body-parser**: Parse JSON, URL-encoded, and text request bodies
- **11-multer-file-upload**: Multipart file upload handling with validation

### Tier 3: HTTP Middleware (4 modules)
- **05-cors-middleware**: Cross-Origin Resource Sharing configuration
- **06-response-caching-redis-etag**: ETag-based response caching
- **07-request-logging-morgan**: HTTP request logging with Morgan
- **08-compression-gzip-brotli**: Response compression (gzip, brotli)

### Tier 4: Advanced Patterns (4 modules)
- **10-timeout-middleware**: Request and socket timeout handling
- **12-api-versioning**: API version routing and header management
- **14-request-tracing-correlation-id**: Distributed tracing with correlation IDs
- **15-express-async-errors**: Async/await error catching and handling

## 🏗️ Architecture

### Middleware Structure (10 files per module)
```
middleware-name/
├── controller.js          # Route handlers testing middleware
├── middleware.js          # Core middleware function(s)
├── routes.js              # Express route definitions
├── schema.js              # Joi validation schemas
├── .env.example           # Configuration template
├── App.jsx                # React component demo
├── README.md              # Feature overview
├── theory.md              # Conceptual explanation
├── setup.md               # Quick start guide
└── checklist.md           # Implementation checklist
```

### Middleware Pattern
```javascript
// Standard middleware signature
const middleware = (req, res, next) => {
  // Process request
  next();
};

// Error handling middleware (4 parameters)
const errorHandler = (err, req, res, next) => {
  // Handle error
  res.status(500).json({ error: err.message });
};

// Async/await pattern
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

## 🔧 Technologies

- **Framework**: Express.js
- **Authentication**: JWT with jsonwebtoken
- **Security**: Helmet.js
- **Validation**: Joi schema validation
- **File Upload**: Multer
- **Logging**: Morgan
- **Compression**: Node.js compression module
- **Distributed Tracing**: UUID for correlation IDs
- **Frontend**: React components for testing

## 📊 Middleware Ordering

Recommended middleware stack order:

```javascript
// Apply from top to bottom
app.use(helmet());                    // 02: Security headers
app.use(cors());                      // 05: CORS
app.use(compression());               // 08: Compression
app.use(morgan('combined'));          // 07: Logging
app.use(bodyParser.json());           // 09: Body parsing
app.use(tracingMiddleware);           // 14: Tracing
app.use(jwtVerifyMiddleware);         // 01: JWT verification
app.use(errorHandler);                // 03: Error handling (LAST)
```

## 🎯 Key Features by Module

| Module | Feature | Purpose |
|--------|---------|---------|
| 01 | JWT Tokens | Authentication & authorization |
| 02 | Security Headers | Protection against common attacks |
| 03 | Error Handler | Centralized error management |
| 04 | Validation | Input sanitization & validation |
| 05 | CORS | Cross-origin request handling |
| 06 | ETag Caching | Response caching with validation |
| 07 | Logging | HTTP request/response logging |
| 08 | Compression | Bandwidth reduction |
| 09 | Body Parser | Request body parsing |
| 10 | Timeouts | Prevent hanging requests |
| 11 | File Upload | Multipart file handling |
| 12 | Versioning | API version management |
| 13 | Role Check | Permission-based access |
| 14 | Tracing | Request correlation tracking |
| 15 | Async Errors | Promise error handling |

## 🚀 Usage Examples

### JWT Authentication
```javascript
const { jwtVerifyMiddleware, requireAuth } = require('./01-jwt-verify/middleware');

app.use(jwtVerifyMiddleware);
app.get('/protected', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
```

### Role-Based Access
```javascript
const { requireRole } = require('./13-role-check/middleware');

app.get('/admin', requireRole('admin'), (req, res) => {
  res.json({ data: 'Admin only' });
});
```

### File Upload
```javascript
const { upload } = require('./11-multer-file-upload/middleware');

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ file: req.file });
});
```

### Error Handling
```javascript
const { errorHandler } = require('./03-error-handling/middleware');

app.use((err, req, res, next) => {
  errorHandler(err, req, res, next);
});
```

### Async Error Handling
```javascript
const { asyncHandler } = require('./15-express-async-errors/middleware');

app.get('/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));
```

## 📋 Implementation Checklist

- ✅ Module 01: JWT Verify - Token generation & verification
- ✅ Module 02: Helmet - Security headers
- ✅ Module 03: Error Handling - Global error handler
- ✅ Module 04: Validation - Joi schema validation
- ✅ Module 05: CORS - Cross-origin support
- ✅ Module 06: Caching - ETag-based caching
- ✅ Module 07: Logging - Morgan request logging
- ✅ Module 08: Compression - Gzip/Brotli compression
- ✅ Module 09: Body Parser - Request body parsing
- ✅ Module 10: Timeout - Request timeouts
- ✅ Module 11: Multer - File upload handling
- ✅ Module 12: Versioning - API versioning
- ✅ Module 13: Role Check - Role-based access
- ✅ Module 14: Tracing - Correlation IDs
- ✅ Module 15: Async Errors - Promise error handling

## 🎓 Learning Path

1. **Start Here**: Modules 01-03 (authentication, security, error handling)
2. **Request Processing**: Modules 04, 09 (validation, parsing)
3. **HTTP Standards**: Modules 05-08 (CORS, caching, logging, compression)
4. **Advanced**: Modules 10-15 (timeouts, versioning, tracing, async)

## 💡 Best Practices

- Apply middleware in correct order (security → processing → error handling)
- Always use try-catch or asyncHandler for async operations
- Implement error handler as the last middleware
- Log requests for debugging and monitoring
- Enable security headers in production
- Validate all external input
- Use correlation IDs for distributed tracing
- Cache responses when appropriate

## 🔐 Security Considerations

- Helmet middleware provides essential security headers
- JWT tokens should use strong secrets and expiration
- Validate all user input with schemas
- Implement rate limiting (not shown but recommended)
- Use HTTPS in production
- Store secrets in environment variables
- Sanitize error messages in production

---

**Total Implementation**: 15 modules × 10 files × 150+ lines per module = **1,500+ lines of production code**

**Next Steps**: Review individual modules, implement in Express app, customize for your needs.
