# Setup Guide: Module 12 - Cache Warming

## Prerequisites
- Node.js >= 16.0.0
- Redis server running on localhost:6379
- npm >= 8.0.0

## Quick Start

### 1. Install Dependencies
```bash
cd 12-cache-warming
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env if needed (defaults provided)
```

### 3. Start Redis (if not running)
```bash
redis-server
# or
brew services start redis  # macOS
```

### 4. Start the Server
```bash
npm start
```

Server runs on: **http://localhost:6410**

## Using the Dashboard

### Control Panel
- **Warm Cache (Startup)**: Load all users, products, and config into Redis
- **Clear Cache**: Remove all cached data
- **Auto-refresh**: Real-time cache status updates

### Fetch Items
1. Select an item from the dropdown (user, product, or config)
2. Click "Fetch from Cache"
3. View the item data and TTL

### Monitoring
- **Total Keys**: Number of cached items
- **Warmed Items**: Items loaded by warming strategy
- **Memory Usage**: Redis memory consumption
- **Activity Log**: Real-time operation log

## API Endpoints

### Cache Operations
```bash
# Warm cache (startup preloading)
POST /api/cache/warm/startup

# Get cache status
GET /api/cache/status

# Get all cached data
GET /api/cache/all

# Clear all cache
POST /api/cache/clear

# Fetch specific item
GET /api/item/:key
# Example: /api/item/user:1, /api/item/product:101
```

### Database Info
```bash
# Database statistics (items available to warm)
GET /api/database/stats
```

## Understanding the Strategies

### Strategy 1: Startup Preloading
- **When**: Application boot
- **What**: Load all critical users, products, config
- **TTL**: User: 1h, Product: 2h, Config: 1d
- **Example**: Run immediately after `npm start`

### Strategy 2: Scheduled Refresh
- **When**: Every 5 minutes (automatic)
- **What**: Reload products
- **TTL**: 2 hours for products
- **Example**: Keeps data fresh without requests

### Strategy 3: Lazy Warmer
- **When**: On cache access
- **What**: Reheating data near expiry (< 10 min left)
- **TTL**: Refreshed to original duration
- **Example**: Try fetching same item twice quickly

### Strategy 4: Warm-on-Deploy (Code only)
- **When**: During deployment
- **Intensity**: full | standard | minimal
- **Example**: See server.js for implementation

## Testing Scenarios

### Test 1: Cold Start Performance
```
1. Clear cache: POST /api/cache/clear
2. Fetch item: GET /api/item/product:101 (slow - DB query)
3. Fetch again: GET /api/item/product:101 (fast - cached)
```

### Test 2: Startup Warming
```
1. Click "Warm Cache" button in dashboard
2. Check "Total Keys" increases
3. Fetch immediately after
4. Notice fast response (cache hit)
```

### Test 3: TTL & Reheating
```
1. Fetch an item
2. Check TTL in response
3. Wait for TTL to approach 0
4. Fetch again - lazy warmer should reheat
```

### Test 4: Scheduled Refresh
```
1. Warm cache
2. Wait 5 minutes
3. Products are automatically refreshed
4. Check activity log for refresh messages
```

## Key Metrics

After warming your cache, track these KPIs:

| Metric | Target | Importance |
|--------|--------|-----------|
| Warm-up Duration | < 30s | Startup experience |
| Cache Hit Rate (5m) | > 70% | User experience |
| Coverage | 80% of traffic | Efficiency |
| Memory Usage | < 60% | Cost |
| Items Warmed | 11 (5 users + 5 products + config) | Verification |

## Troubleshooting

### "Cannot connect to Redis"
```
✓ Check Redis is running: redis-cli ping
✓ Verify port 6379 is correct in .env
✓ Check firewall settings
```

### "Port 6410 already in use"
```
✓ Change HTTP_PORT in .env
✓ Or kill existing process: lsof -i :6410 | kill -9
```

### "Cache not warming"
```
✓ Check server.js warmCacheStartup function
✓ Verify Redis connection successful
✓ Check error logs in console
```

### "Items not in cache after warming"
```
✓ Confirm warm-up completed (check activity log)
✓ Check TTL: GET key:ttl in redis-cli
✓ Verify no memory limits reached
```

## Advanced Usage

### Custom Warming Strategy
Edit server.js and add your own warming function:

```javascript
async function customWarmCache() {
  // Load only products > $100
  const expensive = db.products.filter(p => p.price > 100);
  for (const product of expensive) {
    await redis.set(`product:${product.id}`, JSON.stringify(product), { EX: 3600 });
  }
}
```

### Monitor Warming Progress
```bash
# Terminal 2: Watch cache growth
watch "redis-cli dbsize"
```

### Test with Load
```bash
# Terminal 2: Simple load test
for i in {1..100}; do
  curl http://localhost:6410/api/item/product:101 &
done
wait
```

## Next Steps

✅ Understand why cache warming prevents "thundering herd"  
✅ Learn when to use each warming strategy  
✅ Implement startup preloading in your apps  
✅ Create scheduled refresh for slow-changing data  
✅ Monitor cache hit rates in production  

**Next Module**: 13 - Multi-tier Caching (L1/L2/L3 cache hierarchy)
