# Caching Theory

## Redis Caching Patterns

### Cache-Aside Pattern
- Request → Check cache → Miss → Fetch DB → Store in cache → Return

### Write-Through Pattern
- Write → Update both cache and DB → Return

### Write-Behind Pattern  
- Write → Update cache → Async update DB → Return

## Key Terms
- **TTL**: Time-to-live for cache entries
- **Eviction**: Automatic removal of old cache data
- **Invalidation**: Manual cache clearing
- **Stampede**: Multiple requests for same expired key
