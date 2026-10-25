# Rate Limiting Middleware

Rate limiting protects APIs from abuse by restricting request frequency per client.

## Key Concepts
- **Windowed Limits**: Requests allowed per time window
- **Per-User Limits**: Different limits for different users
- **Skip Options**: Skip successful or failed requests
- **Custom Key Generators**: Custom identifier for rate limiting

## Implementation Strategies
1. Request counting with time windows
2. IP-based or user-based identification
3. Exponential backoff for repeat violators
4. Whitelist trusted IPs

## Security Benefits
- DDoS attack prevention
- API resource protection
- Rate limit headers in responses
- Custom error messages

## Common Use Cases
- Login attempt limiting (5 attempts/15 minutes)
- General API limiting (100 requests/15 minutes)
- Expensive operation limiting (10 requests/minute)
