# Theory & Concepts
## CORS (Cross-Origin Resource Sharing) Overview
Browsers block scripts from accessing resources on different domains/origins for security. CORS allows servers to explicitly permit cross-origin requests.

## Same-Origin Policy
Browsers enforce "Same-Origin" rule: scripts can only access resources on same origin (scheme + domain + port). Different origin = blocked.

## Origin Examples
- Same: https://example.com → https://example.com/api
- Different: https://app.example.com → https://api.example.com (different subdomain)
- Different: https://example.com → http://example.com (different scheme)
- Different: https://example.com:3000 → https://example.com:3001 (different port)

## Preflight Requests
For complex requests (DELETE, PUT, POST with custom headers), browser sends OPTIONS request first to check if allowed.

## CORS Headers
- **Access-Control-Allow-Origin**: Which origins allowed (or *)
- **Access-Control-Allow-Methods**: Which HTTP methods allowed
- **Access-Control-Allow-Headers**: Which headers allowed
- **Access-Control-Allow-Credentials**: Allow cookies?
- **Access-Control-Max-Age**: Cache preflight for n seconds

## Configuration Strategies
- **Allow All**: Access-Control-Allow-Origin: * (not recommended for secure sites)
- **Whitelist**: Only allow specific trusted domains
- **Dynamic**: Check referrer header and respond accordingly
