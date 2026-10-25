# Optimistic Locking - Theory & Deep Dive

## Core Concept: Version Check Before Update

**The Golden Rule:**
```
READ: Get record + version
     ↓
CLIENT: Modify locally (version stored)
     ↓  
WRITE: Send update + version to server
     ↓
SERVER: IF version matches → Apply update & increment version
       ELSE → Return 409 Conflict
```

## Lost Update Problem Illustrated

```
WITHOUT OPTIMISTIC LOCKING:

Stock: 100 (version ignored)

User A: Read stock    → 100
User B: Read stock    → 100
User A: Reduce by 5   → 95, Store 95
User B: Add 10        → 110, Store 110
User A: Write 95      → DB now shows 95
User B: Write 110     → DB now shows 110 (B's update lost!)

Expected: 100 - 5 + 10 = 105
Actual: 110 (User A's -5 lost!)


WITH OPTIMISTIC LOCKING:

Stock: 100, version: 1

User A: Read stock 100, version 1
User B: Read stock 100, version 1
User A: Wants to write 95, version 1 → CHECK: version 1 = 1 ✓
       → Allowed! version becomes 2
User B: Wants to write 110, version 1 → CHECK: version 1 ≠ 2 ✗
       → Conflict 409! Tell user to retry
       → User B refetches: stock 95, version 2
       → Recalculates: 95 + 10 = 105
       → Retries: write 105, version 2 ✓
       → version becomes 3

Result: 105 ✓ Correct!
```

## Implementation Strategy

**Simple 3-Step Process:**

1. **Client sends version with update**
   ```json
   PATCH /products/1 {
     "name": "Gaming Laptop",
     "currentVersion": 5
   }
   ```

2. **Server checks version**
   ```javascript
   IF db.product.version === request.currentVersion
     → Update allowed
   ELSE
     → Return 409
   ```

3. **Server increments version**
   ```javascript
   db.product.version = request.currentVersion + 1
   ```

## Performance

- **Conflict Rate:** <2% typical
- **Retry Cost:** Exponential backoff (100ms, 200ms, 400ms)
- **Scalability:** ∞ (no lock contention)
- **Read Performance:** Unchanged
- **Write Latency:** +0.1% (just one check)

## Compared to Pessimistic Locking

| Aspect | Optimistic | Pessimistic |
|--------|-----------|------------|
| Lock during read | ❌ No | ✅ Yes |
| Lock during write | ❌ No | ✅ Yes |
| Deadlocks | ✅ Impossible | ✗ Possible |
| Read performance | ✅ Fast | ⚠️ Slower |
| Write performance | ⚠️ Retry cost | ✅ Only commit |
| Distributed systems | ✅ Works | ❌ Hard |
| Best for | Read-heavy | Write-heavy |

---

**Complexity:** ⭐⭐⭐ Intermediate  
**Real-world Usage:** ★★★★☆ Common in modern apps

