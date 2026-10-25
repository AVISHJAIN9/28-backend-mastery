# Backend Mastery: Complete Authentication Repository

Complete implementation of 31 authentication patterns for backend development. Each module includes production-ready backend (Node.js/Express), frontend (React), comprehensive documentation, and theory.

## 📚 31 Authentication Types

### 1. **User Login & Register**
Basic user registration and login with password hashing (bcrypt) and session tokens.
- **Key Features**: Password hashing, session tokens, input validation
- **Security**: Bcrypt salting, secure token generation
- **Use Case**: Foundation for most applications

### 2. **JWT Access & Refresh Tokens**
Two-token authentication system with short-lived access tokens and long-lived refresh tokens.
- **Key Features**: JWT signing, token rotation, expiry management
- **Security**: Token signatures, expiration validation
- **Use Case**: Stateless, scalable authentication

### 3. **OAuth2 Google Social Login**
OAuth 2.0 integration with Google for social login and PKCE support.
- **Key Features**: Google OAuth, PKCE flow, social identity
- **Security**: Authorization code flow, state parameters
- **Use Case**: Third-party authentication

### 4. **Passkeys & WebAuthn**
Biometric and hardware key authentication using FIDO2 WebAuthn standard.
- **Key Features**: Biometric login, hardware keys, phishing-resistant
- **Security**: Public key cryptography, attestation
- **Use Case**: Maximum security, passwordless authentication

### 5. **2FA TOTP/OTP**
Two-factor authentication with time-based one-time passwords.
- **Key Features**: TOTP/HOTP, QR codes, backup codes
- **Security**: Time-based tokens, secret sharing
- **Use Case**: Enhanced account security

### 6. **Magic Link Passwordless**
Passwordless authentication via email verification links.
- **Key Features**: Email verification, magic links, token expiry
- **Security**: Time-limited links, secure token generation
- **Use Case**: User-friendly passwordless login

### 7. **PKCE OAuth for SPAs**
OAuth 2.0 with Proof Key for Code Exchange for single-page applications.
- **Key Features**: PKCE flow, code challenges, SPA safe
- **Security**: Authorization code flow with challenge
- **Use Case**: Secure OAuth in browser-based apps

### 8. **RBAC Fine-Grained Permissions**
Role-based access control with detailed permission management.
- **Key Features**: Roles, permissions, hierarchical control
- **Security**: Authorization checks, role validation
- **Use Case**: Multi-tenant applications, granular control

### 9. **ABAC Attribute-Based Access**
Attribute-based access control for dynamic authorization policies.
- **Key Features**: Attributes, policies, dynamic rules
- **Security**: Policy evaluation, context-aware access
- **Use Case**: Complex authorization scenarios

### 10. **Refresh Token Rotation Family**
Secure refresh token rotation with family-based breach detection.
- **Key Features**: Token rotation, family tracking, breach detection
- **Security**: Detect token reuse, automatic revocation
- **Use Case**: Long-lived session management

### 11. **SSO SAML Enterprise**
SAML-based enterprise single sign-on for corporate environments.
- **Key Features**: SAML assertions, federation, enterprise
- **Security**: XML signatures, attribute assertions
- **Use Case**: Enterprise applications

### 12. **Session Auth with Cookies & CSRF**
Traditional session-based authentication with CSRF protection.
- **Key Features**: HTTP-only cookies, CSRF tokens, sessions
- **Security**: Secure cookies, SameSite attributes
- **Use Case**: Traditional web applications

### 13. **API Key Authentication**
API key-based authentication with hashing and rotation.
- **Key Features**: API keys, key rotation, rate limiting
- **Security**: Key hashing, secure transmission
- **Use Case**: Service-to-service authentication

### 14. **MFA with Backup Codes**
Multi-factor authentication with backup code recovery.
- **Key Features**: Backup codes, recovery, MFA
- **Security**: Secure code generation, one-time use
- **Use Case**: Account recovery and fallback

### 15. **Brute Force Protection & Lockout**
Account lockout and progressive delays to prevent brute force attacks.
- **Key Features**: Rate limiting, lockout, progressive delay
- **Security**: Account protection, IP tracking
- **Use Case**: Login security

### 16. **CAPTCHA Bot Prevention**
CAPTCHA integration for bot prevention and security.
- **Key Features**: reCAPTCHA, bot detection, challenges
- **Security**: Bot challenge, IP reputation
- **Use Case**: Prevent automated attacks

### 17. **Zero Trust Vault**
Zero trust security model with encryption vault.
- **Key Features**: Zero trust, encryption, audit
- **Security**: Continuous verification, encryption at rest
- **Use Case**: High-security applications

### 18. **Audit Logging**
Comprehensive audit logging for compliance and investigation.
- **Key Features**: Event logging, audit trail, compliance
- **Security**: Immutable logs, integrity checks
- **Use Case**: Regulatory compliance

### 19. **Timed Tokens OTP**
Time-based one-time password tokens for secure authentication.
- **Key Features**: Time-based tokens, token generation
- **Security**: Time synchronization, entropy
- **Use Case**: Two-factor authentication

