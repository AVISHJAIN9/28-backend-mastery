# Theory: Redis Data Structures & Core Concepts

## What is Redis?

Redis is an in-memory data structure store that acts as:
1. **Cache** - Fast temporary storage
2. **Session store** - User session data
3. **Message broker** - Pub/Sub communication
4. **Rate limiter** - Per-user request counting
5. **Job queue** - Background task processing

Think of it as a blazing-fast dictionary (HashMap) with special superpowers:

```javascript
// Redis is NOT just for caching!
// It's a database with specific data structures

GET key              // Read value
SET key value        // Write value
INCR counter         // Increment number
LPUSH list item      // Add to list
SADD set member      // Add to set
HSET hash field val  // Add to hash
ZADD sorted_set score member  // Add to sorted set
```

## The 5 Core Data Structures

### 1. **String** - Simple key-value pairs

```javascript
// Storing simple data
SET user:1:name "Alice"         // key, value
GET user:1:name                 // "Alice"

// Increment/Decrement
SET counter 10
INCR counter                    // 11
DECR counter                    // 10
INCRBY counter 5                // 15

// Append to strings
APPEND message "Hello"
APPEND message " World"         // "Hello World"

// Use cases:
// - User session tokens
// - Cache for user profiles
// - Rate limit counters
// - Feature flags
```

Real-world example:
```javascript
// Track API requests per user in last hour
const key = `rate:user:${userId}:hour`;
const current = await redis.incr(key);
if (current === 1) {
  await redis.expire(key, 3600);  // Set expiration
}
if (current > LIMIT) {
  throw new Error('Rate limited');
}
```

### 2. **List** - Ordered sequence (queue-like)

```javascript
// Add to list
LPUSH mylist item1              // Add to LEFT (head)
RPUSH mylist item2              // Add to RIGHT (tail)

// Read from list
LLEN mylist                     // Length: 2
LRANGE mylist 0 -1              // Get all items
LPOP mylist                     // Remove from LEFT
RPOP mylist                     // Remove from RIGHT

// Common operations
LTRIM mylist 0 99               // Keep first 100 items only
LSET mylist 0 newvalue          // Set item at index
LINSERT mylist BEFORE val newval // Insert before value

// Use cases:
// - Message queues
// - Activity feeds (latest first)
// - Log entries
// - Job queues (processed in order)
```

Real-world example:
```javascript
// User activity feed (newest first)
const key = `feed:${userId}`;
LPUSH key newActivity;           // Add to front (newest)
LRANGE key 0 9                   // Get 10 newest activities
LTRIM key 0 999                  // Keep only last 1000
```

### 3. **Set** - Unique, unordered collection

```javascript
// Add to set
SADD myset member1              // Add member
SADD myset member1              // Duplicate—ignored

// Query set
SCARD myset                     // Count: 1
SMEMBERS myset                  // Get all members
SISMEMBER myset member1         // Is member in set? YES
SISMEMBER myset member2         // Is member in set? NO

// Set operations
SINTER set1 set2                // Intersection
SUNION set1 set2                // Union
SDIFF set1 set2                 // Difference
SRANDMEMBER myset 3             // Random 3 members
SPOP myset                      // Remove random member

// Use cases:
// - Unique user IDs (followers, friends)
// - Tags (each post has multiple tags)
// - Preventing duplicates
// - Set operations (common interests, shared followers)
```

Real-world example:
```javascript
// Track unique visitors per page
const pageKey = `visitors:page:${pageId}`;
SADD pageKey userId;             // Add visitor
const uniqueCount = SCARD pageKey; // Total unique visitors

// Find common followers
const mutual = SINTER(
  await redis.smembers(`followers:${userId1}`),
  await redis.smembers(`followers:${userId2}`)
);
```

### 4. **Hash** - Map with named fields (like object)

```javascript
// Set fields
HSET user:1 name "Alice" age 30 email "alice@test.com"

// Get fields
HGET user:1 name                // "Alice"
HGETALL user:1                  // {name: "Alice", age: 30, ...}
HMGET user:1 name age           // ["Alice", 30]

// Field operations
HEXISTS user:1 name             // YES
HEXISTS user:1 phone            // NO
HKEYS user:1                    // ["name", "age", "email"]
HVALS user:1                    // ["Alice", 30, "alice@test.com"]
HLEN user:1                     // 3
HDEL user:1 age                 // Delete field

// Increment field
HSET score:game1 player1 100
HINCRBY score:game1 player1 50  // 150

// Use cases:
// - User objects (profile, settings)
// - Game scores
// - Shopping carts
// - Session data

// BEST FOR: Storing structured data (replacing JSON)
```

