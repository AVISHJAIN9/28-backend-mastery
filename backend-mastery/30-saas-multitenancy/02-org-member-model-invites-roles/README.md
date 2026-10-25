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

```
┌─────────────────────────────────────┐
│      Organization (Tenant)          │
│  • Acme Corp                        │
│  • Owned by User A                  │
└──────────────┬──────────────────────┘
               │
     ┌─────────┴─────────┬──────────────┬───────────────┐
     │                   │              │               │
┌────▼─────┐        ┌─────▼────┐  ┌────▼────┐   ┌─────▼────┐
│ Alice    │        │   Bob    │  │ Charlie │   │ Invite   │
│ (Owner)  │        │  (Admin) │  │(Member) │   │  (Pending)
│ All Perms│        │Read+Write│  │Read Only│   │  4h Left │
└──────────┘        └──────────┘  └─────────┘   └──────────┘
```

---

## Key Features

### 1. Organization Ownership
- One user creates/owns organization
- Owner has all permissions
- Owner can add/remove members

### 2. Role-Based Access
| Role | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| **Owner** | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ❌ |
| **Member** | ❌ | ✅ | - | ❌ |
| **Viewer** | ❌ | ✅ | ❌ | ❌ |

### 3. Invite System
- Generate time-limited invite tokens
- Invite via email
- Accept/Reject invites
- Pending invites displayed

### 4. Permission Matrix
- RLS filters by organization membership
- Roles determine action permissions
- Admin can manage team

---

## Database Schema

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,      -- From Module 01
  name VARCHAR(255),
  plan TEXT DEFAULT 'free',
  owner_id UUID NOT NULL,
  created_at TIMESTAMP
);

-- Organization Members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP,
  UNIQUE(org_id, user_id)
);

-- Invites (Pending)
CREATE TABLE organization_invites (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  email VARCHAR(255),
  token VARCHAR(255) UNIQUE,
  role TEXT DEFAULT 'member',
  expires_at TIMESTAMP,
  accepted_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

---

## API Endpoints

### Organization Management
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - List user's organizations
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization (owner only)
- `DELETE /api/organizations/:id` - Delete organization (owner only)

### Member Management
- `GET /api/organizations/:id/members` - List organization members
- `PUT /api/organizations/:id/members/:userId` - Update member role (admin+)
- `DELETE /api/organizations/:id/members/:userId` - Remove member (admin+)

### Invitations
- `POST /api/organizations/:id/invites` - Send invite (admin+)
- `GET /api/invites/pending` - List pending invites for user
- `POST /api/invites/:token/accept` - Accept invite
- `POST /api/invites/:token/reject` - Reject invite
- `DELETE /api/invites/:id` - Revoke invite (admin+)

---

## Testing Flow

1. **User A** creates organization "Acme Corp"
2. **User A** invites User B (bob@acme.com) as Admin
3. **User B** accepts via invite link
4. **User B** is now Admin, can invite others
5. **User B** invites User C as Member
6. **User C** can only read, cannot modify

---

## Security Considerations

- ✅ Invite tokens are random and time-limited (4 hours)
- ✅ RLS prevents cross-tenant access
- ✅ Role validation before operations
- ✅ Owner cannot be removed from organization
- ✅ Audit log of all membership changes
- ❌ Email verification not shown (implementation detail)

---

## Real-World Patterns

### Pattern 1: Email-Based Invites
```javascript
// Send invite link via email
const invite = await createInvite(org_id, email, role);
const inviteLink = `https://app.com/join/${invite.token}`;
// Email: "You're invited to Acme Corp. Click here: {inviteLink}"
```

### Pattern 2: Self-Service Signup
```javascript
// User enters email and organization name
const org = await createOrganization(userId, orgName);
// User automatically becomes owner
```

### Pattern 3: Permission Delegation
```javascript
// Admin adds new admin
await updateMemberRole(org_id, new_user_id, 'admin');
// New admin can now invite others
```

---

## Next Steps After This Module

- **Module 03:** Plans & Feature Flags (limit features by org role)
- **Module 04:** Usage Metering (track usage per org)
- **Module 05:** Subdomain Routing (org-specific subdomains)
- **Module 06:** Audit Logs (track who added whom)
