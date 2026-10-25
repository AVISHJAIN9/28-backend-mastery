# Setup & README: Module 15 - Negative Caching

## Quick Start
```bash
cd 15-negative-caching
npm install
npm start
```
Open: **http://localhost:6415**

## Concept

Negative caching =  **Cache the absence of data**

Instead of querying database every time a key is not found, cache the "miss" for a short time.

## Example

```
Without: User not found → DB query 1, 2, 3... (repeated)
With: User not found → DB query 1, then cache hits 2-100
```

## Key Points

- Cache NULL values with TTL sentinel
- Use shorter TTL than successful cache (5 min vs 1 hour)
- Prevents DDoS from scanning non-existent IDs
- Reduces wasted DB queries

## Test

1. Try User ID "3" multiple times (doesn't exist)
2. See "negative-cache" source on repeat
3. Check metrics → Notice 90%+ reduction in DB queries

## Production Use Cases

- Failed login attempts (wrong email)
- Non-existent user IDs (attacker scanning)
- Invalid API keys
- Search results with 0 matches
