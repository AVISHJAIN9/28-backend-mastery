# HTTP Caching: ETags & Cache-Control Headers

## What is HTTP Caching?

HTTP caching allows browsers and intermediary servers to cache responses from servers, reducing bandwidth, server load, and latency. Unlike application-level caching (Redis), HTTP caching is managed at the protocol level using HTTP headers.

**Three Layers of Caching:**
1. Browser cache (client-side)
2. CDN cache (intermediary)
3. Server-side (Redis, memory)

## HTTP Cache-Control Header

The `Cache-Control` header tells the browser HOW LONG to cache a response.

```javascript
// Max-Age: Cache for 1 hour (3600 seconds)
res.set('Cache-Control', 'max-age=3600');

// No-Cache: Always validate with server before using
res.set('Cache-Control', 'no-cache');

// No-Store: Never cache (sensitive data)
res.set('Cache-Control', 'no-store');

// Public: Can be cached by any cache (browsers, CDNs)
res.set('Cache-Control', 'public, max-age=3600');

// Private: Only browser cache, not CDNs
res.set('Cache-Control', 'private, max-age=3600');

// Immutable: Never changes, cache forever
res.set('Cache-Control', 'public, max-age=31536000, immutable');
```

### Cache-Control Directives

| Directive | Meaning | Example |
|-----------|---------|---------|
| `max-age=X` | Cache for X seconds | `max-age=3600` (1 hour) |
| `no-cache` | Validate with server first | Must revalidate |
| `no-store` | Don't cache at all | Sensitive data |
| `public` | Cache anywhere (CDN ok) | Static files |
| `private` | Only browser cache | User profiles |
| `must-revalidate` | After max-age, MUST revalidate | No stale serving |
| `proxy-revalidate` | CDN must revalidate | After expiration |
| `immutable` | Will never change | Static assets |
| `s-maxage=X` | CDN cache time | `s-maxage=86400` |

## ETags (Entity Tags)

An ETag is a unique identifier of a response's content. If content hasn't changed, the ETag remains the same.

**How ETags Work:**

```
1. First Request:
   Client → Server
   Server responds with:
     Content: "Hello World"
     ETag: "abc123"

2. Second Request (with cached content):
   Client: "I have ETag 'abc123', has it changed?"
   If-None-Match: "abc123"

3. Server checks:
   Current ETag: "abc123"
   
   - If matches: Send 304 Not Modified (0 bytes)
   - If different: Send 200 OK with new content

4. Browser uses cached version if 304 received
```

## Implementation in Express

### 1. Simple ETag Caching

```javascript
import etag from 'etag';

app.get('/api/user/:id', (req, res) => {
  const user = { id: 1, name: 'Alice', email: 'alice@test.com' };
  const content = JSON.stringify(user);
  
  // Generate ETag from content
  const tag = etag(content);
  res.set('ETag', tag);
  
  // Check if client has same ETag
  if (req.get('If-None-Match') === tag) {
    return res.status(304).send();  // Not Modified
  }
  
  res.set('Cache-Control', 'private, max-age=300');
  res.json(user);
});
```

### 2. Weak vs Strong ETags

```javascript
// Strong ETag (exact match required)
res.set('ETag', '"abc123"');

// Weak ETag (representation match, ignore minor changes)
res.set('ETag', 'W/"abc123"');

// Use weak for images/CSS (minor compression differences ok)
// Use strong for JSON/API responses (exact match required)
```

### 3. Last-Modified Header

Alternative to ETags using modification time:

```javascript
app.get('/api/posts/:id', (req, res) => {
  const post = { id: 1, title: 'Hello', modifiedAt: '2024-03-15T10:00:00Z' };
  
  // Set Last-Modified header
  res.set('Last-Modified', post.modifiedAt);
  
  // Check If-Modified-Since
  const clientTime = new Date(req.get('If-Modified-Since'));
  const serverTime = new Date(post.modifiedAt);
  
  if (clientTime >= serverTime) {
    return res.status(304).send();  // Not Modified
  }
  
  res.set('Cache-Control', 'public, max-age=60');
  res.json(post);
});
```

## Real-World Caching Strategies

### Strategy 1: Static Assets (Immutable)

```javascript
// CSS, JS, images with content hash in filename
app.get('/assets/style.a1b2c3.css', (req, res) => {
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  // 1 year cache since filename changes when content changes
  res.sendFile('style.css');
});
```

### Strategy 2: API Endpoints (Revalidating)

```javascript
app.get('/api/data', (req, res) => {
  const data = fetchData();
  const tag = etag(JSON.stringify(data));
  
  res.set('ETag', tag);
  res.set('Cache-Control', 'public, max-age=300, must-revalidate');
  // 5 minute cache, but must revalidate after expiration
  
  if (req.get('If-None-Match') === tag) {
    return res.status(304).send();
  }
  
  res.json(data);
});
```

### Strategy 3: User-Specific Content (Private)

```javascript
app.get('/api/profile', requireAuth, (req, res) => {
  const profile = getUserProfile(req.user.id);
  
  res.set('Cache-Control', 'private, max-age=1800, must-revalidate');
  // 30 minute cache in browser only, not CDN
  // User won't see other users' profiles
  
  res.json(profile);
});
```

### Strategy 4: Frequently Changing (No-Cache)

```javascript
app.get('/api/stock-price/:symbol', (req, res) => {
  const price = getStockPrice(req.params.symbol);
  
  res.set('Cache-Control', 'public, no-cache');
  // Browser can cache, but must validate with server first
  // No stale stock prices for more than request time
  
  res.json(price);
});
```

## HTTP Caching Flow Chart

```
Request arrives
    ↓
Browser has cached copy?
    ├─ NO → Fetch from server
    └─ YES, within max-age?
        ├─ YES → Use cached (HIT) ✓
        └─ NO, send to server
           If-None-Match (ETag) or If-Modified-Since
                ↓
           Server content unchanged?
                ├─ YES → 304 Not Modified (use cache)
                └─ NO → 200 OK with new content
```

## Common Cache Headers by Content Type

| Type | Headers | TTL |
|------|---------|-----|
| HTML | `no-cache, must-revalidate` | Check every request |
| CSS/JS | `public, immutable` | 1 year |
| Images | `public, max-age=31536000` | 1 year |
| API JSON | `public, max-age=300` | 5 minutes |
| User Data | `private, max-age=1800` | 30 minutes |
| Sensitive | `no-store, no-cache` | Never |

## Performance Benefits

- **Bandwidth Reduction:** 304 responses are 0 bytes vs full response
- **Server Load:** Cache hits bypass server entirely
- **Latency:** Browser cache response: < 1ms
- **User Experience:** Faster page loads and API responsiveness

## Browser DevTools Tips

```
1. Open Network tab (F12 → Network)
2. Check "Disable cache" option for development
3. View headers: Right-click response → Headers
4. Look for:
   - Cache-Control values
   - ETag header
   - Last-Modified header
   - 304 Not Modified responses
```

## Common Mistakes

1. **No Cache-Control on dynamic content** → Browser caches indefinitely
2. **Cache-Control on login endpoints** → Credentials cached
3. **Using strong ETags for streaming** → Different each request
4. **Setting max-age too high** → Stale content for weeks
5. **Setting max-age too low** → Server gets hammered
6. **Missing ETag on mutable content** → Can't revalidate

**Golden Rule:** Static = long cache, dynamic = short/revalidate!
