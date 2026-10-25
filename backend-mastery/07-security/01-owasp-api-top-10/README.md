# Module: OWASP API Security Top 10

## Overview
🔒 This module provides comprehensive training on **OWASP API Security Top 10** - a critical security vulnerability.

## What You'll Learn
- ✅ How the vulnerability works
- ✅ Real-world attack examples
- ✅ Secure implementation patterns
- ✅ Testing procedures
- ✅ Prevention strategies

## Quick Start (2 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

The server will run on **port 4001**.

### 3. Get Login Credentials
```bash
curl http://localhost:4001/api/demo-credentials
```

### 4. Login to Get JWT Token
```bash
curl -X POST http://localhost:4001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123"
  }'

# Save the token from response
export TOKEN="eyJhbG..."
```

### 5. Test Vulnerable vs Secure

#### Vulnerable Endpoint (No Security)
```bash
curl http://localhost:4001/api/vulnerable/...
# See how the attack works!
```

#### Secure Endpoint (With Security)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4001/api/secure/...
# See the fix in action
```

## File Structure

```
.
├── server.js           # Express backend with vulnerable + secure endpoints
├── controller.js       # Business logic layer
├── middleware.js       # Auth & validation middleware
├── routes.js           # API route definitions
├── schema.js           # Joi validation schemas
├── App.jsx             # React testing UI
├── package.json        # Dependencies
├── .env.example        # Environment template
├── theory.md           # Security theory & concepts
├── setup.md            # Installation guide
├── checklist.md        # Security hardening checklist
└── README.md          # This file
```

## API Endpoints

### Authentication
- `POST /api/login` - Get JWT token

### Vulnerable Endpoints
These show the security flaw:
- `GET /api/vulnerable/...` - Demonstrates vulnerability

### Secure Endpoints  
These show the fix:
- `GET /api/secure/...` - Implements security controls

### Demo Endpoints
- `GET /api/health` - Health check
- `GET /api/demo-credentials` - Get test credentials

## Key Concepts

### The Vulnerability
OWASP API Security Top 10 allows attackers to...

[See theory.md for detailed explanation]

### The Attack
1. Attacker gains access
2. Exploits the flaw
3. Gains unauthorized access/data

### The Defense
1. Implement proper controls
2. Validate all inputs
3. Enforce authorization checks

## Testing Checklist

- [ ] Login successfully
- [ ] Test vulnerable endpoint without auth
- [ ] Test vulnerable endpoint with wrong user ID
- [ ] Test secure endpoint - access own data ✓
- [ ] Test secure endpoint - try accessing other user ✗
- [ ] Test secure endpoint with admin account
- [ ] Review server logs for security events

## Dependencies

- **express** - Web framework
- **helmet** - Security headers
- **jsonwebtoken** - JWT authentication
- **joi** - Input validation
- **winston** - Logging
- **express-validator** - Express validation middleware

## Security Features Implemented

✅ JWT Authentication  
✅ Role-Based Access Control  
✅ Input Validation  
✅ Rate Limiting  
✅ Security Headers (Helmet)  
✅ CORS Configuration  
✅ Error Handling  
✅ Logging & Monitoring  

## Next Steps

1. **Study Theory**: Read [theory.md](theory.md) for deep dive
2. **Review Code**: Examine server.js for implementation
3. **Run Tests**: Start server and test both endpoints
4. **Tweak Code**: Modify to see what breaks
5. **Add Features**: Extend with your own security controls

## Real-World Application

This training applies to:
- REST APIs
- Web Services
- Microservices
- Mobile Backend APIs
- GraphQL APIs (concepts apply)

## References

- OWASP Top 10
- OWASP API Security Top 10
- CWE (Common Weakness Enumeration)
- Security Best Practices

## Troubleshooting

### Port Already in Use
```bash
lsof -ti:4001 | xargs kill -9
```

### Dependencies Not Installing
```bash
rm -rf node_modules package-lock.json
npm install
```

### Token Not Working
- Ensure token is passed in Authorization header
- Format: `Authorization: Bearer TOKEN_HERE`
- Check token hasn't expired

## Support

For issues or questions:
1. Check theory.md and setup.md
2. Review server.js comments
3. Check the checklist.md

---

**Status**: ✅ Complete and ready for testing

**Last Updated**: Mon Mar 30 09:49:51 IST 2026

**Version**: 1.0.0
