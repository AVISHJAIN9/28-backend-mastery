# Soft Delete (Deleted-At) Pattern - Theory & Deep Dive

## Table of Contents
1. [Concept Overview](#concept-overview)
2. [Database Design](#database-design)
3. [Implementation Strategies](#implementation-strategies)
4. [Query Patterns](#query-patterns)
5. [Compliance & Legal](#compliance--legal)
6. [Performance Implications](#performance-implications)
7. [Architecture Patterns](#architecture-patterns)
8. [Comparison with Alternatives](#comparison-with-alternatives)
9. [Advanced Scenarios](#advanced-scenarios)

---

## Concept Overview

### What is Soft Delete?

Soft delete is a data management pattern where records are marked as deleted with a timestamp instead of being physically removed from the database. This preserves data integrity, enables recovery, and maintains audit trails.

### Core Principle

```
Hard Delete: DELETE FROM users WHERE id = 1
                        ↓
Soft Delete: UPDATE users SET deleted_at = NOW() WHERE id = 1
```

### Why NOT Hard Delete?

**Hard Delete Problems:**

| Issue | Impact | Solution |
|-------|--------|----------|
| No Recovery | Data permanently lost | Soft delete preserves data |
| Broken References | Orphaned records | Maintains referential integrity |
| Audit Trail Loss | Cannot track what happened | Complete history preserved |
| Compliance Violation | GDPR/CCPA violations | Enables retention policies |
| Undo Impossible | Users frustrated | Restore functionality available |

---

## Database Design

### Schema Design

**Basic Implementation:**

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,  -- NULL = active, timestamp = deleted
  restored_at TIMESTAMP NULL  -- For audit tracking
);
```

### Index Strategy

**Critical Indexes:**

```sql
-- Index for filtering active records
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Composite index for common queries
CREATE INDEX idx_users_active_email ON users(deleted_at, email);

-- For deleted user queries
CREATE INDEX idx_users_deleted_date ON users(deleted_at, created_at);
```

### Why These Indexes?

1. **idx_users_deleted_at**: WHERE deleted_at IS NULL queries
2. **idx_users_active_email**: Active user lookups by email
3. **idx_users_deleted_date**: Archive/retention queries

---

## Implementation Strategies

### Strategy 1: Simple Null-Check

**Approach:** Flag as boolean or timestamp

```javascript
// Mark as deleted
user.deleted_at = new Date();

// Check if active
if (!user.deleted_at) {
  // User is active
}

// Filter active
const activeUsers = users.filter(u => !u.deleted_at);
```

**Pros:**
- ✅ Simple implementation
- ✅ Easy to understand
- ✅ Minimal overhead

**Cons:**
- ❌ No timestamp info
- ❌ Hard to know deletion time
- ❌ Difficult for retention policies

### Strategy 2: Timestamped Deletion

**Approach:** Store exact deletion time

```javascript
// Mark with timestamp
user.deleted_at = new Date('2024-02-20T10:30:00Z');

// Find users deleted on specific date
const usersDeletedToday = users.filter(u => 
  u.deleted_at && 
  u.deleted_at.toDateString() === new Date().toDateString()
);

// Find users deleted more than 90 days ago
const oldDeleted = users.filter(u => 
  u.deleted_at && 
  Date.now() - u.deleted_at > 90 * 24 * 60 * 60 * 1000
);
```

**Pros:**
- ✅ Know exact deletion time
- ✅ Enable retention policies
- ✅ Compliance tracking

**Cons:**
- ❌ Extra storage
- ❌ Slightly more complex queries

### Strategy 3: Soft Delete with Restore History

**Approach:** Track deletions AND restores

```javascript
const user = {
  id: 1,
  name: "John",
  deleted_at: new Date('2024-02-20T10:30:00Z'),
  restored_at: new Date('2024-02-21T14:15:00Z'),
  deletion_count: 2,  // Number of times deleted
  is_active: true     // Denormalized for speed
};

// Query active records
db.users.find({ is_active: true });
```

**Pros:**
- ✅ Full audit history
- ✅ Track repeated deletions
- ✅ Quick active checks

**Cons:**
- ❌ More columns
- ❌ Synchronization overhead

---

## Query Patterns

### Pattern 1: Always Filter Active Records

**The Golden Rule:**
```javascript
// ✅ ALWAYS do this
const activeUsers = await User.find({ deleted_at: null });

// ❌ NEVER forget this filter
const allUsers = await User.find(); // DON'T DO THIS
```

### Pattern 2: Use Views for Simplicity

```sql
-- Create view for active records
CREATE VIEW v_active_users AS
SELECT * FROM users
WHERE deleted_at IS NULL;

-- Use in queries
SELECT * FROM v_active_users WHERE email = 'john@test.com';
```

**Benefits:**
- ✅ Centralized filtering logic
- ✅ Developers can't forget
- ✅ Single source of truth

### Pattern 3: Scope Methods in ORM

```javascript
// Sequelize example
class User extends Model {}

User.addScope('active', {
  where: { deleted_at: null }
});

User.addScope('deleted', {
  where: { deleted_at: { [Op.ne]: null } }
});

// Usage
await User.scope('active').findAll();  // Active users
await User.scope('deleted').findAll(); // Deleted users
```

### Pattern 4: Query Builder Pattern

```javascript
class UserQuery {
  constructor(query = {}) {
    this.query = { ...query };
  }

  active() {
    return new UserQuery({ ...this.query, deleted_at: null });
  }

  deleted() {
    return new UserQuery({ ...this.query, deleted_at: { $ne: null } });
  }

  email(email) {
    return new UserQuery({ ...this.query, email });
  }

  execute() {
    return users.filter(u => {
      return Object.entries(this.query).every(([key, val]) => {
        if (val === null) return u[key] === null;
        if (val.$ne !== undefined) return u[key] !== val.$ne;
        return u[key] === val;
      });
    });
  }
}

// Usage
new UserQuery()
  .active()
  .email('john@test.com')
  .execute();
```

---

## Compliance & Legal

### GDPR Requirements

**Soft Delete Enables:**
- ✅ Right to erasure (delete)
- ✅ Data retention policies
- ✅ Audit trails (Article 32)
- ✅ Data portability

**Implementation:**
```sql
-- 90-day retention policy for EU
SELECT id FROM users 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '90 days';

-- Export deleted user data (GDPR right to know)
SELECT * FROM users WHERE id = ? AND deleted_at IS NOT NULL;

-- Permanent deletion after retention
DELETE FROM users 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '90 days';
```

### CCPA Requirements (California)

- ✅ Consumer right to delete
- ✅ Opt-out of data sale
- ✅ Maintain deletion request records
- ✅ Honor deletion within 45 days

### HIPAA Requirements (Healthcare)

- ✅ Audit trail of all changes
- ✅ Maintain deleted data
- ✅ Track restore operations
- ✅ Encryption of deleted data

---

## Performance Implications

### Index Impact

**Without Index:**
```sql
SELECT * FROM users WHERE deleted_at IS NULL;
-- Time: O(n) = scan entire table
-- Problem: Slow on 1M rows
```

**With Index:**
```sql
SELECT * FROM users WHERE deleted_at IS NULL;
-- Time: O(log n) = index lookup
-- Result: 100x faster
```

### Query Optimization

**Bad Query:**
```sql
SELECT * FROM users 
WHERE deleted_at IS NULL 
AND YEAR(created_at) = 2024;  -- Index can't be used
```

**Good Query:**
```sql
SELECT * FROM users 
WHERE deleted_at IS NULL 
AND created_at >= '2024-01-01';  -- Index can be used
```

### Storage Overhead

**Comparison:**

| Method | Space | Pros | Cons |
|--------|-------|------|------|
| Hard Delete | Minimal | Smallest tables | No recovery |
| Soft Delete | +1% (timestamp) | Recovery possible | Larger tables |
| Archive Table | Minimal | Separate storage | Complex queries |
| Versioning | +2-3% | Full history | Very complex |

---

## Architecture Patterns

### Pattern 1: Layered Filtering

```
                User Request
                    ↓
      ┌─────────────────────────┐
      │  Application Layer      │
      │  (Auto-filter logic)    │
      └─────────────────────────┘
                    ↓
      ┌─────────────────────────┐
      │  ORM/Query Builder      │
      │  (Scope/Filter)         │
      └─────────────────────────┘
                    ↓
      ┌─────────────────────────┐
      │  Database Layer         │
      │  (Index optimization)   │
      └─────────────────────────┘
                    ↓
            Active Records Only
```

### Pattern 2: Event-Driven Cleanup

```javascript
// When user is soft-deleted
EventBus.emit('user:soft-deleted', userId);

// Listen for old deletions
setInterval(() => {
  const retention = 90 * 24 * 60 * 60 * 1000;
  const oldDeleted = users.filter(u =>
    u.deleted_at && Date.now() - u.deleted_at > retention
  );
  
  // Hard delete after retention
  oldDeleted.forEach(u => delete users[u.id]);
  EventBus.emit('users:permanently-deleted', oldDeleted);
}, 24 * 60 * 60 * 1000);
```

### Pattern 3: Cascading Soft Deletes

```javascript
// When user is deleted, soft-delete their data
async function cascadeSoftDelete(userId) {
  await User.update(
    { deleted_at: new Date() },
    { where: { id: userId } }
  );
  
  // Cascade to related data
  await Post.update(
    { deleted_at: new Date() },
    { where: { user_id: userId } }
  );
  
  await Comment.update(
    { deleted_at: new Date() },
    { where: { user_id: userId } }
  );
}
```

---

## Comparison with Alternatives

### Hard Delete

```javascript
// Hard Delete
DELETE FROM users WHERE id = 1;
```

| Aspect | Soft Delete | Hard Delete |
|--------|------------|------------|
| Recovery | ✅ Always possible | ❌ Impossible |
| Compliance | ✅ GDPR friendly | ⚠️ Tricky |
| Audit Trail | ✅ Complete | ❌ Lost |
| Referential Integrity | ✅ No orphans | ❌ Orphaned records |
| Performance | ⚠️ Slight index cost | ✅ Slightly faster |
| Space | ⚠️ More storage | ✅ Minimal |

### Archive Pattern

```sql
-- Archive old records
INSERT INTO users_archive SELECT * FROM users WHERE year < 2023;
DELETE FROM users WHERE year < 2023;
```

| Aspect | Soft Delete | Archive |
|--------|------------|---------|
| Query Speed | ⚠️ Union queries slow | ✅ Small tables fast |
| Recovery | ✅ Easy | ⚠️ Complex |
| Compliance | ✅ Native | ✅ Good |
| Joins | ✅ Simple | ❌ Very complex |

### Versioning Pattern

```sql
-- Every change creates new version
CREATE TABLE user_versions (
  id INT,
  version INT,
  data JSON,
  changed_at TIMESTAMP
);
```

| Aspect | Soft Delete | Versioning |
|--------|------------|------------|
| History | ✅ Deletion record | ✅ Full version tree |
| Recovery | ✅ Easy | ✅ To any point |
| Complexity | ✅ Simple | ❌ Complex |
| Space | ✅ Minimal | ❌ Large |

---

## Advanced Scenarios

### Scenario 1: Temporary Soft Delete

```javascript
// Soft delete that auto-restores
async function tempSoftDelete(userId, hoursDuration = 24) {
  await User.update(
    { deleted_at: new Date() },
    { where: { id: userId } }
  );
  
  // Auto-restore after duration
  setTimeout(() => {
    User.update(
      { deleted_at: null },
      { where: { id: userId } }
    );
  }, hoursDuration * 60 * 60 * 1000);
}
```

### Scenario 2: Soft Delete with Reason

```javascript
const user = {
  id: 1,
  name: "John",
  deleted_at: new Date(),
  deletion_reason: "USER_REQUESTED",  // USER_REQUESTED, COMPLIANCE, ABUSE
  deletion_notes: "User requested account deletion"
};

// Query users deleted for specific reasons
const abuseUsers = users.filter(u =>
  u.deleted_at && u.deletion_reason === "ABUSE"
);
```

### Scenario 3: Soft Delete with Parental Consent (COPPA)

```javascript
// Additional fields for child accounts
const childUser = {
  id: 1,
  name: "Young User",
  age: 12,
  deleted_at: null,
  parent_consent_deleted_at: new Date(),  // Parent deleted child account
  deletion_type: "PARENTAL_REQUEST"
};
```

### Scenario 4: Immediate Logical Delete, Delayed Physical Delete

```javascript
const deletionStages = {
  ACTIVE: 0,
  SOFT_DELETED: 1,      // Immediately hidden from users
  PENDING_PURGE: 2,     // In 30-day retention
  HARD_DELETED: 3       // Permanently removed
};

async function processDeletes() {
  // Stage 1: Soft delete (immediate)
  user.status = SOFT_DELETED;
  user.deleted_at = new Date();
  
  // Stage 2: Wait retention period
  setTimeout(() => {
    user.status = PENDING_PURGE;
  }, 30 * 24 * 60 * 60 * 1000);
  
  // Stage 3: Hard delete
  setTimeout(() => {
    user.status = HARD_DELETED;
    // Physically remove from database
  }, 35 * 24 * 60 * 60 * 1000);
}
```

---

## Summary

**Key Takeaways:**

1. ✅ **Use Soft Delete by Default**: More benefits than costs
2. ✅ **Always Filter Active Records**: The golden rule
3. ✅ **Add Proper Indexes**: Performance is critical
4. ✅ **Implement Retention Policies**: Compliance requirement
5. ✅ **Log All Operations**: Audit trails
6. ✅ **Test Recovery**: Regular drills

**When to Use Soft Delete:**
- User accounts (for recovery)
- Financial records (for compliance)
- Content systems (for undo)
- Enterprise applications (for audits)

**When Hard Delete is OK:**
- Temporary/session data
- Analytics data
- Test/dev data
- After retention period expires

---

**Complexity:** ⭐⭐ (Beginner to Intermediate)  
**Real-world Usage:** ★★★★★ (Extremely Common)

