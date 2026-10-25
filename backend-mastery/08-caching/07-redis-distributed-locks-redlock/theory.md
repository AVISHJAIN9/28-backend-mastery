# Redis Distributed Locks & Redlock Algorithm

## The Problem: Race Conditions in Production

In single-threaded environments, locks are simple. In distributed systems, they're complex.

```
Distributed System: Multiple servers, one Redis
    Server A              Server B
    
    read():               read():
    count = 0             count = 0
         ↓                    ↓
    process()            process()
         ↓                    ↓
    write(1)             write(1)  ← Same value!
    
    Expected: 2, Actual: 1 ✗
```

Without locks, concurrent operations corrupt data. **Distributed locks prevent this.**

## Simple Lock Implementation

```javascript
// WRONG Way - Not atomic
async function badLock(key) {
  const exists = await redis.get(key);
  if (!exists) {
    await redis.set(key, 'locked');  // ✗ Gap between check and set!
    return true;
  }
  return false;
}

// CORRECT Way - Atomic
async function goodLock(key, ttl = 30) {
  // SET only if key doesn't exist (NX = Not eXists)
  const result = await redis.set(
    key,
    'lockvalue',
    'EX', ttl,      // Expire after ttl seconds
    'NX'            // Only if not exists
  );
  return result === 'OK';  // true if locked, false if already locked
}
```

### Simple Lock Pattern

```javascript
const lockKey = `lock:transfer:${fromId}`;
const acquired = await redis.set(lockKey, `${Date.now()}`, 'EX', 10, 'NX');

if (!acquired) {
  return res.status(409).json({ error: 'Another transfer in progress' });
}

try {
  // Critical section - only one server can execute
  await processTransfer(fromId, toId, amount);
} finally {
  // Release lock
  await redis.del(lockKey);
}
```

### Pros & Cons of Simple Locks

**Pros:**
- Simple to implement
- Works for basic use cases
- Fast (single Redis call)

**Cons:**
- No protection if lock holder crashes
- Lock can hang forever (stuck transaction)
- Single server failure loses lock
- No protection against clock skew

## Redlock Algorithm (Multi-Server)

Redlock (by Redis creator Salvatore Sanfilippo) acquires locks from **multiple Redis instances** for fault tolerance.

### How Redlock Works

```javascript
const Redis = require('redis').RedisClient;

class Redlock {
  constructor(redisClients) {
    this.clients = redisClients;  // [redis1, redis2, redis3, ...]
    this.quorumSize = Math.floor(redisClients.length / 2) + 1;
  }

  async lock(key, ttl = 30000) {
    const lockValue = Date.now().toString();
    const startTime = Date.now();
    let lockedCount = 0;

    // Try to lock on ALL servers
    for (let client of this.clients) {
      try {
        const result = await client.set(
          key,
          lockValue,
          'PX', ttl,  // Milliseconds
          'NX'
        );
        if (result === 'OK') {
          lockedCount++;
        }
      } catch (err) {
        // Server down or timeout, continue
      }
    }

    const elapsed = Date.now() - startTime;

    // Success: Locked on MAJORITY of servers
    if (lockedCount >= this.quorumSize && elapsed < ttl) {
      return {
        resource: key,
        value: lockValue,
        expireAt: startTime + ttl
      };
    }

    // Failed: Unlock on servers where we succeeded
    await this.unlock(key, lockValue);
    return null;
  }

  async unlock(key, lockValue) {
    // Only delete if it matches OUR lockValue (Lua script ensures atomicity)
    const luaScript = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    `;

    for (let client of this.clients) {
      try {
        await client.eval(luaScript, 1, key, lockValue);
      } catch (err) {
        // Continue even if some servers fail
      }
    }
  }
}
```

### Redlock Lease Renewal

For long operations, renew the lock before it expires:

```javascript
async function longRunningTask(key) {
  const lock = await redlock.lock(key, 30000);  // 30 sec TTL
  
  if (!lock) throw new Error('Could not acquire lock');

  try {
    const task = setInterval(async () => {
      // Renew lock every 10 seconds
      lock.expireAt = Date.now() + 30000;
      // Server holds lock, so renewal is fast
    }, 10000);

    // Do long work
    await processSlowTask();

    clearInterval(task);
  } finally {
    await redlock.unlock(lock.resource, lock.value);
  }
}
```

## Scenarios & Solutions

### Scenario 1: Single Redis Server (Simple Lock)

```javascript
async function updateUserProfile(userId, data) {
  const lockKey = `profile:${userId}:lock`;
  
  // Try to acquire lock
  const acquired = await redis.set(lockKey, 'locked', 'EX', 30, 'NX');
  if (!acquired) {
    return res.status(409).json({ error: 'Profile being updated' });
  }

  try {
    const profile = await db.getProfile(userId);
    profile.name = data.name;
    await db.saveProfile(userId, profile);
    await redis.del(`profile:${userId}`);  // Invalidate cache
  } finally {
    await redis.del(lockKey);  // Always release lock
  }
}
```

### Scenario 2: Multiple Redis (Redlock)

```javascript
const redlock = new Redlock([redis1, redis2, redis3]);

