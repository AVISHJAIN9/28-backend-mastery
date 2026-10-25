# Tenant Isolation: Database Schema & Row-Level Security

## What is Multi-Tenancy?

**Multi-tenancy** is a software architecture where a single application instance serves multiple customers (tenants), each with isolated data. Unlike single-tenancy (one customer = one app instance), multi-tenancy is cost-efficient and scalable.

### Three Multi-Tenancy Models

#### 1. Separate Database per Tenant (DB Isolation)
- Each tenant gets their own database
- **Pros:** Maximum security, compliance-friendly, easy to backup individual tenants
- **Cons:** Expensive, scaling challenges, operational complexity

#### 2. Shared Database + Separate Schema (Schema Isolation)
- All tenants share one database, but each has a schema
- **Pros:** Better resource utilization, easier to manage
- **Cons:** Still expensive for many tenants, compliance complexity

#### 3. Shared Database + Shared Schema + RLS (Row-Level Security) ⭐
- All tenants share database, schema, and tables
- Row-Level Security enforces data separation at database level
- **Pros:** Most cost-efficient, scalable, secure if RLS properly configured
- **Cons:** Requires careful implementation, potential data leaks if misconfigured

---

## Row-Level Security (RLS) - The Foundation

**RLS** is a database-level security feature that automatically filters rows based on tenant context.

### How RLS Works

```
User Query: SELECT * FROM documents;

Without RLS: Returns ALL documents from ALL tenants (SECURITY BREACH!)

With RLS: 
  1. Database identifies current tenant (from session variable)
  2. Automatically adds WHERE tenant_id = current_tenant_id
  3. Returns only that tenant's data
```

### RLS in PostgreSQL

PostgreSQL RLS is enforced at the database level, not the application level.

```sql
-- Enable RLS on table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their tenant's data
CREATE POLICY tenant_isolation_policy ON documents
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- This applies to ALL queries: SELECT, UPDATE, DELETE
-- Even if app logic fails, DB still protects data
```

---

## Database Schema Design for Multi-Tenancy

### Option 1: Separate Database Per Tenant
```sql
-- Database: acme_saas_tenant_1
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255)
);

-- Database: acme_saas_tenant_2
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255)
);

-- Pros: Maximum isolation
-- Cons: N databases to manage, expensive resources
```

### Option 2: Shared Database + Separate Schema
```sql
-- Database: acme_saas
-- Schema: tenant_1
CREATE SCHEMA acme_schema;

CREATE TABLE acme_schema.users (
  id UUID PRIMARY KEY,
  name VARCHAR(255)
);

-- Application maintains schema_name per tenant
```

### Option 3: Shared Database + RLS (Recommended) ⭐
```sql
-- Database: acme_saas
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  subdomain VARCHAR(255) UNIQUE,
  created_at TIMESTAMP
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP
);

CREATE TABLE documents (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY users_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY documents_isolation ON documents
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

---

## Tenant Extraction Pattern

Before any query, application must set the current tenant:

### Step 1: Extract Tenant from Request
```javascript
// From JWT token
const tenant_id = req.user.tenant_id;

// From subdomain (tenant.example.com)
const subdomain = req.hostname.split('.')[0];
const tenant_id = await getTenantIdFromSubdomain(subdomain);

// From path parameter (/org/org-123/...)
const tenant_id = req.params.orgId;
```

### Step 2: Set Database Session Variable
```javascript
// PostgreSQL
const sql = 'SET app.current_tenant_id = $1;'
await db.query(sql, [tenant_id]);

// Now all queries use RLS automatically
const documents = await db.query('SELECT * FROM documents;');
// RLS filters: documents WHERE tenant_id = $1
```

---

## Security Boundaries & Testing

### What RLS Prevents

```javascript
// ❌ ATTACK: Direct query without RLS
SELECT * FROM documents; // Would return all tenant data (before RLS)

// ✅ PROTECTED: RLS enforces tenant boundary
SELECT * FROM documents; // RLS filters: ... WHERE tenant_id = current_setting(...)

