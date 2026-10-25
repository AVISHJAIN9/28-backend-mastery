# Webhook Pattern

Event-driven system architecture:

1. Client registers webhook with URL and event types
2. Application triggers events
3. Server sends HTTP POST to registered URLs
4. Request includes HMAC signature for verification
5. Webhook receiver verifies signature and processes
6. Server retries on failures with exponential backoff

Delivery guarantee: At-least-once or exactly-once semantics with idempotency keys.