Real-world example:
```javascript
// User profile
const userKey = `user:${userId}`;
HSET userKey name "Alice" email "alice@test.com" role "admin";
HGET userKey role;               // "admin"

// More efficient than:
// SET user:1:name "Alice"
// SET user:1:email "alice@test.com"
// SET user:1:role "admin"
```

### 5. **Sorted Set** - Set with scores (ranking/leaderboard)

```javascript
// Add members with scores
ZADD leaderboard 100 player1 150 player2 120 player3

// Query by rank
ZRANGE leaderboard 0 -1         // All members (lowest to highest score)
ZRANGE leaderboard 0 -1 WITHSCORES // [player1, 100, player2, 150, ...]
ZREVRANGE leaderboard 0 -1      // Reverse order (highest to lowest)

// Query by score
ZRANGEBYSCORE leaderboard 100 150 // Members with score 100-150
ZCOUNT leaderboard 100 150      // Count in score range

// Rank operations
ZRANK leaderboard player1       // 0 (lowest)
ZREVRANK leaderboard player1    // 2 (highest if 3 players)

// Update score
ZADD leaderboard 200 player1    // Updates score to 200
ZINCRBY leaderboard 50 player1  // Increase score by 50

// Remove
ZREM leaderboard player1
ZREMRANGEBYRANK leaderboard 0 1 // Remove bottom 2

// Use cases:
// - Leaderboards (scores)
// - Top N items
// - Time-based events (scores = timestamps)
// - Rate limiting (count = score)
// - Sorted task queues
```

Real-world example:
```javascript
// Leaderboard
const lb = 'leaderboard:monthly';
ZADD lb (await getScore(userId)) userId;

// Top 10 players
const top10 = ZREVRANGE lb 0 9 WITHSCORES;

// Rank of player
const rank = ZREVRANK lb userId;  // 0 = 1st place

// Recently active users (score = timestamp)
ZADD activeUsers Date.now() userId;
const active24h = ZRANGEBYSCORE activeUsers (Date.now() - 86400000) Date.now();
```

## Key Expiration (TTL)

All Redis keys can automatically expire:

```javascript
// Set expiration time (seconds)
SET session:abc123 userData EX 3600   // Expires in 1 hour
SET session:abc123 userData PX 60000  // Expires in 60,000ms

// Set manually
EXPIRE key 3600                       // Expire in 3600s
PEXPIRE key 60000                     // Expire in 60000ms

// Check expiration
TTL key                               // Seconds until expiry (-1 = never, -2 = doesn't exist)
PTTL key                              // Milliseconds until expiry

// Remove expiration
PERSIST key                           // Never expires (infinite TTL)

// Real-world:
// - Session tokens: SET token data EX 86400 (1 day)
// - OTP codes: SET otp code EX 300 (5 minutes)
// - Cache: SET cached_data data EX 3600 (1 hour)
```

## Common Mistakes with Redis

### Mistake 1: Expecting Data Persistence

❌ **WRONG:**
```javascript
// Redis is in-memory! Data lost on restart!
redis.set('user:1:name', 'Alice');
// Server restarts → Data GONE
```

✅ **RIGHT:**
```javascript
// Use BOTH Redis (speed) and database (durability)
await redis.set('user:1:name', 'Alice', 'EX', 3600);  // Cache for 1 hour
await db.users.update({ id: 1, name: 'Alice' });      // Persist to database
```

### Mistake 2: Using Single Instance in Production

❌ **WRONG:**
```javascript
// Single Redis instance = single point of failure
const redis = new Redis({ host: 'redis.example.com' });
// Server down → Entire app crashes
```

✅ **RIGHT:**
```javascript
// Use Redis Cluster or Sentinel
const redis = new Redis.Cluster([
  { host: 'redis1.example.com', port: 6379 },
  { host: 'redis2.example.com', port: 6379 },
  { host: 'redis3.example.com', port: 6379 }
]);
```

### Mistake 3: Not Setting Expiration on Session Keys

