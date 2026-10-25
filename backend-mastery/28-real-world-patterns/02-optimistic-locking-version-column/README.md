# Optimistic Locking (Version Column) Pattern

## Overview

**Optimistic Locking** is a concurrency control mechanism that assumes conflicts are rare and handles them when they occur. Instead of locking resources, each record has a version number that increments on updates. When a client tries to update a record, the server checks if the version matches; if not, a conflict error (409) is returned.

## 🎯 Problem Statement

**Concurrent Update Issues (Lost Update Problem):**

```
Time  | User A              | User B              | Database
------|---------------------|---------------------|----------
T1    | Read Product (v1)   | Read Product (v1)   | Product v1
T2    | Update Name to "X"  |                     |
T3    |                     | Update Price to $50 |
T4    | Write (v1+1 = v2)   |                     | Product v2 (Price NOT updated!)
T5    |                     | Write (v1+1 = v2)   | Product v2 (Name reverted!)
      | ❌ Lost Update!     | ❌ Lost Update!     |
```

### Real-World Example:
- **Inventory System**: Two admins both read stock = 100
  - Admin A updates comment field
  - Admin B updates quantity to 50
  - Admin A's write overwrites B's change → wrong inventory!

## ✅ Solution: Optimistic Locking

```javascript
// Client sends current version
PATCH /products/1
{
  "name": "Updated Name",
  "currentVersion": 3  // Version when client read it
}

// Server checks:
// IF db.product.version === 3
//    → Success: db.product.version = 4, apply update
// ELSE
//    → Conflict (409): Tell client to fetch latest and retry
```

### Benefits:
- ✅ **No Blocking**: Read-heavy operations never block
- ✅ **Scalable**: Works across distributed systems
- ✅ **Simple**: Just add a version column
- ✅ **Race-Condition Safe**: Prevents lost updates
- ✅ **Concurrent Reads**: Multiple readers, safe writes

## 🏗️ Implementation

### Column Addition

```sql
-- Add version column
ALTER TABLE products ADD COLUMN version INT DEFAULT 1;

-- Index for easy filtering
CREATE INDEX idx_products_version ON products(version);
```

### Update Logic

```javascript
async function updateProductSecure(req, res) {
  const { productId } = req.params;
  const { name, price, currentVersion } = req.body;
  
  const product = await db.products.findById(productId);
  
  // Check version
  if (product.version !== currentVersion) {
    return res.status(409).json({
      error: 'Version conflict',
      latestVersion: product.version,
      current: product
    });
  }
  
  // Update and increment version
  await db.products.update(
    { id: productId },
    { name, price, version: currentVersion + 1 }
  );
  
  res.json({ success: true });
}
```

## 📋 File Structure

```
02-optimistic-locking-version-column/
├── controller.js          # Optimistic locking logic
├── middleware.js          # Validation middleware
├── routes.js              # REST endpoints
├── schema.js              # Joi schemas
├── App.jsx                # React testing UI
├── README.md              # This file
├── theory.md              # Technical deep-dive
├── setup.md               # Installation guide
├── checklist.md           # Implementation checklist
└── .env.example           # Configuration
```

## 🎬 Quick Start

```bash
# Install dependencies
npm install

# Start backend server
npm start
# Runs on http://localhost:4001

# Test endpoints
curl http://localhost:4001/api/secure/products
```

## 🔄 API Endpoints

### Secure Endpoints (with optimistic locking)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/secure/products` | List all products |
| GET | `/secure/products/:id` | Get single product |
| POST | `/secure/products` | Create product |
| PATCH | `/secure/products/:id` | Update with version check |
| GET | `/secure/products/:id/history` | Get version history |
| POST | `/secure/products/:id/retry-update` | Retry with backoff |

### Vulnerable Endpoint (for comparison)

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/vulnerable/products/:id` | Update WITHOUT version check |

## 💡 Real-World Examples

### E-commerce Inventory

```javascript
// Product: MacBook, Stock: 100, Version: 5

// Admin1: Reduce stock to 95 (sells 5)
PATCH /products/1
{
  "stock": 95,
  "currentVersion": 5
}
// Success: version becomes 6

// Admin2: (received 10 more, wants to add)
PATCH /products/1
{
  "stock": 110,  // Thinks it's still 100 + 10
  "currentVersion": 5  // Stale!
}
// ERROR 409: Version mismatch
// Admin2 refetches → sees version 6, stock 95
// Adds 10 to 95 → correctly updates to 105
```

### Collaborative Editing (Google Docs)

```javascript
// Doc: "Hello World", Version: 45