async function inventoryUpdate(productId, quantity) {
  const lock = await redlock.lock(`inventory:${productId}`, 5000);
  
  if (!lock) {
    return res.status(409).json({ error: 'Inventory locked' });
  }

  try {
    const current = await getInventory(productId);
    
    if (current + quantity < 0) {
      throw new Error('Insufficient inventory');
    }
    
    await updateInventory(productId, current + quantity);
  } finally {
    await redlock.unlock(lock.resource, lock.value);
  }
}
```

### Scenario 3: Lock Contention (Fair Queuing)

```javascript
async function acquireWithWait(key, maxWaitTime = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const acquired = await redis.set(key, 'locked', 'EX', 30, 'NX');
    
    if (acquired) return true;
    
    // Exponential backoff: wait 10-100ms then retry
    const backoff = Math.min(100, 10 * Math.pow(2, retries));
    await sleep(backoff);
    retries++;
  }
  
  return false;  // Timeout
}
```

## Lock vs Semaphore

| Aspect | Lock | Semaphore |
|--------|------|-----------|
| Count | Binary (0/1) | Numeric (0-N) |
| Use Case | Exclusive access | Limited resource access |
| Redis | SET/DEL | DECR/INCR |
| Example | Critical data | DB connection pool |

## Semaphore Example

```javascript
// Allow maximum 10 concurrent API requests
async function acquireSemaphore(key, limit = 10) {
  const current = await redis.incr(key);
  
  if (current === 1) {
    // First access, set expiration
    await redis.expire(key, 3600);  // 1 hour
  }
  
  if (current > limit) {
    // Limit exceeded, decrement back
    await redis.decr(key);
    return false;
  }
  
  return true;
}

async function releaseSemaphore(key) {
  await redis.decr(key);
}

// Usage
app.get('/api/resource', async (req, res) => {
  if (!await acquireSemaphore('api:limit')) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const result = await expensiveOperation();
    res.json(result);
  } finally {
    await releaseSemaphore('api:limit');
  }
});
```

## Common Pitfalls

1. **Not setting TTL on lock** → Lock stuck forever
2. **Deleting someone else's lock** → Delete by value, not key
3. **Lock expires during work** → Renewal logic needed
4. **Not handling lock acquisition failure** → Retry or fail fast
5. **Single Redis for critical data** → Use Redlock for HA
6. **Very short TTL** → May expire during processing
7. **Very long TTL** → If server crashes, locked forever

## Best Practices

```javascript
async function safeOperation(key) {
  const lockValue = UUID();  // Unique value
  const ttl = calculateTTL(expectedWorkTime);

  const acquired = await redis.set(key, lockValue, 'EX', ttl, 'NX');
  if (!acquired) {
    throw new Error('Could not acquire lock');
  }

  try {
    // Do work
    await doWork();
  } finally {
    // Only delete if still ours
    const luaScript = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    `;
    await redis.eval(luaScript, 1, key, lockValue);
  }
}
```

## Monitoring Lock Health

```javascript
// Check for stuck locks
async function findStuckLocks() {
  const keys = await redis.keys('lock:*');
  for (const key of keys) {
    const createdAt = parseInt(await redis.get(key));
    const age = Date.now() - createdAt;
    
    if (age > 60000) {  // Older than 1 minute
      console.warn(`Stuck lock: ${key}, age: ${age}ms`);
    }
  }
}

// Lock wait times
const waitStart = Date.now();
while (!acquired && Date.now() - waitStart < 5000) {
  acquired = await redis.set(key, 'locked', 'EX', 30, 'NX');
  if (!acquired) await sleep(100);
}
const waitTime = Date.now() - waitStart;
metrics.recordLockWaitTime(waitTime);
```

**Remember: Locks protect data, not performance. Use wisely!**
