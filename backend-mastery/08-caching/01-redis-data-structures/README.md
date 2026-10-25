# Module 08.1: Redis Data Structures

## Overview

Master Redis's five core data structures—String, List, Set, Hash, and Sorted Set—with practical examples and interactive demonstrations. Each structure solves different problems and powers real-world applications at scale.

## Quick Start

### Prerequisites
- Node.js 16+
- Redis server running (`redis-server` or Docker: `docker run -p 6379:6379 redis`)
- npm

### Installation & Setup

```bash
cd 08-caching/01-redis-data-structures

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start backend (Terminal 1)
npm run dev    # Runs on http://localhost:6401

# Start frontend (Terminal 2)
npm start      # Opens React UI on http://localhost:3000
```

## Core Data Structures

### 1. String - Key-Value Pairs

**Best For:** Caching, sessions, counters, feature flags, rate limiting tokens

```bash
SET user:1:name "Alice"           # Set a value
GET user:1:name                   # Get a value
SET session:token abc123 EX 3600  # With expiration (1 hour)
INCR page:views                   # Atomic counter increment
APPEND message " world"           # Append text
```

**Real-World Examples:**
- User session tokens (SET with EX)
- Page view counters (INCR)
- Feature flags (SET/GET)
- Cache entries (SET + EX for TTL)
- API rate limit tracking (INCR + EXPIRE)

### 2. List - Ordered Sequences

**Best For:** Queues, activity feeds, job processing, logs, chat histories

```bash
LPUSH queue:jobs job_1234         # Push to head (O(1))
RPUSH queue:jobs job_5678         # Push to tail (O(1))
LRANGE queue:jobs 0 -1            # Get all items
LPOP queue:jobs                   # Remove from head (O(1))
RPOP queue:jobs                   # Remove from tail (O(1))
LTRIM queue:jobs 0 99             # Keep only first 100
```

**Real-World Examples:**
- Job queue (LPUSH + RPOP = FIFO queue)
- Activity feed (LPUSH + LRANGE)
- Chat message history (RPUSH + LRANGE for pagination)
- Logs (LPUSH + LTRIM to bounded list)
- Real-time notifications (LPUSH + BRPOP for blocking)

### 3. Set - Unique Members

**Best For:** Followers, tags, deduplication, membership testing, analytics

```bash
SADD followers:alice bob charlie    # Add members (ignores duplicates)
SMEMBERS followers:alice            # Get all members
SCARD followers:alice               # Count members
SISMEMBER followers:alice bob       # Check membership (O(1))
SINTER followers:alice followers:bob # Mutual followers
SUNION tags:post:1 tags:post:2      # Combined tags
```

**Real-World Examples:**
- Social graph (followers, following)
- Unique tags per post (SADD + SMEMBERS)
- Deduplication (SADD returns 1 if new)
- Online users (SADD when login, SREM at logout)
- Set operations for analytics (SINTER for common interests)

### 4. Hash - Object Storage

**Best For:** User profiles, game scores, shopping carts, session data, document-like structures

```bash
HSET user:1 name "Alice" email "alice@test.com" role "admin"
HGET user:1 name                  # Get single field
HGETALL user:1                    # Get all fields
HDEL user:1 role                  # Delete field
HEXISTS user:1 email              # Check field exists
HINCRBY game:score:1 points 100   # Increment numeric field
```

**Real-World Examples:**
- User profiles (store all user data as hash)
- Game/leaderboard scores (HSET + HINCRBY)
- Shopping cart (field = product_id, value = quantity)
- Session data (alternative to String with JSON)
- Counters per entity (HINCRBY for atomic updates)

### 5. Sorted Set - Scored Rankings

**Best For:** Leaderboards, top-N queries, time-based events, rate limiting, priority queues

