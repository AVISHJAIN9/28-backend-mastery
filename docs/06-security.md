# Security Audit: Hardening Node.js Applications

## OWASP Top 10 Protections
1. **Timing Attack Protection**: Use `crypto.timingSafeEqual` for secret and hash comparisons.
2. **ReDoS (Regular Expression Denial of Service)**: Avoid nested quantifiers; enforce regex execution timeouts.
3. **Prototype Pollution**: Freeze base prototypes and validate JSON schema structures using Zod.
4. **Header Hardening**: Use `helmet` to inject strict CSP, HSTS, and frameguard headers.
