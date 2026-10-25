# Supabase & PostgreSQL Security: Theory & Concepts

## 1. Relational Database Fundamentals

### ACID Properties
PostgreSQL guarantees ACID for data integrity:
- **Atomicity**: Transaction completes or rolls back entirely
- **Consistency**: Database moves from valid state to valid state
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed data survives system failures

### Row-Level Security (RLS)
RLS policies enforce data access at database level:
```sql
CREATE POLICY "Users see own records"
  ON documents
  FOR SELECT
  USING (auth.uid() = user_id);
```

This prevents SELECT * from returning other users' data, even with valid token.

### Indexes
Indexes speed up queries but slow down writes:
```sql
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- Query using index: 1ms (1000 vs 1M rows)
SELECT * FROM documents WHERE user_id = 'user-123';

-- Query without index: 100ms (must scan all rows)
SELECT * FROM documents WHERE created_at > '2024-01-01';
```

**Over-indexing risks**:
- Slower insert/update operations
- Higher storage usage
- Index fragmentation over time

## 2. Real-time Subscriptions

### WebSocket Architecture
Real-time uses WebSockets (persistent bidirectional connection):
```
Client connects → Server holds connection
Database change → Trigger fires → Webhook notification
Notification sent over WebSocket → Client receives in < 100ms
```

**Scaling challenges**:
- 1,000 concurrent subscriptions = 1,000 open connections
- Connection heartbeat every 30 seconds prevents disconnects
- Reconnection logic handles temporary network failures

### Subscription Security
**Vulnerable**: Subscribe to all database changes
```javascript
db.on('*', (payload) => {
  // Receives ALL changes from ALL users (security breach!)
});
```

**Secure**: Subscribe to specific table with RLS filtering
```javascript
db.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'documents',
    filter: `user_id=eq.${userId}` // Only my documents
  },
  (payload) => { /* my documents changed */ }
);
```

## 3. Storage & File Security

### Bucket Structure
Organize files by owner:
```
/user-123/profile.jpg
/user-123/documents/resume.pdf
/user-456/profile.jpg
```

Enforce in RLS:
```sql
CREATE POLICY "Users manage own files"
  ON storage.objects
  FOR ALL
  USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### File Validation
1. **Type validation** (MIME type)
```javascript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Invalid type');
```

2. **Size validation**
```javascript
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
if (file.size > MAX_SIZE) throw new Error('File too large');
```

3. **Content validation** (check file signature, not just extension)
```javascript
// File extension can be spoofed: virus.pdf.exe
// Validate actual file content by reading first bytes (magic number)
const fileSignature = file.slice(0, 4);
if (fileSignature === '\x89PNG') { /* Valid PNG */ }
```

## 4. Data Modeling

### Normalization vs Denormalization
**Normalized** (3NF):
```
users table: id, name, email
orders table: id, user_id, total
order_items table: id, order_id, product_id, quantity, price
```

Pros: No duplicate data, easier updates
Cons: Requires joins (slower queries)

**Denormalized**:
```
orders table: id, user_id, user_name, user_email, items: [{product, qty, price}]
```

Pros: Fast queries, no joins
Cons: Duplicate data, hard to update user email consistently

**Best practice**: Normalize for correctness, denormalize for performance (with caching)

### Foreign Keys & Referential Integrity
Foreign key prevents orphaned records:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);
```

`ON DELETE CASCADE` means: If user deleted, automatically delete their orders.

## 5. Backup & Disaster Recovery

### Backup Strategies
1. **Full backup**: Copy all data (slow, large storage)
2. **Incremental**: Copy only changes since last backup (fast)
3. **Transaction log backups**: Continuous archiving (highest granularity)

### Recovery Time Objective (RTO)
How fast can you recover after disaster?
- 1 hour RTO: Daily backup sufficient
- 15 minute RTO: Hourly backups required
- 1 minute RTO: Continuous replication needed

### Real-World: Accidental Data Deletion
**Scenario**: Developer runs wrong query, deletes 10,000 customer records

**Without backups**: Data gone forever → Lawsuits

**With backups**: 
1. Stop applications
2. Restore database from backup (5 minutes ago)
3. Lost 5 minutes of data, acceptable
4. Resume applications

## 6. Performance Optimization

### Query Optimization
1. **Use explain to understand query plan**:
   ```sql
   EXPLAIN SELECT * FROM documents WHERE user_id = '123';
   -- Shows if index is used
   ```

2. **Add indexes for frequent filters**:
   ```sql
   CREATE INDEX idx_docs_user ON documents(user_id);
   ```

3. **Avoid N+1 queries**:
   ```javascript
   // VULNERABLE - N+1: 1 query for users + 1 query per user
   const users = await db.query('SELECT * FROM users LIMIT 10');
   for (const user of users) {
     user.orders = await db.query('SELECT * FROM orders WHERE user_id = ?', [user.id]);
   }
   
   // SECURE - 1 query with join
   const users = await db.query(`
     SELECT u.*, json_agg(o.*) as orders
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     LIMIT 10
     GROUP BY u.id
   `);
   ```

## 7. Security Checklist

- [ ] RLS policies enforce user-scoped access
- [ ] Foreign keys prevent orphaned records
- [ ] Backups daily, tested quarterly
- [ ] Sensitive columns encrypted at app level
- [ ] Connection pooling configured for load
- [ ] Indexes created for frequent queries
- [ ] N+1 queries eliminated
- [ ] Slow query log monitored (> 1s queries)
- [ ] Query timeouts set (5s max)
- [ ] Audit logging for sensitive operations
- [ ] Read replicas for analytics (separate from production)
- [ ] Monitoring alerts for disk space, CPU, connections
- [ ] Connection limits prevent resource exhaustion
- [ ] IP whitelist for database access
