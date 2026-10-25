# Theory & Concepts
## Response Caching Overview
Caching stores responses to avoid recalculating them, improving performance. Browser caches, server can cache, and CDNs cache.

## Cache Validation with ETag
ETag (Entity Tag) is a hash of content. When client requests same resource, server compares ETags: if same, returns 304 Not Modified.

## How 304 Works
1. Client: GET /api/users (If-None-Match: "abc123")
2. Server: Compares hash, matches
3. Server: Returns 304 Not Modified (no body)
4. Browser: Uses cached response in memory

## Cache Headers
- **Cache-Control: max-age=3600** - Cache valid for 3600 seconds
- **ETag: "hash"** - Content identifier
- **Last-Modified: date** - When was content last changed
- **Expires: absolute-date** - Expiration time (deprecated)
- **Vary: Accept-Encoding** - Cache based on compression

## Cache Invalidation
- **Time-Based**: Cache expires after max-age seconds
- **Event-Based**: Invalidate when data changes
- **Manual**: Admin clears cache

## When to Cache
- Static content (images, CSS, JS)
- Expensive queries (complex database operations)
- External API calls (rate limit, latency)
- Frequently accessed data

## Tradeoff
Stale data (cache) vs fresh data (no cache). Balance based on business requirements.
