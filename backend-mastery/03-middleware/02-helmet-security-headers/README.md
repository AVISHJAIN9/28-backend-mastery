# Helmet Security Headers Middleware

## What is this?
Helmet.js is a middleware that sets HTTP response headers to protect application against well-known web vulnerabilities by implementing security best practices.

## Why does it matter?
- **XSS Protection**: Prevents cross-site scripting attacks
- **Clickjacking Prevention**: Stops sites from being framed
- **MIME Sniffing**: Prevents browsers from guessing content types
- **HSTS**: Forces HTTPS connections
- **CSP**: Controls which resources can load
- **Easy Implementation**: Single middleware call enables all protections

## How it works (step by step)
1. Request arrives at Express app
2. Helmet middleware executes before route handler
3. Helmet adds security headers to response
4. Headers instruct browser on security behavior
5. Browser enforces these restrictions
6. Response sent with enhanced security

## Key concepts
- **X-Frame-Options**: Prevents clickjacking (DENY, SAMEORIGIN, ALLOW-FROM)
- **X-Content-Type-Options**: Prevents MIME sniffing (nosniff)
- **Strict-Transport-Security**: Forces HTTPS (max-age=31536000)
- **Content-Security-Policy**: Controls resource loading sources
- **X-XSS-Protection**: Browser XSS filter enablement
- **Referrer-Policy**: Controls referrer information

## Common mistakes
- Not using Helmet in production
- Misconfiguring CSP too strict (blocking legitimate resources)
- Not combining with other security measures
- Forgetting to use HTTPS with HSTS
- Allowing all sources in CSP

## Real world usage
```javascript
// Enable all Helmet protections
const helmet = require('helmet');
app.use(helmet());

// Result: Response includes headers like:
// X-Frame-Options: DENY
// X-Content-Type-Options: nosniff
// Strict-Transport-Security: max-age=31536000
// Content-Security-Policy: default-src 'self'
```
