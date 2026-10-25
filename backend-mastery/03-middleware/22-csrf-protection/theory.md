# CSRF Protection Middleware

## Overview
Cross-Site Request Forgery (CSRF) is an attack where malicious sites trick users into making unwanted requests on authenticated sites. CSRF middleware prevents this through token validation.

## Key Concepts

### 1. CSRF Attack Flow
1. User logs into `bank.com`
2. User visits `malicious.com` (in another tab)
3. Malicious site includes: `<img src="bank.com/transfer?amount=1000&to=attacker">`
4. Browser automatically sends credentials
5. Money transferred without user consent

### 2. CSRF Protection Methods
- **Synchronizer Token Pattern**: Generate & validate tokens
- **Double Submit Cookies**: Compare token in cookie vs body
- **SameSite Cookie**: Restrict cookie in cross-site requests
- **Custom Headers**: Check for CSRF token in headers

### 3. Token Implementation
- **Generate**: Create random token per session
- **Store**: Keep in session or hidden form field
- **Validate**: Compare against submitted token
- **Refresh**: Regenerate on each form submission

## SameSite Cookie Levels

```javascript
// Strict: Cookie never sent cross-site
Set-Cookie: sessionId=abc123; SameSite=Strict

// Lax: Full requests blocked, subresource requests allowed
Set-Cookie: sessionId=abc123; SameSite=Lax

// None: Cookie always sent (requires Secure flag)
Set-Cookie: sessionId=abc123; SameSite=None; Secure
```

## Common CSRF Token Libraries

### csurf (Express CSRF Middleware)
```javascript
const csrf = require('csurf');
csrfProtection = csrf({ cookie: false });

app.get('/form', csrfProtection, (req, res) => {
  res.send(`<input name="_csrf" value="${req.csrfToken()}">`);
});

app.post('/submit', csrfProtection, (req, res) => {
  res.json({ message: 'Valid CSRF token' });
});
```

## Security Best Practices

1. **Use SameSite=Strict** for maximum protection
2. **CSRF tokens** on all state-changing requests (POST/PUT/DELETE)
3. **Validate tokens** server-side always
4. **HttpOnly cookies** containing session data
5. **Token rotation** for sensitive operations
6. **Custom headers** for API requests
7. **Document API consumers** about token requirements

## Real-World CSRF Example

**OWASP WebGoat:**
- Users unknowingly change passwords
- Transfer funds without knowing
- Update profiles with malicious data

**Prevention:**
- CSRF tokens validated on every POST/PUT/DELETE
- Token mismatch returns 403 Forbidden
- Tokens tied to session/user

## Detection & Monitoring

- Log failed CSRF validations
- Alert on repeated CSRF failures (bot attacks)
- Monitor for unusual cross-origin requests
- Track which endpoints receive most CSRF attempts

## Limitations & Considerations

- **Not for APIs**: Use Authorization headers instead
- **State-changing requests only**: GET requests shouldn't be affected
- **User experience**: Extra token management complexity
- **Token storage**: Form fields vs hidden input vs double-submit cookies