### 20. **Data Masking & PII Protection**
Personal data masking and privacy protection mechanisms.
- **Key Features**: PII masking, data privacy, GDPR
- **Security**: Selective visibility, encryption
- **Use Case**: Privacy compliance

### 21. **Hashed Slugs & IDs**
Hashed user IDs and URL-friendly slugs for privacy.
- **Key Features**: Hash-based IDs, URL slugs, privacy
- **Security**: Hash protection, ID obfuscation
- **Use Case**: User privacy in URLs

### 22. **Self-Deletion & GDPR**
User account self-deletion with GDPR right-to-be-forgotten.
- **Key Features**: Account deletion, data removal, GDPR
- **Security**: Data purging, audit trail
- **Use Case**: Privacy compliance

### 23. **Multi-Signature Authentication**
Multi-signature authentication for critical operations.
- **Key Features**: Multiple signatures, approval workflow, crypto
- **Security**: Distributed trust, signature verification
- **Use Case**: High-value transactions

### 24. **Developer Gateway & API Keys**
Developer portal with API key management and quotas.
- **Key Features**: Developer portal, key management, quotas
- **Security**: Key rotation, rate limiting
- **Use Case**: Developer ecosystem

### 25. **OpenID Connect (OIDC)**
OpenID Connect identity layer built on OAuth 2.0.
- **Key Features**: OIDC, identity federation, standards-based
- **Security**: Identity tokens, attribute assertions
- **Use Case**: Federated identity management

### 26. **Certificate-Based Authentication (mTLS)**
Mutual TLS authentication using X.509 certificates for service-to-service communication.
- **Key Features**: Client certificates, certificate validation, mutual authentication
- **Security**: Public key infrastructure (PKI), certificate pinning, encrypted channels
- **Use Case**: Microservices, API gateway protection, highly secure service-to-service communication

### 27. **LDAP & Active Directory**
Lightweight Directory Access Protocol and Microsoft Active Directory integration for enterprise authentication.
- **Key Features**: Directory queries, user groups, schema validation
- **Security**: LDAP over SSL/TLS, password policy enforcement, account lockout
- **Use Case**: Enterprise environments, Windows domains, centralized user management

### 28. **JWT Key Rotation**
Automatic rotation of JWT signing keys with versioning and smooth key transition.
- **Key Features**: Key versioning, kid (key ID) headers, graceful key transition
- **Security**: Reduces impact of key compromise, algorithm agility
- **Use Case**: Long-lived services requiring key management flexibility

### 29. **Token Revocation & Blacklist**
Token revocation mechanism with blacklist and whitelist patterns for token invalidation.
- **Key Features**: Token blacklisting, revocation lists, real-time invalidation
- **Security**: Immediate token revocation, logout enforcement, breach response
- **Use Case**: Logout functionality, session termination, token compromise response

### 30. **Step-Up Authentication**
Re-authentication requirement for sensitive operations with additional security factors.
- **Key Features**: Adaptive authentication, time-based re-auth, MFA for sensitive operations
- **Security**: Just-in-time verification, context-aware security, privilege escalation
- **Use Case**: Password changes, account settings, high-value transactions

### 31. **Conditional & Risk-Based Authentication**
Dynamic authentication requirements based on risk assessment and contextual factors.
- **Key Features**: Risk scoring, anomaly detection, adaptive authentication
- **Security**: Machine learning-based risk assessment, IP reputation, device fingerprinting
- **Use Case**: Fraud prevention, account security, user experience optimization

---

## 📁 Repository Structure

```
01-authentication/
├── 01-user-login-register/
│   ├── controller.js          # Backend business logic
│   ├── middleware.js          # Auth middleware
│   ├── routes.js              # Express routes
│   ├── schema.js              # Joi validation schemas
│   ├── App.jsx                # React frontend
│   ├── README.md              # Overview and concepts
│   ├── theory.md              # Deep dive technical explanation
│   ├── setup.md               # Installation and setup guide
│   ├── checklist.md           # Implementation checklist
│   ├── preview.html           # Interactive preview
│   └── .env.example           # Environment variables template
├── 02-jwt-access-refresh-tokens/
│   └── [same structure...]
├── 03-oauth2-google-social-login/
│   └── [same structure...]
... (31 total modules)
├── 26-certificate-based-mtls/
│   └── [same structure...]
├── 27-ldap-active-directory/
│   └── [same structure...]
├── 28-jwt-key-rotation/
│   └── [same structure...]
├── 29-token-revocation-blacklist/
│   └── [same structure...]
├── 30-step-up-authentication/
│   └── [same structure...]
└── 31-conditional-risk-based-auth/
    └── [same structure...]
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 14
- npm or yarn
- Database (optional for basic examples)

### Installation

```bash
cd 01-user-login-register

# Install dependencies
npm install express bcryptjs uuid joi cors dotenv

# Set up environment
cp .env.example .env

# Run backend server
node server.js

# In another terminal, run frontend
npm run dev
```

### Basic Example - User Login & Register

#### Backend (Node.js/Express)
```bash
# Start server on http://localhost:3000
node server.js
```

#### API Endpoints
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123","name":"John"}'

# Login  
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123"}'

# Get current user
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <sessionToken>"
```

