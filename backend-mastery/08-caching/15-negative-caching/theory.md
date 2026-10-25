# Negative Caching: Theory & Concepts

## What is Negative Caching?

Negative caching is the practice of **caching the absence of data** or **error results**. Instead of querying the database every time a key is not found, cache the "miss" itself for a short time.

### The Problem It Solves

```
Without Negative Caching:
User searches for "nonexistentuser:999999"
→ Cache miss
→ Database query
→ No result found
→ Return 404

User searches again 5 seconds later for same user:
→ Cache miss AGAIN
→ Database query AGAIN  
→ No result found (same as before)
→ Return 404

Result: Repeated expensive DB queries for same missing data
```

```
With Negative Caching:
User searches for "nonexistentuser:999999"
→ Cache miss
→ Database query
→ No result found
→ Cache the NULL result for 5 minutes
→ Return 404

User searches again 5 seconds later:
→ Cache HIT (null cached)
→ Return 404 immediately
→ No database query

Result: 1 DB query instead of many
```

---

## When Negative Caching Helps

### High-Value Scenarios

1. **User Authentication**
   - "User with email 'spam@bot.com'" → Not found
   - Don't query DB every failed login attempt
   - Cache miss for 5-10 minutes

2. **Search Engine Queries**
   - Search for "asdfghjkl" → 0 results
   - Don't crawl entire database
   - Cache empty result for 1 hour

3. **Invalid Product IDs**
   - Product ID 999999999 doesn't exist
   - Attacker scans all product IDs
   - Cache miss to prevent DB exhaustion

4. **API Lookups**
   - "Get user by API key 'invalid'"
   - Invalid key → 404
   - Cache 400/401/404 for 5 minutes

---

## Implementation Patterns

### Pattern 1: Cache NULL Values

```javascript
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  
  // Try cache first
  let cached = await redis.get(cacheKey);
  if (cached !== null) {
    // Could be user data OR null sentinel
    if (cached === 'NULL_SENTINEL') {
      return null; // Cache hit on miss
    }
    return JSON.parse(cached);
  }
  
  // Cache miss - query database
  const user = await db.getUser(userId);
  
  if (user) {
    // Cache hit
    await redis.set(cacheKey, JSON.stringify(user), { EX: 3600 });
  } else {
    // NEGATIVE CACHE: cache the null for shorter TTL
    await redis.set(cacheKey, 'NULL_SENTINEL', { EX: 300 }); // 5 min
  }
  
  return user;
}
```

### Pattern 2: Cache Error Codes

```javascript
async function apiLookup(apiKey) {
  const cacheKey = `apikey:${apiKey}`;
  
  // Try cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    const result = JSON.parse(cached);
    if (result.type === 'error') {
      return { code: result.code, cached: true };
    }
    return result;
  }
  
  // Look up in database
  try {
    const data = await db.lookupApiKey(apiKey);
    await redis.set(cacheKey, JSON.stringify({
      type: 'success',
      data
    }), { EX: 3600 });
    return data;
  } catch (error) {
    // NEGATIVE CACHE: error response
    await redis.set(cacheKey, JSON.stringify({
      type: 'error',
      code: error.code
    }), { EX: 300 }); // 5 min
    
    throw error;
  }
}
```

### Pattern 3: Bloom Filter (Advanced)

Use a Bloom filter to cache "definitely doesn't exist"

```javascript
async function userExists(userId) {
  // Quick Bloom check (no false negatives)
  const inBloom = await bloomFilter.contains(userId);
  
  if (!inBloom) {
    // Definitely doesn't exist (Bloom guarantees)
    return false;
  }
  
  // Might exist - check database
  return await db.userExists(userId);
}
```

---

## TTL Considerations

### Different TTLs for Different Scenarios

```javascript
const NegativeCacheTTLs = {
  // User lookups - short TTL (new users appear)
  'user:missing': 300,      // 5 minutes
  
  // Product - medium TTL (inventory changes slowly)
  'product:notfound': 1800, // 30 minutes
  
  // API keys - short TTL (may be revoked)
  'apikey:invalid': 120,    // 2 minutes
  
  // Config - long TTL (rarely changes)
  'config:missing': 3600,   // 1 hour
};
```

---

## Real-World Impact

### Denial of Service Prevention

```
Attacker requests sequential UserIDs: 1, 2, 3, ... 1000000

Without Negative Caching:
- Each request → Database query
- 1,000,000 DB hits
- Database overloaded
- System down

With Negative Caching:
- First 1000 requests → Cache misses, DB queries
- Requests 1001-1,000,000 → Cache hits on "(not found)"
- Total DB hits: 1000
- System survives

Result: 1000x reduction in database load!
```

### Repeated Search Queries

```
Popular search: "asdfghjkl" (gibberish, no results)

Day 1: 1000 users search for "asdfghjkl"
Without caching: 1000 full-table scans
With caching: 1 full-table scan, 999 cache hits

Day 2: 5000 users search
Without: 5000 scans
With: 999 leftover cache hits + 4001 new scans

Investment: 1 expensive query saves thousands
```

---

## Drawbacks & Mitigations

### Problem 1: Stale Data
Data still doesn't exist after cache expires.

**Solution**: Vary TTL by data type
- User → 5 min (new signups are frequent)
- Product → 30 min (inventory changes less)
- Deleted item → 10 sec (deletion recent)

### Problem 2: False Negatives in Cache
Cache says "doesn't exist" but data was added.

**Solution**: Short TTL + active invalidation
```javascript
async function createUser(userData) {
  await db.createUser(userData);
  
  // Invalidate negative cache
  await redis.del(`user:${userData.id}`);
}
```

### Problem 3: Memory Waste
Caching 1M "not found" results.

**Solution**: TTL limits + Bloom filters
```javascript
// Rough estimate: 1M items × 50 bytes = 50MB
// Reasonable trade-off for eliminating queries

// Or use Bloom filter: 1M items = 1MB
```

---

## Patterns to Avoid

### ❌ Don't Cache Negative Results Without TTL
```javascript
// BAD: Cache missing data forever
await redis.set(key, 'NOT_FOUND');
// Problem: If data appears later, cache never refreshes
```

### ❌ Don't Confuse NULL with Missing Cache
```javascript
// BAD: Can't distinguish cache hit from miss
const value = await redis.get(key);
if (!value) {
  // Is it "not found" or "no cache entry"?
}
```

### ❌ Don't Use Same TTL for Success and Failure
```javascript
// BAD: Missing data cached as long as found data
await redis.set(key, 'NULL', { EX: 3600 }); // Same as success

// GOOD:
await redis.set(key, 'NULL', { EX: 300 });   // Shorter for failures
```

---

## Comparison with Alternatives

| Strategy | Memory | TTL | Hit Ratio | Use Case |
|----------|--------|-----|-----------|----------|
| **No Negative** | Low | N/A | Low | Rarely missing |
| **Negative (TTL)** | Medium | 5-30m | High | High miss rate |
| **Bloom Filter** | Low | N/A | High | Very high miss rate |
| **Allowlist (opposite)** | High | Long | Very High | Whitelist approach |

---

## Summary

**Negative caching prevents repeated queries on missing data.**

Use when:
- High cache miss rate
- Expensive queries for misses
- New data appears infrequently
- Can tolerate brief staleness

Don't use when:
- Data changes frequently
- Must be real-time current
- Need to optimize memory over query load
