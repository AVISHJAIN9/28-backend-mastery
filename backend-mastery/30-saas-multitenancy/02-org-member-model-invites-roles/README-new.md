# Module 02: Organization Members, Invites & Roles

## Overview

This module teaches **Role-Based Access Control (RBAC)** in a multi-tenant SaaS. You'll learn:

- How to model **one-to-many relationships** (organizations → members)
- **Permission systems**: What can each role do?
- **Invitation flow**: How team members join organizations
- **Role hierarchy**: admin → owner → member
- **Real-world security**: Preventing privilege escalation

### Key Concepts
```
Organization
├─ User (role: admin)
├─ User (role: owner)
└─ User (role: member)
```

---

## Architecture

### Database Schema
```javascript
const users = {
  'user-1': { id: 'user-1', email: 'alice@test.com', name: 'Alice', password: '...' }
};

const organizations = {
  'org-1': { id: 'org-1', name: 'Acme Corp', owner_id: 'user-1', created_at: '...' }
};

const organizationMembers = {
  'member-1': { id: 'member-1', org_id: 'org-1', user_id: 'user-1', role: 'admin', joined_at: '...' }
};

const invitations = {
  'invite-1': { id: 'invite-1', org_id: 'org-1', email: 'bob@test.com', role: 'member', status: 'pending', expires_at: '...' }
};

const permissions = {
  admin: { can_invite: true, can_remove: true, can_change_roles: true },
  member: { can_invite: false, can_remove: false, can_change_roles: false }
};
```

### API Endpoints
```
POST   /api/auth/login                    # Get token
GET    /api/orgs                          # User's organizations
GET    /api/orgs/:id/members              # List members
POST   /api/orgs/:id/members/invite       # Invite user by email
POST   /api/invites/:id/accept            # Accept invitation
DELETE /api/orgs/:id/members/:user_id     # Remove member
PATCH  /api/orgs/:id/members/:user_id     # Change role
```

---

## Running the Module

### Prerequisites
```bash
Node.js 16+ installed
```

### Installation
```bash
cd 02-org-member-model-invites-roles
npm install
```

### Environment Variables
Create `.env`:
```env
JWT_SECRET=your-secret-key-change-this
HTTP_PORT=4002
NODE_ENV=development
```

### Start Server
```bash
npm start
# Server runs on http://localhost:4002
```

### Test with UI
Open browser: `http://localhost:4002`

---

## Usage Examples

### 1. Login (Get JWT Token)
```bash
curl -X POST http://localhost:4002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@test.com", "password": "password123"}'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "user-1", "email": "alice@test.com" }
}
```

### 2. List User's Organizations
```bash
curl -X GET http://localhost:4002/api/orgs \
  -H "Authorization: Bearer eyJhbGc..."

# Response:
[
  { "id": "org-1", "name": "Acme Corp", "role": "admin" }
]
```

### 3. Invite User to Organization
```bash
curl -X POST http://localhost:4002/api/orgs/org-1/members/invite \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@example.com", "role": "member"}'

# Response:
{
  "id": "invite-1",
  "email": "bob@example.com",
  "role": "member",
  "status": "pending"
}
```

### 4. Accept Invitation
```bash
curl -X POST http://localhost:4002/api/invites/invite-1/accept \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@example.com"}'

# Response:
{
  "success": true,
  "org": { "id": "org-1", "name": "Acme Corp" },
  "role": "member"
}
```

---

## Testing Scenarios

### Scenario 1: Adding Team Members
```
1. Alice (admin) invites Bob to org
2. Bob receives invitation
3. Bob accepts → joins org as "member"
4. Alice changes Bob's role to "owner"
✓ Test: Can admin change roles?
✗ Test: Can member change roles? (should fail)
```

### Scenario 2: Permission Validation
```
✓ Admin can:  invite, remove, change roles, delete org
✓ Owner can:  invite, remove, change roles
✓ Member can: view org, view members
✗ Member cannot: invite, remove, change roles, delete org
```

