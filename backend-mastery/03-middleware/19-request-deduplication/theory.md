# Request Deduplication Middleware

Prevent duplicate requests from being processed multiple times.

## Deduplication Strategies
- Request hashing with content and IP
- Idempotency keys
- Temporary response caching
- Replay attack prevention

## Implementation Details
- Hash request path, body, and IP
- Store responses for ~5 seconds
- Return cached response for duplicates
- Clear old entries automatically
