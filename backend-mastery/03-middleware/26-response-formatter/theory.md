# Response Formatter Middleware

## Overview
Response formatter middleware standardizes API responses across all endpoints, providing consistent structure, status codes, and metadata. Improves API usability and simplifies client-side handling.

## Key Concepts

### 1. Standardized Response Structure
```javascript
// Successful response
{
  success: true,
  status: 200,
  data: { /* actual data */ },
  message: 'Request successful',
  timestamp: '2024-01-15T10:30:00Z'
}

// Error response
{
  success: false,
  status: 400,
  error: 'Validation Error',
  message: 'Email is required',
  details: [{ field: 'email', message: 'Required' }],
  timestamp: '2024-01-15T10:30:00Z'
}
```

### 2. Response Wrapper Pattern
- **Consistent Structure**: Every response follows same format
- **Easy Parsing**: Clients know where to find data
- **Metadata**: Status, timestamp, request ID
- **Error Details**: Detailed error information

### 3. HTTP Status Codes
- **2xx**: Success (200, 201, 204)
- **4xx**: Client error (400, 401, 403, 404, 422)
- **5xx**: Server error (500, 502, 503)

## Implementation

### Basic Response Formatter
```javascript
const formatResponse = (res, statusCode, data, message) => {
  res.status(statusCode).json({
    success: statusCode < 400,
    status: statusCode,
    data: statusCode < 400 ? data : null,
    error: statusCode >= 400 ? data?.error || message : null,
    message: message,
    timestamp: new Date().toISOString()
  });
};

// Usage
formatResponse(res, 200, { userId: 1, name: 'John' }, 'User created');
```

### Express Middleware
```javascript
app.use((req, res, next) => {
  res.success = (data, message = 'Success') => {
    res.status(200).json({
      success: true,
      status: 200,
      data,
      message,
      timestamp: new Date().toISOString()
    });
  };
  
  res.error = (statusCode, error, message, details = null) => {
    res.status(statusCode).json({
      success: false,
      status: statusCode,
      error,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId
    });
  };
  
  res.created = (data, message = 'Resource created') => {
    res.status(201).json({
      success: true,
      status: 201,
      data,
      message,
      timestamp: new Date().toISOString()
    });
  };
  
  next();
});
```

## Pagination Support

### Response with Pagination
```javascript
{
  success: true,
  status: 200,
  data: [ /* items */ ],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8,
    hasNext: true,
    hasPrev: false
  },
  message: 'Users retrieved',
  timestamp: '2024-01-15T10:30:00Z'
}
```

### Implementation
```javascript
app.get('/users', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  const users = getAllUsers();
  const total = users.length;
  const startIndex = (page - 1) * limit;
  const paginatedUsers = users.slice(startIndex, startIndex + limit);
  
  res.json({
    success: true,
    status: 200,
    data: paginatedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    message: 'Users retrieved'
  });
});
```

## Error Handling Integration

### Consistent Error Format
```javascript
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorType = err.name || 'InternalServerError';
  
  res.error(
    statusCode,
    errorType,
    err.message,
    err.details // Validation errors
  );
});
```

## API Documentation

### Response Schema
```yaml
Success Response:
  schema:
    type: object
    properties:
      success:
        type: boolean
      status:
        type: integer
      data:
        type: object
        description: Response payload
      message:
        type: string
      timestamp:
        type: string
        format: date-time

Error Response:
  schema:
    type: object
    properties:
      success:
        type: boolean
      status:
        type: integer
      error:
        type: string
      message:
        type: string
      details:
        type: array
      timestamp:
        type: string
```

## Best Practices

1. **Resource Creation**: Return 201 Created with created resource
2. **No Content**: Return 204 with null data
3. **Error Details**: Include validation errors in details array
4. **Consistent Naming**: Use same field names across all endpoints
5. **Documentation**: Document response structure in API docs
6. **Versioning**: Include API version in response (optional)
7. **Request ID**: Include for debugging and tracing
8. **Performance**: Include response time in metadata (optional)

## Client-Side Usage

### JavaScript Fetch
```javascript
const response = await fetch('/api/users');
const { success, data, message } = await response.json();

if (success) {
  displayUsers(data);
} else {
  showError(message);
}
```

### Error Handling
```javascript
const response = await fetch('/api/users', { method: 'POST', body });
const result = await response.json();

if (!result.success) {
  result.details?.forEach(error => {
    showFieldError(error.field, error.message);
  });
}
```

## Performance Considerations

- **Minimal Overhead**: Formatter should add <1ms latency
- **Streaming Responses**: Don't format large file downloads
- **Caching**: Cache formatted responses when applicable
- **Async Operations**: Don't block response formatting
