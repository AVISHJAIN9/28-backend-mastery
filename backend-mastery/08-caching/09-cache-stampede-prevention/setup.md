# Module 09: Cache Stampede Prevention - Setup Guide

## Prerequisites

### System Requirements
- **Node.js:** 16.0.0 or higher
- **npm:** 8.0.0 or higher
- **Redis:** 6.0 or higher (for cache management)
- **Operating System:** macOS, Linux, or Windows with WSL2
- **RAM:** Minimum 2GB (4GB recommended)
- **Disk Space:** 500MB minimum

### Check Your Versions
```bash
# Verify Node.js
node --version
# Expected: v16.0.0 or higher

# Verify npm
npm --version
# Expected: 8.0.0 or higher

# Verify Redis (first ensure Redis is running)
redis-cli ping
# Expected: PONG
```

---

## Installation Steps

### Step 1: Clone or Create Project Structure
```bash
# Navigate to the project root
cd /path/to/08-caching/09-cache-stampede-prevention

# Verify directory structure
ls -la
# Should see: App.jsx, App.css, server.js, package.json, .env.example, etc.
```

### Step 2: Install Dependencies
```bash
# Install all npm packages
npm install

# What gets installed:
# - express: Web framework
# - redis: Redis client
# - cors: Cross-origin support
# - helmet: Security headers
# - dotenv: Environment variables
# - nodemon: Development auto-reload (optional)
```

### Step 3: Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
# or
code .env

# Verify required variables:
# NODE_ENV=development
# HTTP_PORT=6415
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

### Step 4: Start Redis (if not already running)
```bash
# Start Redis server (choose one method):

# Method 1: Using Homebrew (macOS/Linux)
brew services start redis
# or
redis-server

# Method 2: Using Docker
docker run -d -p 6379:6379 redis:latest

# Method 3: Verify Redis is running
redis-cli ping
# Expected output: PONG
```

### Step 5: Start the Backend Server
```bash
# Development mode with auto-reload
npm start

# Expected output:
# Server running on http://localhost:6415
# Redis connected on localhost:6379
# Backend ready for requests
```

---

## Development Workflow

### Running in Development
```bash
# Terminal 1: Start Redis (if not running)
redis-server

# Terminal 2: Start Backend
npm start

# Terminal 3: Start Frontend (from parent directory)
cd ../..
npm start  # Starts React on port 3000
```

### Testing the Backend Directly
```bash
# Test XFetch endpoint
curl http://localhost:6415/api/xfetch

# Test Distributed Lock endpoint
curl http://localhost:6415/api/lock

# Test Stale-While-Revalidate endpoint
curl http://localhost:6415/api/stale-while-revalidate

# Clear cache (for testing)
curl -X POST http://localhost:6415/api/clear-cache

# Expected: { success: true, cleared: 3 }
```

### Using Thunder Client or Postman
```
Method: GET
URL: http://localhost:6415/api/xfetch
Headers: Content-Type: application/json

Response (First call):
{
  "source": "DB (fresh)",
  "data": {"id": 1, "name": "Sample Data", "timestamp": "..."},
  "cacheAge": 0
}

Response (Second call - within TTL):
{
  "source": "Cache (fresh)",
  "data": {"id": 1, "name": "Sample Data", "timestamp": "..."},
  "cacheAge": 5
}
```

---

## Testing Procedures

### 1. Basic Functionality Test
```javascript
// Test sequence:
1. GET /api/xfetch → Source: "DB (fresh)"
2. GET /api/xfetch → Source: "Cache (fresh)"
3. Wait 65 seconds (beyond TTL of 60)
4. GET /api/xfetch → Source: Can vary (refresh triggered)
```

### 2. Single Request Test
```bash
# Click "Single Request" in React UI
# Observe:
# - First request: hits DB
# - Subsequent requests (within 60s): hit cache
# - Response times: <50ms for cache hits
```

### 3. Stampede Simulation
```bash
# Click "Simulate 10 Concurrent Requests" button
# Observe response patterns:

XFetch: 
  - All requests return in 50-200ms
  - Multiple DB queries observed (spread over time)
  - Demonstrates load distribution

Locks:
  - First request: <100ms (lock holder)
  - Other requests: 200-1000ms (waiting for refresh)
  - Single DB query observed
  - Demonstrates serialization

Stale-While-Revalidate:
  - All requests return in <50ms
  - Single DB query observed (background)
  - Demonstrates fast response + eventual consistency
```

