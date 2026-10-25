# Request Sanitization Middleware

Prevent injection attacks through input sanitization and validation.

## Attack Types Prevented
- MongoDB injection
- HTTP Parameter Pollution (HPP)
- XSS attacks
- NoSQL injection

## Sanitization Strategies
- Input string normalization
- HTML encoding
- Object key filtering
- Type validation

## Best Practices
- Sanitize at request entry
- Validate against expected formats
- Escape output appropriately
- Use parameterized queries
