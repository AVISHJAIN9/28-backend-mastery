# SaaS Multitenancy Module

## Overview

This module covers 8 essential topics for building scalable, secure multi-tenant SaaS applications.

### Topics Covered

1. **Tenant Isolation & RLS** - Database-level security with PostgreSQL Row-Level Security
2. **Organization Members & Invites** - User management, roles, and team invitations
3. **Plans & Feature Flags** - Pricing tiers and feature access control
4. **Usage Metering** - API call tracking and billing dimensions
5. **Subdomain Routing** - Tenant context from DNS and request handling
6. **Audit Logs** - Compliance and security event tracking
7. **Data Export** - GDPR portability and user data export
8. **Admin Panel** - Impersonation and debugging tools

---

## Architecture: Complete SaaS Example

```
┌──────────────────────────────────────┐
│   Multiple Tenants (Companies)       │
├──────────────────────────────────────┤
│  acme.example.com → org-1             │
│  beta.example.com → org-2             │
│  custom-domain.com → org-3            │
└──────────────────────────────────────┘
                    ↓
          ┌─────────────────────┐
          │  Shared Database    │
          │  (PostgreSQL + RLS) │
          │                     │
          │ • tenants           │
          │ • users             │
          │ • organization_     │
          │   members           │
          │ • documents         │
          │ • usage_metrics     │
          │ • audit_logs        │
          └─────────────────────┘
```

---

## Quick Start

### Module 1: Tenant Isolation & RLS

```bash
cd 01-tenant-isolation-db-schema-rls
npm install
npm start
```

Open `preview.html` in browser to test.

### Key Concepts

- RLS filters data automatically at database level
- tenant_id on every multi-tenant table
- Middleware extracts tenant from JWT
- Database enforces per-tenant boundaries

---

## Module Progression

**Prerequisite**: Complete Module 1 (Tenant Isolation)

### Module 2: Organization Members & Invites
- User accounts can join multiple organizations
- Role-based access (owner, admin, member, viewer)
- Invite flow with email tokens
- Permission matrix

### Module 3: Plans & Feature Flags
- Pricing tiers (free, basic, pro, enterprise)
- Feature gates per plan
- Usage limits enforcement
- Upsell triggers

### Module 4: Usage Metering
- Real-time API call counting
- Billing dimensions (calls, storage, seats)  
- Quota enforcement
- Grace periods and warnings

### Module 5: Subdomain Routing
- Extract tenant from subdomain (acme.example.com)
- Wildcard DNS configuration
- SSL certificate strategy
- Custom domain support

### Module 6: Audit Logs
- Track who did what and when
- Compliance (HIPAA, SOC 2, GDPR)
- Immutable append-only logs
- Sensitive data masking

### Module 7: Data Export & GDPR
- User data portability
- JSON/CSV export
- Right to deletion with confirmation
- 30-day compliance

### Module 8: Admin Panel
- Secure impersonation (1-hour limit)
- Admin debug endpoints
- Usage visualization
- Login history and API keys

---

## Security Best Practices

### Tenant Isolation
```javascript
// ✅ Before every query:
await db.query('SET app.current_tenant_id = $1', [req.tenant_id]);

// ❌ Never do this:
SELECT * FROM documents; // Without RLS!
```

### Feature Enforcement
```javascript
// ✅ Server-side gates
if (!await canUseFeature(req.user.id, 'api')) {
  return res.status(403).json({ error: 'Feature not in plan' });
}

// ❌ Client-side only
// Users can remove checks in browser console
```

### Audit Logging
```javascript
// ✅ Log sensitive actions
await auditLog({
  action: 'data:export',
  user_id: req.user.id,
  resource: 'all_documents'
});

// ✅ Immutable logs (no DELETE allowed)
```

---

## Real-World Examples

### Slack
- Organizations = Workspaces
- Members with roles
- Per-workspace audit logs
- Export workspace data

### GitHub
- Organizations with teams
- Role-based permissions
- Usage tracking (API calls)
- Audit logs for compliance

### Notion
- Workspaces = organizations
- Shared pages by role
- Usage limits (monthly syncs)
- Data portability export

---

## Database Schema Highlights

```sql
-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  subdomain VARCHAR(255) UNIQUE,
  custom_domain VARCHAR(255),
  plan VARCHAR(50),
  created_at TIMESTAMP
);

-- Users table (global accounts)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP
);

-- Members table (join table)
CREATE TABLE org_members (
  id UUID PRIMARY KEY,
  organization_id UUID,
  user_id UUID,
  role VARCHAR(50), -- owner, admin, member
  UNIQUE(organization_id, user_id)
);

-- Invites table
CREATE TABLE org_invites (
  id UUID PRIMARY KEY,
  organization_id UUID,
  email VARCHAR(255),
  role VARCHAR(50),
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP
);

-- Usage metrics
CREATE TABLE usage_metrics (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID,
  metric_name VARCHAR(100),
  value BIGINT,
  recorded_at TIMESTAMP
);

-- Audit logs (immutable)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  user_id UUID,
  action VARCHAR(100),
  resource_type VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  timestamp TIMESTAMP
);
```

---

## Implementation Checklist

- [x] **Module 1 Complete**
  - [x] Theory.md - RLS concepts
  - [x] Schema with RLS policies
  - [x] Middleware for tenant extraction
  - [x] Controller with CRUD operations
  - [x] React testing UI
  - [x] Mock database

- [x] **Module 2 In Progress**
  - [x] Theory.md - Member model
  - [x] Schema with invites
  - [x] Controller for invites
  - [ ] Complete server.js
  - [ ] React UI for invites
  - [ ] README

- [ ] **Modules 3-8**
  - [ ] Theory.md (comprehensive)
  - [ ] Schema files
  - [ ] Controllers
  - [ ] Server implementations
  - [ ] React UIs
  - [ ] Documentation

---

## Learning Resources

### PostgreSQL RLS
- [Official Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

### Multi-Tenancy Patterns
- [Microsoft Azure Multi-Tenancy](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)
- [Auth0 Multi-Tenancy Guide](https://auth0.com/docs/get-started/auth-glossary#multi-tenancy)

### SaaS Architecture
- [Building SaaS Systems](https://www.stripe.com/guides/saas-guide)
- [Designing Data-Intensive Applications](https://dataintensive.net/)

---

## Next Steps

1. **Complete Module 1** - Understand RLS fundamentals
2. **Study Module 2** - User management patterns
3. **Implement your own** - Adapt concepts to your app
4. **Add real database** - Switch from mock to PostgreSQL
5. **Implement billing** - Connect to Stripe/Paddle
6. **Scale horizontally** - Add caching, queuing

---

## Questions & Debugging

### Common Issues

**Q: RLS not filtering data**
A: Check that `app.current_tenant_id` is set BEFORE query

**Q: Users see other tenant's data**
A: Verify RLS policy syntax and database enforcement

**Q: API calls not metered**
A: Increment counter BEFORE checking quota

### Support

See individual module README.md files for detailed documentation.
