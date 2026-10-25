# Write-Through vs Write-Behind Caching

## The Cache Consistency Problem

When you write data, where does it go first? The cache or the database?

```
User updates their profile
    ↓
Which happens first?
├─ Write to cache, then database? (Write-Through)
├─ Write to database, then cache? (Write-Behind/Back)
└─ Write to both simultaneously? (Write-Around)
```

This order determines **consistency**, **reliability**, and **performance** tradeoffs.

## Write-Through Caching

Write to cache FIRST, then immediately to database. Wait for both to complete.

```javascript
// Write-Through Implementation
async function updateUser(userId, data) {
  try {
    // Step 1: Write to cache FIRST
    await cache.set(`user:${userId}`, JSON.stringify(data));
    
    // Step 2: Write to database
    const result = await db.update(`users`, userId, data);
    
    // Step 3: Return only after BOTH succeed
    return result;
  } catch (error) {
    // If database fails, cache is already written (problematic!)
    throw error;
  }
}
```

### Characteristics

**Consistency:** ✓ Cache and DB immediately in sync
**Reliability:** ✓ Data in database guaranteed
**Performance:** ✗ Slower (wait for both)
**Complexity:** ✓ Simple pattern

### Timeline

```
Time  Cache    Database    Response
T0    Write    -           (waiting)
T10   Done     Write       (waiting)
T50   Sync     Done        Success ✓

Total time: 50ms
```

### Pros

1. **Guaranteed consistency** - Cache never ahead of DB
2. **Data durability** - Always written to persistent storage
3. **Simple** - Easy to reason about
4. **Atomic** - Both succeed or both fail (ideally)
5. **Good for critical data** - Never lose important writes

### Cons

1. **Slower** - Wait for disk I/O (database)
2. **Increased latency** - User sees 50-100ms delay
3. **Both must succeed** - Single point of failure needs recovery
4. **Database bottleneck** - DB speed limits cache benefit

### When to Use

- Financial transactions (money, payments)
- Medical records (patient data)
- Legal documents (contracts)
- User credentials (passwords)
- Any data that **must never be lost**

### Example: Banking Application

```javascript
async function transferMoney(fromId, toId, amount) {
  // Write-Through ensures money isn't lost
  
  try {
    // Update cache first
    const fromBalance = await cache.get(`balance:${fromId}`);
    await cache.set(`balance:${fromId}`, fromBalance - amount);
    
    const toBalance = await cache.get(`balance:${toId}`);
    await cache.set(`balance:${toId}`, toBalance + amount);
    
    // Write to permanent database
    await db.transaction(async (trx) => {
      await trx('accounts').where('id', fromId).decrement('balance', amount);
      await trx('accounts').where('id', toId).increment('balance', amount);
    });
    
    return { success: true };
  } catch (error) {
    // If something fails, cache is inconsistent but DB will be taken as truth
    console.error('Transfer failed:', error);
    throw error;
  }
}
```

## Write-Behind (Write-Back) Caching

Write to cache FIRST (immediately), then database LATER (async in background).

```javascript
// Write-Behind Implementation
async function updateUser(userId, data) {
  // Step 1: Write to cache immediately (user gets immediate response)
  await cache.set(`user:${userId}`, JSON.stringify(data));
  
  // Step 2: Schedule database write for later
  queue.enqueue(async () => {
    await db.update(`users`, userId, data);
  });
  
  // Step 3: Return immediately to user (before database write)
  return { success: true };
}
```

### Characteristics

**Consistency:** ✗ Temporary cache-DB marity
**Reliability:** ✗ Cache is source of truth temporarily
**Performance:** ✓ Faster (return immediately)
**Complexity:** ✗ Complex (background processing)

### Timeline

```
Time  Cache    Database    Response    Queue
T0    Write    -           Success ✓   Enqueue
T2    -        -           -           Processing...
T50   Sync     Write       -           -
T100  -        Done        -           Complete
```

### Pros

1. **Faster** - Return immediately (< 5ms)
2. **Better user experience** - No perceived delay
3. **Reduces DB load** - Batches writes efficiently
4. **High throughput** - More requests/second
5. **Handles spikes** - Queue buffers traffic bursts

### Cons