```bash
ZADD leaderboard 1500 alice 1200 bob 950 charlie
ZRANGE leaderboard 0 -1              # Get all (lowest to highest)
ZREVRANGE leaderboard 0 -1           # Get all (highest to lowest)
ZREVRANK leaderboard alice           # Get rank (1st place = rank 0)
ZSCORE leaderboard alice             # Get score
ZCOUNT leaderboard 1000 2000         # Count in score range
```

**Real-World Examples:**
- Leaderboards (ZADD + ZREVRANGE for top 10)
- Top products by views (ZADD + ZREVRANGE)
- Time-based events (score = timestamp, ZADD + ZRANGE for range queries)
- Rate limiting by timestamp (ZADD timestamps + ZCOUNT recent)
- Priority queues (score = priority, ZPOPMIN for server)

## Key Expiration (TTL)

All data types support automatic expiration:

```bash
SET user:session abc123 EX 3600   # Expire in 3600 seconds
SET user:session abc123 PX 60000  # Expire in 60000 milliseconds
EXPIRE user:session 7200          # Set expiration on existing key
TTL user:session                  # Get remaining seconds (-1 = never, -2 = expired)
PERSIST user:session              # Remove expiration
```

**Use Cases:**
- Session tokens (EX 3600 for 1 hour)
- OTP/verification codes (EX 300 for 5 minutes)
- Cache entries (EX based on data freshness)
- Rate limit buckets (EX 60 for per-minute limits)
- Hot data (automatic cleanup)

## API Endpoints

### String Endpoints

**POST /api/string/set**
```json
{
  "key": "user:1:name",
  "value": "Alice",
  "ttl": 3600
}
```

**GET /api/string/:key**
```
GET /api/string/user:1:name
```

**POST /api/string/:key/incr**
```json
{
  "amount": 1
}
```

### List Endpoints

**POST /api/list/:key/push**
```json
{
  "value": "job_123",
  "position": "left"
}
```

**GET /api/list/:key**

**DELETE /api/list/:key/pop**
```json
{
  "position": "left"
}
```

### Set Endpoints

**POST /api/set/:key/add**
```json
{
  "member": "bob"
}
```

**GET /api/set/:key**

**GET /api/set/:key/member/:member**

### Hash Endpoints

**POST /api/hash/:key/set**
```json
{
  "fields": {
    "name": "Alice",
    "email": "alice@test.com"
  }
}
```

**GET /api/hash/:key**

**GET /api/hash/:key/:field**

### Sorted Set Endpoints

**POST /api/zset/:key/add**
```json
{
  "member": "alice",
  "score": 1500
}
```

**GET /api/zset/:key**

**GET /api/zset/:key/rank/:member**

### Utility Endpoints

**GET /api/demo/load-data** - Load sample data
**GET /api/demo** - View all demo data
**DELETE /api/key/:key** - Delete a key
**POST /api/key/:key/expire** - Set TTL
**GET /api/key/:key/ttl** - Check remaining time

## 6 Common Mistakes

### 1. Assuming Data Persists by Default
**❌ Problem:** Developer expects Redis data to survive server restarts
```javascript
// Assumes data is safe after server restart - WRONG!
await redis.set('user:1', JSON.stringify(userData));
```

**✅ Fix:** Enable RDB or AOF persistence in redis.conf
```
# redis.conf
save 900 1        # 1 change in 15 minutes
save 300 10       # 10 changes in 5 minutes
appendonly yes    # Enable AOF
```

### 2. Running Single Redis Instance in Production
**❌ Problem:** Single point of failure, no failover
```javascript
// Single Redis instance - what if it crashes?
const redis = new Redis('localhost:6379');
```

**✅ Fix:** Use Redis Sentinel or Cluster for HA
```javascript
const redis = new Redis.Sentinel([
  { host: 'sentinel1', port: 26379 },
  { host: 'sentinel2', port: 26379 }
], { name: 'mymaster' });
```

