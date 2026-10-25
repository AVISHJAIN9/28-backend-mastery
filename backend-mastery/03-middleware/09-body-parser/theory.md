# Theory & Concepts
## Body Parser Overview
Body parser middleware reads incoming request bodies and converts them to JavaScript objects available as req.body.

## Content-Type Formats
- **application/json**: JSON data {"key": "value"}
- **application/x-www-form-urlencoded**: Form data key1=value1&key2=value2
- **multipart/form-data**: File uploads with boundaries
- **text/plain**: Plain text

## Parsing Steps
1. Read Content-Type header
2. Select appropriate parser
3. Read request body stream
4. Buffer all data chunks
5. Parse into JavaScript object
6. Validate size not exceeded
7. Attach to req.body
8. Pass control to route handler

## Size Limits
- **Default**: 100KB per request
- **Why**: Prevent DOS attacks (huge payloads)
- **Configuration**: Increase for large uploads
- **Exceeding**: Returns 413 Payload Too Large

## URL-Encoded Parsing
- **extended: false**: Simple parsing (qs)
- **extended: true**: Complex parsing (qs library)
- Different for nested objects and arrays

## Common Errors
- **req.body undefined**: Body parser not applied
- **413 error**: Payload exceeds limit
- **Invalid JSON**: 400 Bad Request
- **Wrong Content-Type**: Parser mismatch

## Order Matters
Body parser must be applied before routes that use POST/PUT data.
