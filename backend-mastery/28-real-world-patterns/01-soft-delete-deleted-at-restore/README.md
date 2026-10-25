# Soft Delete (Deleted-At) & Restore Pattern

## Overview

The **Soft Delete** pattern uses a `deleted_at` timestamp to mark records as deleted without physically removing them from the database. This allows for data recovery, audit trails, and compliance with data retention regulations.

## 🎯 Problem Statement

**Traditional Hard Delete Issues:**
- ❌ Data loss without recovery option
- ❌ Cannot perform undo operations
- ❌ Audit trails become incomplete
- ❌ Violates compliance requirements (GDPR, CCPA, HIPAA)
- ❌ Referential integrity problems with related records

## ✅ Solution: Soft Delete

Instead of removing data, mark it as deleted with a timestamp:

```sql
UPDATE users SET deleted_at = NOW() WHERE id = 1;
```

### Benefits:
- ✅ **Data Recovery**: Restore deleted records anytime
- ✅ **Audit Trails**: Complete history of changes
- ✅ **Compliance**: Meet retention requirements
- ✅ **Undo Operations**: User-friendly recovery
- ✅ **Referential Integrity**: No orphaned records

## 🏗️ Implementation

### Column Addition

```sql
-- Add deleted_at column to users table
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;

-- Create index for query performance
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

### Query Patterns

**Always filter out deleted records:**

```javascript
// ✅ CORRECT: Exclude deleted records
const activeUsers = users.filter(u => !u.deleted_at);

// ❌ WRONG: Includes deleted records
const allUsers = users; // DON'T DO THIS
```

## 📋 File Structure

```
01-soft-delete-deleted-at-restore/
├── controller.js          # Business logic for soft delete
├── middleware.js          # Validation & error handling
├── routes.js              # Express routes
├── schema.js              # Joi validation schemas
├── App.jsx                # React testing component
├── README.md              # This file
├── theory.md              # Deep-dive technical explanation
├── setup.md               # Installation & examples
├── checklist.md           # Implementation checklist
└── .env.example           # Environment variables
```

## 🎬 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Backend

```bash
npm start
# Runs on http://localhost:4001
```

### 3. Test the Pattern

Use the React UI or curl commands:

```bash
# Get active users
curl http://localhost:4001/api/secure/users

# Create user
curl -X POST http://localhost:4001/api/secure/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","role":"user"}'

# Soft delete user
curl -X DELETE http://localhost:4001/api/secure/users/1

# Restore user
curl -X POST http://localhost:4001/api/secure/users/1/restore
```

## 🔄 API Endpoints

### Secure Endpoints (Recommended)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/secure/users` | List active users only |
| GET | `/secure/users/:id` | Get single active user |
| POST | `/secure/users` | Create new user |
| PATCH | `/secure/users/:id` | Update user |
| DELETE | `/secure/users/:id` | Soft delete user |
| POST | `/secure/users/:id/restore` | Restore deleted user |
| GET | `/secure/users/:id/audit-trail` | Get delete history |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/deleted-users` | List all deleted users |

### Vulnerable Endpoints (For Learning)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vulnerable/users` | List ALL users (including deleted) |
| GET | `/vulnerable/users/:id` | Get user without delete check |
| DELETE | `/vulnerable/users/:id/hard-delete` | Permanently delete |

## 💡 Real-World Examples

### E-commerce Platform
```javascript
// User requested account deletion
user.deleted_at = new Date();

// 30 days later, auto-purge permanently
if (daysElapsed > 30) {
  delete users[userId];
}
```

### Social Media
```javascript
// User deletes their post
post.deleted_at = new Date();

// Show in audit logs but not in feed
const visiblePosts = posts.filter(p => !p.deleted_at);
```

### GDPR Compliance
```javascript
// 90-day retention requirement
const oldDeletedUsers = users.filter(u => 
  u.deleted_at && 
  Date.now() - u.deleted_at > 90 * 24 * 60 * 60 * 1000
);

// Permanently remove after retention period
oldDeletedUsers.forEach(u => delete users[u.id]);
```

## ⚠️ Common Mistakes

### ❌ Mistake 1: Forgetting to Filter Deleted Records

```javascript
// BAD: Returns deleted users
const users = await User.find();

// GOOD: Excludes deleted users
const activeUsers = await User.find({ deleted_at: null });
```

### ❌ Mistake 2: Hard Deleting Instead of Soft Deleting

```javascript
// BAD: Permanent removal
await User.destroy({ where: { id: userId } });

// GOOD: Soft delete
await User.update({ deleted_at: new Date() }, { where: { id: userId } });
```

### ❌ Mistake 3: Not Indexing deleted_at Column

```javascript
// BAD: Slow queries on large tables
const active = await User.find({ deleted_at: null });

// GOOD: Add index
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

## 🛡️ Security Considerations

1. **Query Filtering**: Always exclude deleted records
2. **Permissions**: Restrict restore access to admins
3. **Audit Logging**: Log who deleted and restored records
4. **GDPR Compliance**: Document retention policies
5. **Backup Strategy**: Regular backups for disaster recovery

## 📊 Data Schema

```javascript
{
  id: 1,
  name: "Alice Johnson",
  email: "alice@test.com",
  role: "admin",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-02-20T14:30:00Z",
  deleted_at: null,  // null = active, timestamp = deleted
  restored_at: null  // null = never restored, timestamp = restored
}
```

## 🔗 Related Patterns

- **Hard Delete** (Alternative): Permanent removal (not recommended)
- **Archive Pattern**: Move old data to archive tables
- **Soft Delete with TTL**: Auto-purge after expiration
- **Audit Logging**: Complete change history

## 📚 Best Practices

✅ Always filter deleted records in queries  
✅ Add index on deleted_at column  
✅ Document deletion policies  
✅ Implement retention periods  
✅ Log all delete/restore operations  
✅ Test recovery procedures regularly  
✅ Use soft delete by default  
✅ Only hard delete after retention period  

## ✓ Checklist

- [ ] Add `deleted_at` column to tables
- [ ] Add index on `deleted_at`
- [ ] Update all SELECT queries to filter deleted
- [ ] Implement soft delete endpoint
- [ ] Implement restore endpoint
- [ ] Add audit logging
- [ ] Document retention policy
- [ ] Test recovery procedures
- [ ] Update API documentation
- [ ] Train team on pattern

## 🚀 Running the Demo

```bash
# Start the application
npm start

# Backend: http://localhost:4001
# Frontend UI: http://localhost:3001

# Test endpoints
npm run test
```

---

**Status:** Production Ready ✅  
**Complexity:** Beginner ⭐⭐  
**Learning Time:** 15-30 minutes

## How it works

## Key concepts

## Common mistakes
