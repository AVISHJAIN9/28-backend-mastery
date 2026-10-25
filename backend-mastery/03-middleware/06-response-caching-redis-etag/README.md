# Response Caching with ETag Middleware

## What is this?
Response caching middleware uses ETags (Entity Tags) to cache responses on the client side and validate freshness, reducing bandwidth when content hasn't changed.

## Why does it matter?
- **Bandwidth Savings**: Clients don't re-download unchanged content
- **Faster Responses**: 304 Not Modified faster than full response
- **SEO Friendly**: Reduces server load for crawlers
- **User Experience**: Faster page loads for returning users
- **Automatic**: Browsers handle caching automatically
- **Validation**: Ensures cached content matches current version

## How it works (step by step)
1. Server generates response
2. Middleware creates ETag (hash of response body)
3. Server includes ETag header in response
4. Browser caches response + ETag
5. Browser makes new request for same resource
6. Browser includes If-None-Match header with ETag
7. Server receives request with If-None-Match
8. Server compares ETag with current content
9. If match: Return 304 Not Modified (no body)
10. If different: Return 200 with new content and new ETag
11. Browser uses cached version if 304
12. Browser uses new version if 200

## Key concepts
- **ETag**: Hash representing response content
- **If-None-Match**: "If my cached ETag doesn't match, send new content"
- **304 Not Modified**: Response indicates use cached version
- **Cache-Control**: Specifies duration of cache (max-age)
- **Expires**: Absolute date when cache expires
- **Validation**: Check if cached content still valid

## Common mistakes
- Setting cache-control too aggressive (stale content)
- Not including ETag with responses
- Using same ETag for different content
- Caching authentication-required responses
- Caching responses with sensitive data

## Real world usage
```javascript
// Generate ETag
const crypto = require('crypto');
const etag = crypto.createHash('md5')
  .update(JSON.stringify(data))
  .digest('hex');

// Set ETag and cache headers
res.set('ETag', etag);
res.set('Cache-Control', 'max-age=3600');
res.json(data);

// Browser request 1 (fresh):
// GET /api/data -> Returns 200 with body and ETag

// Browser request 2 (after 1 hour):
// GET /api/data with If-None-Match: "old_etag"
// Server checks, ETags match
// Returns 304 Not Modified (no body)
// Browser uses cached response
```
