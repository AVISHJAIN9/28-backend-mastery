# Theory & Concepts
## Role-Based Access Control (RBAC) Overview
RBAC middleware restricts access based on user role. Users have roles (admin, user, moderator), each with specific permissions.

## RBAC vs Alternatives
- **RBAC**: Role-based, simple (admin, user), coarse-grained
- **ABAC**: Attribute-based, complex (department, location), fine-grained
- **ACL**: Access Control List, specific resource permissions

## Role Examples
- **Admin**: Full access to everything
- **Moderator**: Can moderate content, ban users
- **User**: Can view and create own content
- **Guest**: Read-only access

## Role Hierarchy
Admins have more permissions than moderators, who have more than users, who have more than guests.

## Role Storage
- **JWT**: Include role in token claims
- **Database**: Query role on login
- **Session**: Store role in session
- **Never**: Trust client-side role (DANGEROUS!)

## Access Control Flow
1. Request arrives
2. Extract user identity
3. Get user role from token/database
4. Check if role has permission
5. Allow or deny
6. Log access decision

## Security Principles
- **Fail Closed**: Default deny (not allow)
- **Least Privilege**: Minimum permissions needed
- **Separation of Duties**: No single point of total power
- **Audit Trail**: Log all access decisions
- **Server Verification**: Verify on server, never trust client

## Common Mistakes
- Storing role on client (can be spoofed)
- Not verifying role server-side
- Role not refreshed in token
- No audit trail
- Too many roles (hard to manage)