// ❌ ATTACK: SQL Injection
SELECT * FROM documents WHERE id = '1'; vs '1 UNION SELECT ...'
// RLS protection: Even if injection occurs, tenant boundary enforced
```

### Vulnerability Scenarios

1. **Missing tenant_id reference in schema**
   - ❌ BAD: `CREATE TABLE products (id, name);` (no tenant_id field)
   - ✅ GOOD: `CREATE TABLE products (id, tenant_id, name);`

2. **RLS not enabled**
   - ❌ Application relies on code-level filtering
   - ✅ Database enforces at row level

3. **Wrong tenant_id set**
   - Application sets wrong `app.current_tenant_id`
   - All queries leak to wrong tenant
   - ✅ Need to validate tenant ownership before setting

4. **Tenant variable not set**
   - Application forgets to call `SET app.current_tenant_id`
   - ❌ Query runs without RLS
   - ✅ Use middleware to enforce this

---

## Best Practices for Tenant Isolation

### 1. Always Include tenant_id in Schema
Every multi-tenant table should have a `tenant_id` field.

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  data TEXT,
  created_at TIMESTAMP
);

-- ✅ Always reference tenant_id in RLS policies
CREATE POLICY resource_isolation ON resources
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 2. Cascade Delete on Tenant Deletion
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
);

-- When tenant is deleted, all dependent rows auto-delete
DELETE FROM tenants WHERE id = $1; -- Cascades delete all users
```

### 3. Middleware Enforces Tenant Context
```javascript
const tenantMiddleware = (req, res, next) => {
  const tenant_id = req.user.tenant_id;
  
  // Set database context
  await db.query('SET app.current_tenant_id = $1', [tenant_id]);
  
  // Store for verification
  req.tenant_id = tenant_id;
  next();
};

// Apply to all routes
app.use(tenantMiddleware);
```

### 4. Validate Tenant Ownership
```javascript
// Before accessing resource, verify tenant ownership
app.get('/api/documents/:id', async (req, res) => {
  const document = await db.query(
    'SELECT * FROM documents WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.tenant_id]
  );
  
  if (!document) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.json(document);
});
```

### 5. Test Tenant Boundaries
```javascript
// Create two tenants
const tenant1 = await createTenant('Acme Corp');
const tenant2 = await createTenant('Beta Inc');

// Create resources in each
const doc1 = await createDocument(tenant1.id, 'Doc1');
const doc2 = await createDocument(tenant2.id, 'Doc2');

// Set context to tenant1
await db.query('SET app.current_tenant_id = $1', [tenant1.id]);

// Query should only return doc1
const results = await db.query('SELECT * FROM documents');
assert(results.length === 1);
assert(results[0].id === doc1.id); // ✅ PASS

// ❌ FAIL: If doc2 is returned, RLS is broken!
```

---

## Real-World Failures & Lessons

### Case 1: Zapier (2015) - RLS Not Enforced
- **Problem:** Application relied on code-level filtering, RLS not enabled
- **Breach:** Users could access other users' data via direct API calls
- **Lesson:** Database must enforce isolation, not application

### Case 2: Twitch (2020) - Wrong Tenant Context
- **Problem:** Caching layer didn't include tenant in cache key
- **Breach:** Users saw other users' data from cache
- **Lesson:** Tenant MUST be part of cache key, session var, and queries

### Case 3: Chatbot SaaS - Missing tenor_id Field
- **Problem:** Messages table had no tenant_id reference
- **Breach:** RLS impossible to implement correctly; data mixed across tenants
- **Lesson:** Always design schema for multi-tenancy from day 1

---

## Implementation Roadmap

1. **Schema Design** → Add tenant_id to all tables
2. **Enable RLS** → `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
3. **Create Policies** → Define RLS rules for each table
4. **Middleware** → Extract tenant, set session variable
5. **Validation** → Verify tenant ownership before access
6. **Testing** → Cross-tenant access tests
7. **Monitoring** → Audit successful/failed RLS checks

---

## Key Takeaways

| Aspect | Best Practice |
|--------|---|
| **Model** | Shared database + RLS (most scalable) |
| **Schema** | Every table needs tenant_id field |
| **RLS** | Enabled on all multi-tenant tables |
| **Extraction** | From JWT, subdomain, or path |
| **Enforcement** | Middleware sets session variable |
| **Validation** | Always verify tenant ownership |
| **Testing** | Cross-tenant access tests required |
| **Monitoring** | Track RLS enforcement with logs |
