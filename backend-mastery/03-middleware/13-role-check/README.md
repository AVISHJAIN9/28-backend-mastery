# Role Check Middleware

## What is this?
Role-based access control (RBAC) middleware checks user roles and permissions, allowing only authorized users to access specific routes or resources.

## Why does it matter?
- **Security**: Prevent unauthorized access
- **Feature Control**: Different features for different user types
- **Compliance**: Meet regulatory access requirements
- **Multi-tenancy**: Different permissions per tenant
- **Admin Functions**: Protect admin endpoints
- **Audit Trail**: Track who accessed what

## How it works (step by step)
1. Request arrives at protected route
2. User authenticated (JWT, session, etc.)
3. roleCheck middleware executes
4. User role extracted from req.user.role
5. Required role checked
6. If user role matches: Proceed to handler
7. If role doesn't match: Return 403 Forbidden
8. Access logged for audit

## Key concepts
- **Role**: User type (admin, user, moderator, guest)
- **Permission**: Specific action allowed (read, write, delete)
- **RBAC**: Role-Based Access Control
- **ABAC**: Attribute-Based (more granular)
- **JWT Claims**: Role included in token
- **Middleware Chain**: Can check roles, then other permissions

## Common mistakes
- Trusting client-side role claims (verify server-side)
- Creating too many roles (maintenance burden)
- Not logging access attempts
- Role checks after using data (should be first)
- Forgetting to refresh role on token refresh

## Real world usage
```javascript
// Define role check middleware
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Use on routes
app.get('/admin', requireRole('admin'), (req, res) => {
  res.json({ data: 'Admin only data' });
});

app.post('/users', requireRole('admin'), (req, res) => {
  // Only admins can create users
});

app.delete('/users/:id', requireRole('admin'), (req, res) => {
  // Only admins can delete users
});

// Multiple roles
const requireRoles = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

app.get('/reports', requireRoles(['admin', 'manager']), handler);
```