### 4. Performance Validation
```bash
# Load test with Apache Bench
ab -n 1000 -c 100 http://localhost:6415/api/xfetch

# Expected metrics:
# - Requests per second: > 500
# - Average latency: < 100ms
# - Failed requests: 0
```

---

## Port Configuration

### Default Ports
- **Backend:** http://localhost:6415
- **Frontend:** http://localhost:3000 (main app)
- **Redis:** localhost:6379

### Changing Backend Port
```bash
# Edit .env
HTTP_PORT=6415

# Or override via environment variable
HTTP_PORT=6416 npm start
```

### Port Conflicts
If port is already in use:
```bash
# Find process using port 6415
lsof -i :6415

# Kill process (macOS/Linux)
kill -9 <PID>

# Or Windows
netstat -ano | findstr :6415
taskkill /PID <PID> /F
```

---

## Redis Configuration

### Local Redis Setup
```bash
# Install Redis (Homebrew - macOS)
brew install redis

# Start Redis server
brew services start redis

# Check status
brew services list | grep redis

# Stop Redis
brew services stop redis
```

### Docker Redis Setup
```bash
# Run Redis in Docker
docker run -d --name redis-cache -p 6379:6379 redis:latest

# Verify Redis is running
docker exec redis-cache redis-cli ping

# Stop Redis container
docker stop redis-cache
```

### Verify Redis Connection
```bash
# Test connection
redis-cli ping
# Expected: PONG

# Check database
redis-cli DBSIZE
# Shows number of keys

# Clear database (careful!)
redis-cli FLUSHDB
```

---

## Build for Production

### Production Build
```bash
# Ensure all dependencies are installed
npm ci  # Clean install (recommended for production)

# Set environment for production
NODE_ENV=production npm start
```

### Environment Variables for Production
```bash
# .env (production)
NODE_ENV=production
HTTP_PORT=6415
REDIS_HOST=redis.production.example.com
REDIS_PORT=6379
REDIS_PASSWORD=secure_password_here
CACHE_TTL=300
CACHE_MAXSTALE=60
LOG_LEVEL=info
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 6415
CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t cache-stampede:latest .
docker run -p 6415:6415 -e REDIS_HOST=host.docker.internal cache-stampede:latest
```

---

## Troubleshooting

### Issue: `ECONNREFUSED - Connection refused`
**Cause:** Redis is not running  
**Solution:**
```bash
# Verify Redis is running
redis-cli ping

# If not running, start it
redis-server

# Or check if already running on different port
redis-cli -p 6380 ping
```

### Issue: `EADDRINUSE - Port 6415 already in use`
**Cause:** Another process is using port 6415  
**Solution:**
```bash
# Find process using the port
lsof -i :6415

# Kill the process
kill -9 <PID>

# Or use a different port
HTTP_PORT=6416 npm start
```

### Issue: `Cannot find module 'express'`
**Cause:** Dependencies not installed  
**Solution:**
```bash
# Reinstall dependencies
npm install

# Clear npm cache if issues persist
npm cache clean --force
npm install
```

### Issue: `.env file not found`
**Cause:** Missing environment configuration  
**Solution:**
```bash
# Create .env from example
cp .env.example .env

# Verify file exists
ls -la .env

# Ensure required variables are set
cat .env
```

### Issue: CORS errors in React frontend
**Cause:** Frontend not on same origin as backend  
**Solution:**
```bash
# Verify backend is running on 6415
curl http://localhost:6415/api/xfetch

# Check .env CORS settings
# Backend automatically configured for http://localhost:3000
```

### Issue: Cache not clearing between tests
**Cause:** Previous cache data persists  
**Solution:**
```bash
# Clear cache via endpoint
curl -X POST http://localhost:6415/api/clear-cache

# Or clear entire Redis
redis-cli FLUSHDB

# Restart backend
npm start
```

### Issue: Network requests timing out
**Cause:** Backend not responding  
**Solution:**
```bash
# Check the server is running
curl http://localhost:6415/health

# Check logs for errors
npm start  # Run in foreground to see logs

# Verify Redis connectivity
redis-cli PING
```

