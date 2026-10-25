# RBAC - Role-Based Access Control

## What is this?
Access control based on user roles. Define roles (admin, user, moderator) with specific permissions and assign to users.

## Why does it matter?
- Simplifies access control management
- Scalable permission system
- Reduces complexity vs per-user permissions
- Audit trail for role assignments
- Standard in enterprise applications

## How it works
1. Define roles: admin, editor, viewer, etc.
2. Define permissions for each role
3. Assign users to roles
4. Protect endpoints with role checks
5. User accesses resource → check role → allow/deny
6. Can combine multiple roles per user

## Key concepts
- **Role**: Collection of permissions (admin, user, etc.)
- **Permission**: Specific action (read, write, delete)
- **Role Hierarchy**: Roles can inherit permissions
- **RBAC Middleware**: Enforces role-based access
- **Fine-grained**: Multiple levels of permissions
- **Dynamic**: Roles assigned at runtime

## Common mistakes

## Real world usage