1. **Data loss risk** - If cache crashes, unwritten data lost
2. **Inconsistency** - Temporary cache-DB mismatch
3. **Complex recovery** - Need retry logic and queues
4. **Replication lag** - Other servers see stale data initially
5. **Requires monitoring** - Queue health, callback failures

### When to Use

- Social media likes/reactions (non-critical counter)
- Visit counts (approximate metrics)
- User preference updates (not urgent)
- Analytics events (eventual consistency ok)
- Search index updates (can rebuild)
- Any data that's **eventually consistent ok**

### Example: Social Media Post Like Counter

```javascript
async function likePost(postId, userId) {
  // Like count can be approximate, doesn't need perfection
  
  // Step 1: Update cache immediately
  await cache.incr(`post:${postId}:likes`);
  
  // Step 2: Queue database update
  likeQueue.add({
    postId,
    userId,
    timestamp: Date.now()
  });
  
  // Return immediately (user sees like instantly)
  return { success: true, liked: true };
}

// Background worker processes likes periodically
async function processLikeQueue() {
  while (true) {
    const batch = await likeQueue.getNextBatch(100);  // Process 100 at a time
    
    if (batch.length === 0) {
      await sleep(1000);
      continue;
    }
    
    // Batch write to database (efficient)
    await db('post_likes').insert(batch.map(like => ({
      post_id: like.postId,
      user_id: like.userId,
      created_at: like.timestamp
    })));
    
    // Mark processed
    for (const like of batch) {
      await likeQueue.ack(like.id);
    }
  }
}
```

## Write-Around (Cache Only)

Don't cache writes at all, only cache reads.

```javascript
// Write-Around Strategy
async function updateUser(userId, data) {
  // Skip cache, write directly to database
  const result = await db.update(`users`, userId, data);
  
  // Invalidate cache (don't update it)
  await cache.del(`user:${userId}`);
  
  // Next read will fetch fresh from DB
  return result;
}
```

### When to Use

- Large bulk writes (don't need caching)
- Cache hits are important, updates are rare
- Data size makes caching expensive

## Comparison Table

| Aspect | Write-Through | Write-Behind | Write-Around |
|--------|---------------|-----------  |------------|
| Speed | Slow (50-100ms) | Fast (< 5ms) | Medium |
| Consistency | Immediate | Eventual | Eventual |
| Data Loss Risk | Low | High (if crash) | Low |
| Complexity | Simple | Complex | Simple |
| Best For | Critical | High-throughput | Bulk writes |
| Example | Banking | Likes/Analytics | Logs |

## Hybrid Approach: Best of Both Worlds

Many production systems use **Write-Through for critical data** and **Write-Behind for non-critical**:

```javascript
async function updateUser(userId, data) {
  // Critical data: Use Write-Through
  if (data.email || data.password) {
    await cache.set(`user:${userId}`, JSON.stringify(data));
    await db.update(`users`, userId, data);
  }
  
  // Non-critical: Use Write-Behind
  if (data.bio || data.preferences) {
    await cache.set(`user:${userId}`, JSON.stringify(data));
    updateQueue.add({ userId, data });
  }
}
```

## Real-World Architecture

```
User Request
    ↓
Application Layer
    ├─ Cache (Redis) - Fast, in-memory
    └─ Write Queue - Background processing
           ↓
    Database - Persistent, slow
           ↓
    Backup/Replication - Redundancy
```

## Monitoring Write-Behind Health

```javascript
// Track queue depth
const queueDepth = await likeQueue.length();
if (queueDepth > 10000) {
  alert('Like queue backing up!');
}

// Track failed items
const failed = await likeQueue.getFailedItems();
if (failed.length > 100) {
  alert('Queue has many failures!');
}

// Track lag (how far behind database is)
const maxQueuedTime = await likeQueue.getOldestItemAge();
if (maxQueuedTime > 30000) {  // 30 seconds
  alert('Database writes falling behind!');
}
```

## Decision Flow

```
Question: Is this data critical?
│
├─ YES, must never lose (money) → Write-Through
├─ NO, approximate is ok (likes) → Write-Behind
└─ Large bulk operation → Write-Around
```

**Choose wisely! Performance gains aren't worth lost money or broken trust.**