### Issue: Concurrency simulation doesn't show stampede
**Cause:** Cache expires too slowly  
**Solution:**
```bash
# Reduce CACHE_TTL in .env
CACHE_TTL=5

# Restart server
npm start

# The stampede will happen more quickly
```

---

## Verification Checklist

### Pre-Launch Checklist
- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm 8+ installed (`npm --version`)
- [ ] Redis running (`redis-cli ping` returns PONG)
- [ ] Dependencies installed (`npm install` completed)
- [ ] `.env` file created from `.env.example`
- [ ] Port 6415 is available (`lsof -i :6415` shows nothing)
- [ ] All three strategy files exist (theory.md, server.js, App.jsx)

### Launch Verification
- [ ] Backend starts without errors (`npm start`)
- [ ] Server logs "Server running on http://localhost:6415"
- [ ] Redis connection shows as successful
- [ ] No error messages in console

### Functional Testing
- [ ] XFetch endpoint responds: `curl http://localhost:6415/api/xfetch`
- [ ] Lock endpoint responds: `curl http://localhost:6415/api/lock`
- [ ] Stale-while-revalidate endpoint responds: `curl http://localhost:6415/api/stale-while-revalidate`
- [ ] Clear cache works: `curl -X POST http://localhost:6415/api/clear-cache`

### Performance Testing
- [ ] Single request: <50ms
- [ ] Cache hit: <10ms
- [ ] DB query: <500ms
- [ ] 10 concurrent requests handled without errors

---

## Performance Tuning

### Optimize XFetch Parameters
```bash
# Adjust delta for earlier/later refresh
XFETCH_DELTA=5   # More frequent refreshes
XFETCH_DELTA=15  # Less frequent refreshes

# Recommended:
# - High-traffic (1000+ req/s): delta = 5-10
# - Medium-traffic (100-1000 req/s): delta = 10-15
# - Low-traffic (<100 req/s): delta = 15-20
```

### Optimize Lock Configuration
```bash
# Lock timeout (ms) - how long to wait for refresh
LOCK_TIMEOUT=5000     # 5 second timeout

# Lock TTL (ms) - how long lock is held
LOCK_TTL=10000        # 10 second maximum hold time

# Recommended:
# - If refresh takes ~1s: set timeout to 5000, TTL to 10000
# - If refresh takes ~100ms: set timeout to 1000, TTL to 2000
```

### Optimize Stale Window
```bash
# Stale window (seconds) - how long to serve stale data
CACHE_MAXSTALE=20     # 20 second stale window

# Recommended:
# - User-facing: 10-30 seconds
# - Dynamic data: 5-10 seconds
# - Real-time data: 0-5 seconds
```

### Memory Optimization
```bash
# Monitor Redis memory usage
redis-cli INFO memory

# If memory is high, reduce:
# - CACHE_TTL (shorter expiration)
# - CACHE_MAXSTALE (smaller stale window)
# - Number of cached keys

# Or increase Redis max memory
# In redis.conf:
# maxmemory 256mb
# maxmemory-policy allkeys-lru
```

---

## Next Steps

1. **Understand the Problem:** Read theory.md completely
2. **Test Each Strategy:** Use React UI to test all three
3. **Run Simulations:** Click "Simulate Stampede" button
4. **Compare Performance:** Note response times and DB hits
5. **Choose Strategy:** Decide which works best for your use case
6. **Implement:** Adapt code to your own caching layer
7. **Monitor:** Track metrics in production

---

## Support & Resources

### Documentation
- [Redis Documentation](https://redis.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)

### Debugging Tools
```bash
# Monitor Redis in real-time
redis-cli MONITOR

# View Redis keys
redis-cli KEYS "*"

# View specific key
redis-cli GET "cache:key-name"

# View all keys and values
redis-cli --scan --pattern "*"
```

### Getting Help
- Review error messages in console
- Check Redis connection with `redis-cli ping`
- Verify all .env variables are set
- Restart both Redis and server

---

**Module:** Cache Stampede Prevention (09)  
**Difficulty:** Intermediate  
**Estimated Time:** 2-3 hours  
**Last Updated:** 2024
