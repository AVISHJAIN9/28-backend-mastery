# Organization Member Model: Invites & Roles

## Organization Hierarchy in Multi-Tenant SaaS

In multi-tenant systems, a **Tenant** often maps to a **Company/Organization**. Within each organization, you have:

1. **Users** - Individual accounts
2. **Members** - Users who belong to an organization
3. **Roles** - What permissions a member has (admin, editor, viewer, etc.)
4. **Invites** - Pending membership requests
5. **Workspaces** - Sub-groups within organization

### Terms Clarity
- **Tenant** = Organization/Company
- **User** = Individual account (can belong to multiple orgs)
- **Member** = User relationship to specific organization
- **Role** = Permissions within organization context

---

## Member Model Design

### User → Member → Organization

```sql
-- User table (global accounts)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP
);

-- Organization table (tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  subdomain VARCHAR(255) UNIQUE,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP
);

-- Members = Join table (User ↔ Organization)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50), -- 'owner', 'admin', 'member', 'viewer'
  joined_at TIMESTAMP,
  invited_by_id UUID REFERENCES users(id),
  UNIQUE(organization_id, user_id)
);

-- Invitations table
CREATE TABLE organization_invites (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member',
  invited_by_id UUID REFERENCES users(id),
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP, -- NULL until accepted
  UNIQUE(organization_id, email)
);
```

---

## Role-Based Access Control (RBAC)

### Role Hierarchy
```
Owner
  ↓
Admin (all permissions except delete org)
  ↓
Member (create content, edit own)
  ↓
Viewer (read-only)
```

### Permission Matrix
| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| Manage members | ✅ | ✅ | ❌ | ❌ |
| Invite users | ✅ | ✅ | ✅ | ❌ |
| Edit content | ✅ | ✅ | ✅ | ❌ |
| Delete content | ✅ | ✅ | ✅ | ❌ |
| View content | ✅ | ✅ | ✅ | ✅ |
| Delete org | ✅ | ❌ | ❌ | ❌ |
| Billing | ✅ | ✅ | ❌ | ❌ |

---

## Invite Flow

### Step 1: Admin invites user@example.com
```javascript
const invite = {
  id: 'inv-123',
  organization_id: 'org-1',
  email: 'user@example.com',
  role: 'member',
  invited_by_id: 'user-admin',
  created_at: '2024-01-15',
  expires_at: '2024-02-15' // 30 days
};

// Send email with link: /accept-invite?token=<JWT>
```

### Step 2: User clicks link and accepts
```javascript
// Verify token, extract email and org_id
const { email, org_id } = jwt.verify(token, SECRET);

// Check if user exists
let user = await findUserByEmail(email);
if (!user) {
  user = await createUser(email); // Auto-create user
}

// Create membership
await createMember(org_id, user.id, 'member');

// Mark invite as accepted
await updateInvite(invite_id, { accepted_at: NOW() });
```

### Step 3: User can now access organization
```javascript
// User's organizations
SELECT * FROM organizations
  WHERE id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = $1
  );
```

---

## Security Considerations

### Preventing Data Leaks
```javascript
// ❌ BAD: Expose all members
GET /api/organizations/org-1/members
// Any authenticated user could enumerate members

// ✅ GOOD: Auth + role check
GET /api/organizations/org-1/members
// Only members (role != 'viewer') can list members
```

### Email Invitation Security
```
Vulnerability: Email contains all invite details
Risk: If email compromised, anyone can click link

✅ Solution: Link contains only token (JWT or random hash)
```

### Role Escalation Prevention
```javascript
// ❌ BAD: User can change own role
PUT /api/members/me
Body: { role: 'admin' }

// ✅ GOOD: Only higher role can change member role
PUT /api/organizations/org-1/members/user-2
Body: { role: 'admin' }
// Must be 'owner' or 'admin' to change others' roles
```

---

## Real-World Examples

### Slack-Style
- Teams (organizations)
- Channels (workspaces)
- Members with roles (member, admin)
- Invites with custom links

### GitHub-Style
- Organizations (orgs)
- Teams within orgs
- Members with roles
- Bulk invites

### Notion-Style
- Workspaces (orgs)
- Pages (content)
- Guests (limited viewer)
- Share links (public + password)

---

## Implementation Patterns

### Check if user can invite
```javascript
async function canInvite(userId, orgId) {
  const member = await getMember(userId, orgId);
  return ['owner', 'admin', 'member'].includes(member.role);
}

// Usage
if (await canInvite(req.user.id, orgId)) {
  await sendInvite(orgId, email);
}
```

### Check if user can manage members
```javascript
async function canManageMembers(userId, orgId) {
  const member = await getMember(userId, orgId);
  return ['owner', 'admin'].includes(member.role);
}
```

### Auto-join organization (for testing)
```javascript
app.post('/api/org-members/join', async (req, res) => {
  const { organization_id } = req.body;
  
  await createMember(organization_id, req.user.id, 'member');
  res.json({ success: true });
});
```

---

## Common Mistakes

1. **No owner check** - Anyone can create org, no one is responsible
2. **Email in token** - If URL leaked, org membership exposed
3. **No role verification** - Users escalate own roles
4. **No expiration on invites** - Invite links never expire
5. **Invites not deleted** - Ghost invites pile up
6. **No audit log** - Can't track who invited whom
7. **Invite email shows all details** - XSS opportunity in email clients
8. **No pending invite limit** - Spam by inviting thousands of emails

---

## Testing Scenarios

✅ Alice (admin) invites Bob (member)
✅ Bob accepts invite, joins organization
✅ Bob can view org content
❌ Bob cannot invite new members
✅ Alice can revoke Bob's membership
❌ Bob cannot change own role to admin
✅ Charlie (non-member) cannot view org

---

## Key Takeaways

| Aspect | Best Practice |
|--------|---|
| **Model** | Separate User from Member; join table for N:N |
| **Roles** | Hierarchy: Owner > Admin > Member > Viewer |
| **Invites** | Email contains only token, not details |
| **Security** | Always check role before sensitive operations |
| **Expiration** | Invites expire in 30 days |
| **Audit** | Log all member changes |
| **Testing** | Test role-based access boundaries |