### Scenario 3: Privilege Escalation Attack
```javascript
// VULNERABLE:
POST /api/orgs/org-1/members/user-2
{
  "role": "admin"  // User changes their own role!
}

// SECURE: Server validates
// Only current admin/owner can change roles
// Members cannot modify their own role
```

---

## Key Learning Points

### 1. Join Table Pattern
```javascript
// Many-to-many: Users ←→ Organizations
// Solution: Join table with additional attrs (role)
organizationMembers = [
  { org_id: 'org-1', user_id: 'user-1', role: 'admin' },
  { org_id: 'org-1', user_id: 'user-2', role: 'member' }
]
```

### 2. Permission Matrix
```javascript
const permissions = {
  admin: {
    can_invite_users: true,
    can_remove_members: true,
    can_change_roles: true
  },
  member: {
    can_invite_users: false,
    can_remove_members: false,
    can_change_roles: false
  }
};
```

### 3. Server-Side Permission Check
```javascript
// Always verify on server, never trust client
app.delete('/api/orgs/:id/members/:user_id', verifyToken, (req, res) => {
  // 1. Verify requester belongs to this org
  // 2. Verify requester has "remove_members" permission
  // 3. Then allow deletion
});
```

---

## Files in This Module

| File | Purpose |
|------|---------|
| `schema.js` | Mock database: users, orgs, members, invites, permissions |
| `controller.js` | Business logic: getUserOrgs, inviteUser, acceptInvite, etc. |
| `middleware.js` | Auth: verifyToken, checkOrgMembership, canRemoveMember |
| `routes.js` | API endpoints: POST /orgs/:id/members/invite, DELETE /members/:id |
| `server.js` | Express app setup, port 4002, CORS, helmet security |
| `App.jsx` | React UI for testing all endpoints |
| `package.json` | Dependencies: express, jsonwebtoken, cors, helmet |
| `theory.md` | Detailed concepts, real-world examples, attack patterns |
| `setup.md` | Installation & configuration |

---

## Security Checklist

- [ ] **Verify JWT on every request** - validToken middleware
- [ ] **Check org membership** - User belongs to org they're accessing
- [ ] **Check permission level** - User has role for action
- [ ] **Prevent self-role-change** - User can't make themselves admin
- [ ] **Validate email format** - Before sending invites
- [ ] **Expire old invites** - After 7 days, delete pending invites
- [ ] **Log sensitive actions** - All permission changes to audit log
- [ ] **Rate limit invites** - Prevent spam
- [ ] **Filter responses** - Don't leak other users' emails

---

## Common Errors

### Error: User Not in Organization
```
Status: 403
Message: "User org-2 is not a member of org-1"
→ Solution: Verify req.user belongs to requested org
```

### Error: Insufficient Permissions
```
Status: 403
Message: "Members cannot invite users (admin/owner only)"
→ Solution: Check req.user.role against required permission
```

### Error: Invitation Already Used
```
Status: 400
Message: "Invitation already accepted"
→ Solution: Check invitation.status !== 'pending'
```

---

## Next Steps

After mastering this module:

1. **Module 03** - Plan limits (which features can each role access?)
2. **Module 04** - Usage metering (track member activity)
3. **Module 06** - Audit logs (see who invited whom and when)

---

## Real-World Examples

### GitHub Teams
- Admin can manage team members
- Members get assigned permissions (read, write, admin)
- Invites are email-based

### Slack Workspaces
- Workspace owner invites members
- Members can be owner/admin/member/guest
- Roles control channel access, user management

### Figma Teams
- Workspace admins manage team
- Members assigned to projects
- Roles: admin, editor, viewer

---

## Troubleshooting

**Q: "Invalid token" error on /api/orgs**
- A: JWT expired. Re-login to get new token

**Q: Can't accept invitation**
- A: Check invitation hasn't been deleted or expired

**Q: Can't change member role**
- A: Verify you're an admin/owner. Members can't change roles.

---

## References

- [RBAC Design Patterns](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