❌ **WRONG:**
```javascript
redis.set('session:' + sessionId, userData);
// No expiration → Gets garbage collected? NO! Grows infinitely!
```

✅ **RIGHT:**
```javascript
// Always set TTL for temporary data
redis.set('session:' + sessionId, userData, 'EX', 86400);
```

### Mistake 4: Storing Large Objects Without Serialization

❌ **WRONG:**
```javascript
const user = { name: 'Alice', email: 'alice@test.com', settings: {...} };
redis.set('user:1', user);  // ERROR or stored as "[object Object]"
```

✅ **RIGHT:**
```javascript
const user = { name: 'Alice', email: 'alice@test.com' };
redis.set('user:1', JSON.stringify(user));
const retrieved = JSON.parse(await redis.get('user:1'));

// Or use Hash
redis.hset('user:1', 'name', 'Alice', 'email', 'alice@test.com');
```

### Mistake 5: Blocking Operations Without Timeout

❌ **WRONG:**
```javascript
// BLPOP blocks forever if list is empty
const item = redis.blpop('queue', 0);  // 0 = infinite wait
// If queue never gets items, thread hangs
```

✅ **RIGHT:**
```javascript
// Use timeout
const item = redis.blpop('queue', 30);  // Wait 30 seconds max
if (item === null) {
  // Queue is empty, continue with other work
}
```

## Real-World Usage Patterns

### Pattern 1: Cache-Aside (Lazy Loading)

```javascript
async function getUser(userId) {
  // Check cache first
  let user = await redis.get(`user:${userId}`);
  if (user) return JSON.parse(user);
  
  // Cache miss: fetch from database
  user = await db.users.findById(userId);
  
  // Store in cache for future requests
  await redis.set(`user:${userId}`, JSON.stringify(user), 'EX', 3600);
  
  return user;
}
```

### Pattern 2: Leaderboard

```javascript
// Add score
ZADD leaderboard score userId;

// Get rank
const rank = ZREVRANK leaderboard userId;

// Get top N
const top = ZREVRANGE leaderboard 0 9 WITHSCORES;

// Score range
const inRange = ZRANGEBYSCORE leaderboard 100 500;
```

### Pattern 3: Rate Limiting

```javascript
async function rateLimit(userId, limit = 100, window = 3600) {
  const key = `rate:${userId}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, window);  // Set expiration
  }
  
  if (count > limit) {
    throw new Error('Rate limited');
  }
}
```

### Pattern 4: Pub/Sub Messaging

```javascript
// Publisher
redis.publish('notifications', JSON.stringify({
  userId: 'user123',
  message: 'Your order shipped!'
}));

// Subscriber
redis.subscribe('notifications', (message) => {
  console.log('Notification:', message);
});
```

## 5 Real-World Failures

### 1. **Memory Explosion** - Forgot to Set Expiration

Keys accumulated indefinitely, Redis ran out of memory, server crashed.

### 2. **Data Loss on Reboot** - Used Redis as Primary DB

Didn't understand Redis is in-memory. Server restarted, all data gone.

### 3. **Stale Cache** - Cache Invalidation Bug

Updated database but cache wasn't invalidated. Users saw old data.

### 4. **Thundering Herd** - Cache Expiration Synchronized

All cache keys expired at same time → database slammed with requests.

### 5. **Connection Pool Exhaustion** - Too Many Connections

Didn't limit Redis client connections, server reached max connections limit.

## Implementation Checklist

- [ ] Use Redis for speed, database for durability
- [ ] Set TTL on all temporary data (sessions, cache, OTP)
- [ ] Use appropriate data structure (String, Hash, List, Set, Sorted Set)
- [ ] Serialize complex objects (JSON.stringify)
- [ ] Set connection pool size
- [ ] Monitor memory usage
- [ ] Use Cluster or Sentinel for high availability
- [ ] Test cache invalidation logic
- [ ] Implement cache warming for critical keys
- [ ] Log cache hits/misses for debugging
- [ ] Stagger expiration times (avoid thundering herd)
- [ ] Use blocking operations with timeout

## Key Takeaway

Redis is **not** just a cache—it's a toolkit for:
- Speed (in-memory access)
- Data structures (lists, sets, sorted sets)
- Expiration (automatic cleanupof temporary data)
- Messaging (Pub/Sub)
- Locking (distributed locks)

Master the 5 data structures, and Redis unlocks incredible possibilities.