#### Frontend (React)
- Register form with validation
- Login form with token storage
- Protected dashboard after authentication
- Logout functionality
- Error handling and loading states

## 🔐 Security Features

Each module includes:

✅ **Input Validation** - Joi schema validation
✅ **Password Security** - Bcrypt hashing with salt
✅ **Token Security** - JWT signing and verification
✅ **HTTPS Ready** - All endpoints support secure transmission
✅ **Error Handling** - Consistent error responses
✅ **Rate Limiting** - Implementation guides provided
✅ **Audit Logging** - Logging recommendations
✅ **GDPR Compliance** - Data privacy patterns
✅ **OWASP Standards** - Following best practices

## 📖 Documentation

Each module contains:

1. **README.md** - Overview, why it matters, real-world usage
2. **theory.md** - Deep-dive technical explanation with diagrams
3. **setup.md** - Complete installation and setup instructions
4. **checklist.md** - Implementation checklist and best practices
5. **.env.example** - Environment variables template
6. **Inline code comments** - Detailed code documentation

## 🎯 Learning Path

**Beginner:**
1. User Login & Register (foundation)
2. JWT Access & Refresh Tokens (modern auth)
3. Session Auth with CSRF (traditional web)

**Intermediate:**
4. OAuth2 Google (third-party auth)
5. RBAC Permissions (authorization)
6. 2FA TOTP (multi-factor auth)

**Advanced:**
7. SAML Enterprise (federation)
8. ABAC Attribute-Based (complex policies)
9. Zero Trust Vault (high security)
10. Multi-Signature (distributed trust)

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Authentication**: JWT, bcrypt, passport.js patterns
- **Validation**: Joi
- **Database**: MongoDB/PostgreSQL (documented in modules)

### Frontend
- **Framework**: React
- **State Management**: React Hooks
- **HTTP Client**: Fetch API
- **Styling**: CSS Modules

## 📋 Requirements Met

Each module provides:

✅ Complete backend implementation (controller, middleware, routes, schema)
✅ Frontend React component with full functionality
✅ User login/register (where applicable)
✅ Session/token management
✅ Error handling and validation
✅ Comprehensive README documentation
✅ Theory and deep-dive explanations
✅ Setup instructions with curl examples
✅ Implementation checklist
✅ Environment configuration template
✅ Production-ready code patterns
✅ Security best practices
✅ Real-world usage examples

## 🔄 Common Workflows

### User Registration & Login
1. User registers with email and password
2. Password is hashed with bcrypt
3. User fills login form
4. Credentials validated against stored hash
5. Access token generated and returned
6. Frontend stores token for authenticated requests

### Token Refresh
1. Access token expires (15 mins)
2. Frontend uses refresh token to get new access token
3. Backend validates refresh token
4. New access token issued (still valid for 15 mins)
5. User can continue without re-logging in

### OAuth Social Login
1. User clicks "Login with Google"
2. Redirected to Google with PKCE challenge
3. Google authentication successful
4. User redirected back with authorization code
5. Backend exchanges code for tokens
6. User profile created/updated in system
7. Backend issues session token

### Multi-Factor Authentication
1. User logs in with username/password
2. Primary authentication successful
3. System requests secondary factor (TOTP, biometric, etc.)
4. User provides second factor
5. Second factor validated
6. Session token issued
7. User accessed

## 📊 Statistics

- **Total Modules**: 25
- **Total Files**: 225+
- **Lines of Code**: 10,000+
- **Documentation Pages**: 100+
- **Languages**: JavaScript, React, Markdown

## 🐛 Troubleshooting

### Common Issues

**CORS Error**
- Backend and frontend running on different ports (this is normal)
- Ensure backend has CORS middleware
- Check `Access-Control-Allow-Origin` headers

**Token Not Working**
- Verify token is being sent in Authorization header
- Check token hasn't expired
- Ensure token secret matches between signing and verification

**Password Validation Fails**
- Password must have:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number

**Database Connection Issues**
- Check database is running
- Verify connection string in .env
- Check credentials and permissions

## 🤝 Contributing

To extend any module:
1. Modify controller.js with additional logic
2. Add new routes in routes.js
3. Update frontend in App.jsx
4. Add tests in test files
5. Update documentation

## 📚 Additional Resources

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)

## ⚖️ License

These implementations are provided for educational purposes.

## 🎓 Learning Outcomes

After completing these modules, you will understand:

✅ How authentication systems work
✅ Different authentication patterns and their trade-offs
✅ Security considerations for each approach
✅ How to implement authentication in modern applications
✅ Authorization and access control patterns
✅ Multi-factor authentication
✅ Enterprise authentication (SAML, OIDC)
✅ API security
✅ Compliance requirements (GDPR, PCI-DSS)
✅ Best practices for production systems

## 📞 Support

For questions or issues:
1. Check the module's README.md
2. Review theory.md for deep-dive explanations
3. See setup.md for installation help
4. Check implementation checklist for missing pieces

---

**Happy Learning! 🚀** Each module is a complete, production-ready example that you can use, modify, or extend for your own projects.
