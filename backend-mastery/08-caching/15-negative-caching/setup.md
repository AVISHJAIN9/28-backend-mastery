# Installation & Setup: Module 15

## Prerequisites
- Node.js 16+ installed
- Redis running (localhost:6379)
- Ports 6415 available

## Installation

```bash
cd 15-negative-caching
npm install
```

## Configuration

Copy `.env.example` → `.env` (or it uses defaults):
```
REDIS_HOST=localhost
REDIS_PORT=6379
HTTP_PORT=6415
```

## Running

```bash
npm start
```

Output:
```
✓ Redis connected
🚀 Negative Caching Server on http://localhost:6415
```

## Testing the Module

### In Browser: http://localhost:6415

1. **Scenario 1**: Repeated missing user
   - Enter ID 3 (doesn't exist)
   - Get user → DB query
   - Get user again → Negative cache hit
   - Notice: DB query count doesn't increase

2. **Scenario 2**: DDoS prevention
   - Try IDs 100, 101, 102... (new each time)
   - Then repeat ID 100 → Cache hit
   - See hit rate climb as pattern repeats

3. **Scenario 3**: Compare with existing
   - Get ID 1 (exists) → DB query, regular cache
   - Get ID 1 again → Cache hit
   - Get ID 10 (missing) → DB query, negative cache
   - Get ID 10 again → Negative cache hit
   - Both reduce DB load

## API Endpoints

### GET /api/user/:id
Lookup user with negative caching

Response:
```json
{
  "user": null,
  "source": "negative-cache",
  "cacheAge": 250
}
```

### GET /api/metrics
Get performance metrics

Response:
```json
{
  "cacheLookups": 10,
  "cacheHits": 8,
  "cacheMisses": 2,
  "dbQueries": 2,
  "negativeCacheHits": 6,
  "hitRate": "80%"
}
```

### POST /api/cache/clear
Reset cache and metrics

## Key Learning Points

✅ Understand cache-miss problem (repeated queries)
✅ See negative cache solution in action
✅ Observe TTL differences (5 min vs 1 hour)
✅ Calculate DDoS prevention benefit
✅ Learn NULL_SENTINEL pattern
