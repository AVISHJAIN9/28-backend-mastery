# Tenant Isolation: Database Schema & Row-Level Security

## Overview

This module demonstrates how to implement **tenant isolation** in a multi-tenant SaaS application using PostgreSQL Row-Level Security (RLS). 

- **Database Model:** Shared database, shared schema, separate rows per tenant
- **Security Mechanism:** PostgreSQL RLS policies
- **Authentication:** JWT tokens with tenant_id
- **Tenant Extraction:** From JWT claims

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Multiple Tenants (Acme Corp, Beta Inc, etc.)  │
│  Each with separate users, documents, projects  │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │  Shared Database    │
        │  (PostgreSQL)       │
        │                     │
        │ ┌─ users           │
        │ │ ┌─ tenant_id (RLS) │
        │ │ ├─ id            │
        │ │ ├─ name          │
        │ │ └─ email         │
        │ │                   │
        │ ┌─ documents        │
        │ │ ├─ tenant_id (RLS) │
        │ │ ├─ id            │
        │ │ ├─ title         │
        │ │ └─ content       │
        │ │                   │
        │ └─ projects        │
        │   ├─ tenant_id (RLS) │
        │   ├─ id            │
        │   └─ name          │
        │                     │
        │ RLS Policies:       │
        │ · Filter by         │
        │   current_tenant_id │
        └─────────────────────┘
```

---

## Key Concepts

### Multi-Tenancy Models
1. **Separate Database** - One DB per tenant (expensive, secure)
2. **Separate Schema** - One schema per tenant in shared DB
3. **RLS (Recommended)** - Shared DB + RLS policies

### Row-Level Security (RLS)
- Database-level access control
- Automatically filters rows based on tenant context
- Applied before application code runs
- Protects against code bugs and SQL injection

### Tenant Extraction
- Extract `tenant_id` from JWT token
- Set `app.current_tenant_id` session variable in PostgreSQL
- RLS policies use this variable to filter queries

---

## Setup & Installation

### Prerequisites
- Node.js 16+
- PostgreSQL 13+ (or mock mode for demo)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Initialize Database (Optional)
```bash
psql -U postgres < schema.sql
```

### 4. Start Server
```bash
npm start
```

Server runs on `http://localhost:4001`

### 5. Run Tests
```bash
npm test
```

---

## API Endpoints

### Authentication
```
POST /api/auth/login
Body: { userId: "user-1" }
Response: { token, user: { id, tenant_id, name } }
```

### Documents (RLS Protected)
```
GET    /api/documents                    # List all documents (filtered by RLS)
GET    /api/documents/:id                # Get specific document
POST   /api/documents                    # Create document
PUT    /api/documents/:id                # Update document
DELETE /api/documents/:id                # Delete document
```

### Tenant Management
```
GET /api/tenant/info                     # Get current tenant info
GET /api/users                          # Get users in tenant (RLS filtered)
GET /api/test/rls                       # Test RLS enforcement
```

---

## Security Implementation

### 1. Database Schema
Every multi-tenant table has a `tenant_id` column:

```prisma
model Document {
  id UUID @default(cuid())
  tenant_id UUID @db.Uuid
  title String
  content String
  owner_id UUID
  
  tenant Tenant @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  owner User @relation(fields: [owner_id], references: [id])
}
```

### 2. RLS Policies
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON documents
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 3. Middleware: Extract & Set Tenant
```javascript
// 1. Extract from JWT
const decoded = jwt.verify(token, SECRET);
req.tenant_id = decoded.tenant_id;

// 2. Set in database
await db.query('SET app.current_tenant_id = $1', [req.tenant_id]);

// 3. RLS automatically filters queries
const documents = await db.query('SELECT * FROM documents');
// Returns only documents WHERE tenant_id = current_tenant_id
```

---

## Testing Scenarios

### Scenario 1: Tenant Boundary (✅ Pass if RLS works)
```javascript
// Login as Alice (Acme Corp - tenant-1)
// Create document "Acme Strategy"

// Login as Charlie (Beta Inc - tenant-2)
// Query documents
// Expected: Only Charlie's docs visible, NOT "Acme Strategy"
// If visible: ❌ RLS broken!
```

### Scenario 2: RLS Enforcement
```javascript
// Even if app sets wrong tenant_id:
await db.query('SET app.current_tenant_id = tenant-2');
const docs = await db.query('SELECT * FROM documents WHERE id = "acme-doc"');
// RLS prevents access to acme-doc (belongs to tenant-1)
// Result: Empty
```

### Scenario 3: Cascading Deletion
```javascript
// Delete tenant-1
// All users, documents, projects in tenant-1 auto-delete
// Orphaned data prevents accidental data leaks
```

---

## Files Explained

| File | Purpose |
|------|---------|
| `theory.md` | Deep dive into RLS, tenant models, security |
| `schema.js` | PostgreSQL schema with RLS policies |
| `middleware.js` | Tenant extraction, RLS context setting |
| `controller.js` | Business logic for documents & users |
| `routes.js` | API endpoint definitions |
| `server.js` | Express app setup |
| `App.jsx` | React testing UI |
| `package.json` | Dependencies |

---

## Common Mistakes

| ❌ Wrong | ✅ Right |
|---------|---------|
| Forget to add `tenant_id` field | Include `tenant_id` in every table |
| RLS not enabled | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |
| Set `tenant_id` after query | Set BEFORE querying |
| Rely only on application-level filtering | Always enforce at database level |
| Cache without tenant key | Include `tenant_id` in cache key |
| Mixed-tenant transactions | One transaction = one tenant |

---

## Production Checklist

- [ ] RLS enabled on all multi-tenant tables
- [ ] All non-tenant tables reviewed (some may share data)
- [ ] Tenant ID validated from trusted source (JWT, not headers)
- [ ] RLS policies tested with cross-tenant queries
- [ ] Audit logging on tenant escalations
- [ ] Backups scoped by tenant (disaster recovery)
- [ ] Admin impersonation strictly logged
- [ ] Cache keys include tenant ID
- [ ] Row-level audit trail maintained
- [ ] Regular RLS enforcement testing

---

## Troubleshooting

### Problem: Seeing other tenant's data
- Check: Is RLS enabled on table?
- Check: Is `app.current_tenant_id` set before query?
- Check: Is RLS policy correct?

### Problem: Access denied errors
- Check: Does user belong to this tenant?
- Check: Is `tenant_id` in query matching RLS policy?

### Problem: Slow queries
- Add indexes on `tenant_id` columns
- Include `tenant_id` in WHERE clauses

---

## References

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-tenancy SaaS Patterns](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)
- [NIST Multi-tenancy Security](https://csrc.nist.gov/publications/detail/sp/800-92)