// User1: Changes to "Hello There"  (v45 → v46)
// User2: Tries to change to "Goodbye World" (v45 → v46)
// → Conflict! Server tells User2 to fetch latest
// → User2 merges changes properly
```

### Banking (Account Balance)

```javascript
// Account: Balance $1000, Version: 100

// Transaction1: Deposit $100  (should become $1100)
PATCH /account/1
{
  "balance": 1100,
  "currentVersion": 100
}
// Success: version → 101

// Transaction2: Withdrawal $200  (also read $1000)
PATCH /account/1
{
  "balance": 800,  // $1000 - $200
  "currentVersion": 100  // Stale!
}
// CONFLICT! Tells Transaction2:
// "Latest balance is $1100 (v101)"
// Transaction2 retries: $1100 - $200 = $900 ✓
```

## ⚠️ Common Mistakes

### ❌ Mistake 1: Client Doesn't Send Version

```javascript
// BAD
const response = await fetch(`/api/products/${id}`, {
  method: 'PATCH',
  body: JSON.stringify({ name: 'New Name' })
  // No currentVersion!
});

// GOOD
const product = await fetch(`/api/products/${id}`).then(r => r.json());
const response = await fetch(`/api/products/${id}`, {
  method: 'PATCH',
  body: JSON.stringify({ 
    name: 'New Name',
    currentVersion: product.version  // Always send!
  })
});
```

### ❌ Mistake 2: No Retry Logic

```javascript
// BAD: Just give up
if (response.status === 409) {
  alert('Update failed');  // User angry!
}

// GOOD: Retry automatically
if (response.status === 409) {
  const latest = await fetch(`/api/products/${id}`).then(r => r.json());
  const retry = await fetch(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ 
      name: formData.name,
      currentVersion: latest.version  // Use latest!
    })
  });
}
```

### ❌ Mistake 3: Version Column on Wrong Table

```javascript
// BAD: Only on some tables
CREATE TABLE products (version INT);  // ✓
CREATE TABLE orders (status VARCHAR);  // ✗ No version!

// GOOD: Consistent approach
CREATE TABLE products (version INT);  // ✓
CREATE TABLE orders (version INT);    // ✓
CREATE TABLE users (version INT);     // ✓
```

## 🛡️ Security Considerations

1. **Never Trust Client Version**: Always verify with server
2. **No Privilege Escalation**: Version check for data integrity, not access control
3. **Log Conflicts**: Track conflict patterns for debugging
4. **Timeout Retries**: Don't retry forever, eventually fail

```javascript
// Secure: Always verify
if (dbVersion !== clientVersion) {
  log.warn('Version mismatch detected');
  return res.status(409).json({ error: 'Conflict' });
}

// Insecure: Trusting client
if (clientVersion > 0) {  // WRONG!
  // Still update
}
```

## 📊 Data Schema

```javascript
{
  id: 1,
  name: "Laptop",
  price: 999.99,
  description: "Gaming laptop",
  version: 5,           // Increment on updates
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-03-20T15:30:00Z",
  updated_by: "admin"
}
```

## 🔗 Related Patterns

- **Pessimistic Locking**: Lock resource, no conflicts (but slower)
- **MVCC**: Multi-Version Concurrency Control (complex databases)
- **CAS Operations**: Compare-and-swap primitives
- **Event Sourcing**: Append-only log of changes

## 📚 Best Practices

✅ Always fetch latest before updating  
✅ Send version with every update  
✅ Return 409 on conflict  
✅ Implement retry logic  
✅ Log conflict metrics  
✅ Use exponential backoff for retries  
✅ Add index on version column  
✅ Document conflict resolution strategy  

## ✓ Checklist

- [ ] Add `version` column to tables
- [ ] Increment version on updates
- [ ] Check version before updating
- [ ] Return 409 on conflict
- [ ] Implement client-side retry
- [ ] Add logging for conflicts
- [ ] Document for team
- [ ] Test concurrent scenarios
- [ ] Monitor conflict rate
- [ ] Optimize for your workload

## 🚀 Getting Started

```bash
# Start the application
npm start

# Backend: http://localhost:4001
# Test endpoints

# Create product
curl -X POST http://localhost:4001/api/secure/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Monitor","price":299.99}'

# Get product (note version)
curl http://localhost:4001/api/secure/products/1

# Update with version
curl -X PATCH http://localhost:4001/api/secure/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"4K Monitor","currentVersion":1}'

# Try with wrong version (see 409 conflict)
curl -X PATCH http://localhost:4001/api/secure/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Wrong","currentVersion":1}'
```

---

**Status:** Production Ready ✅  
**Complexity:** Intermediate ⭐⭐⭐  
**Learning Time:** 30-45 minutes


## How it works

## Key concepts

## Common mistakes
