# HTTP Method Override Middleware

## Overview
HTTP Method Override allows clients to submit requests using alternative HTTP methods through headers or query parameters. Useful for environments (older browsers, proxies) that don't support PUT/DELETE methods.

## Key Concepts

### 1. Why Method Override?
- **Legacy Browser Support**: Old browsers only support GET/POST
- **Proxy Restrictions**: Some proxies block PUT/DELETE
- **Form Limitations**: HTML forms only support GET/POST
- **API Compatibility**: Support older clients while using REST

### 2. Method Override Techniques
- **X-HTTP-Method-Override Header**: `X-HTTP-Method-Override: PUT`
- **_method Query Parameter**: `?_method=DELETE`
- **_method Form Field**: Hidden input in forms `<input name="_method" value="PUT">`

### 3. How It Works
```
Client Request:
POST /api/users/1?_method=PUT
{name: "Updated Name"}

Middleware converts to:
PUT /api/users/1
{name: "Updated Name"}

Router matches PUT handler
```

## Implementation Methods

### Express Middleware
```javascript
const methodOverride = require('method-override');

// Check X-HTTP-Method-Override header
app.use(methodOverride('X-HTTP-Method-Override'));

// Check _method query param
app.use(methodOverride('_method'));

// Check both header and query
app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    return req.body._method;
  }
}));
```

### Form-Based Override
```html
<!-- Hidden form field -->
<form method="POST" action="/api/users/1">
  <input type="hidden" name="_method" value="PUT">
  <input type="text" name="name">
  <button type="submit">Update</button>
</form>
```

### Query Parameter Override
```javascript
// Client
fetch('/api/users/1?_method=DELETE', { method: 'POST' })

// Middleware converts to DELETE
```

## Security Considerations

1. **Restrict Methods**: Only override non-safe requests (POST → PUT/DELETE)
2. **Whitelist Methods**: Don't allow override to GET (could have side effects)
3. **Validate Requests**: Check authorization for overridden methods
4. **Log Overrides**: Track which requests use method override
5. **Disable in APIs**: Use actual HTTP methods for REST APIs

## Real-World Use Cases

1. **CMS Systems**: Forms submit via POST but use PUT/DELETE internally
2. **Admin Panels**: Support legacy browsers that don't send PUT
3. **Mobile Apps**: Limited HTTP support requires override
4. **Legacy System Integration**: Bridge old APIs with modern systems
5. **Proxy Compliance**: Work around proxy restrictions

## Best Practices

1. **Use only when necessary**: Native HTTP methods preferred
2. **Document clearly**: Clients should know about override support
3. **Version your API**: Keep override support for backward compatibility
4. **Monitor usage**: Track override frequency to phase out if possible
5. **Combine with authentication**: Verify user has permission for actual method
6. **Response headers**: Include `X-Method-Override-Applied: true` for debugging

## Limitations

- **Not RESTful**: True REST APIs use native HTTP methods
- **Debugging**: Harder to debug when methods are overridden
- **Performance**: Extra middleware processing
- **Security Risk**: If not properly validated
- **Client Confusion**: Unclear which method is actually used