### 3. No Expiration on Cache Data
**❌ Problem:** Cache grows unbounded, exhausts memory
```javascript
// Cache grows forever!
await redis.set(`cache:user:${userId}`, JSON.stringify(user));
```

**✅ Fix:** Always set TTL for cache data
```javascript
// Cache expires after 1 hour
await redis.setEx(`cache:user:${userId}`, 3600, JSON.stringify(user));
```

### 4. Storing Large Objects Without Serialization
**❌ Problem:** Network overhead, memory waste, deserialization errors
```javascript
// Storing raw object - inefficient
await redis.set('user:1', userData); // Converts to string poorly
```

**✅ Fix:** Serialize to JSON
```javascript
await redis.set('user:1', JSON.stringify(userData));
const user = JSON.parse(await redis.get('user:1'));
```

### 5. Blocking Operations Without Timeout
**❌ Problem:** Connection hangs indefinitely, thread starvation
```javascript
// Blocks forever if queue is empty
const job = await redis.brpop('queue:jobs');
```

**✅ Fix:** Always set timeout
```javascript
// Block for 1 second max, then return null
const job = await redis.brpop('queue:jobs', 1);
```

### 6. Not Monitoring Memory Usage
**❌ Problem:** Redis runs out of memory, crashes, data loss
```javascript
// No idea how much memory is being used
const data = await redis.info('memory');
```

**✅ Fix:** Monitor and implement eviction policy
```
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru  # Evict least-recently-used keys
```

## Real-World Scenarios

### Leaderboard (Sorted Set)
```javascript
async function updateLeaderboard(userId, points) {
  await redis.zadd('leaderboard:game', points, userId);
}

async function getTopPlayers(limit = 10) {
  return await redis.zrevrange('leaderboard:game', 0, limit - 1, 'WITHSCORES');
}

async function getPlayerRank(userId) {
  return await redis.zrevrank('leaderboard:game', userId) + 1;
}
```

### Session Management (String + Hash)
```javascript
async function createSession(userId) {
  const sessionId = generateToken();
  await redis.setex(
    `session:${sessionId}`,
    3600, // 1 hour
    JSON.stringify({ userId, createdAt: Date.now() })
  );
  return sessionId;
}
```

### Activity Feed (List)
```javascript
async function addActivity(userId, action) {
  const id = generateId();
  await redis.lpush(
    `activity:${userId}`,
    JSON.stringify({ id, action, timestamp: Date.now() })
  );
  // Keep only last 100 activities
  await redis.ltrim(`activity:${userId}`, 0, 99);
}

async function getActivityFeed(userId, page = 0) {
  const PAGE_SIZE = 20;
  return await redis.lrange(
    `activity:${userId}`,
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE - 1
  );
}
```

### Deduplication (Set)
```javascript
async function processEvent(eventId) {
  // SADD returns 1 if new, 0 if already processed
  const isNew = await redis.sadd('processed:events', eventId);
  if (isNew) {
    // Process event only once
    await handleEvent(eventId);
  }
}
```

## Implementation Checklist

- [ ] Redis server running (verify with `redis-cli PING`)
- [ ] Connection pooling configured (min/max pool size)
- [ ] Persistence enabled (RDB or AOF) for production
- [ ] TTL set on all cache/session data
- [ ] Memory limit and eviction policy configured
- [ ] Monitoring alerts for memory/CPU/operations
- [ ] Sentinel or Cluster for high availability
- [ ] Timeout values set on all blocking operations
- [ ] JSON serialization for complex objects
- [ ] Error handling for connection failures
- [ ] Pub/Sub patterns for real-time features
- [ ] Lua scripting for atomic multi-step operations

## Conclusion

Redis data structures are the foundation of high-performance applications. Master these five types and you can build caches, queues, leaderboards, session systems, and more. Always remember: persistence, expiration, monitoring, and high availability make the difference between labs and production systems.

**Next Module:** 08.2 - Cache-Aside Pattern (implementing the cache pattern from first principles)
