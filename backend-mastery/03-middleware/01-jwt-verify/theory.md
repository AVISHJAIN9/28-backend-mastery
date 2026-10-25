# JWT Verification Pattern

Middleware for verifying JWT tokens on protected routes:

1. **Generate Token**: Create JWT with claims (userId, role, etc)
2. **Attach to Request**: Middleware decodes token from Authorization header
3. **Verify Signature**: Validate token hasn't been tampered with
4. **Check Expiration**: Verify token hasn't expired
5. **Attach Claims**: User data available in req.user
6. **Refresh Flow**: Issue new token when near expiration
7. **Role Extraction**: Claims include role for RBAC & Concepts
<!-- Pre-written theory will appear here -->
