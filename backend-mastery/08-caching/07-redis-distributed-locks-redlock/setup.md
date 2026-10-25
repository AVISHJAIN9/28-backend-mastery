# Setup Guide

## Prerequisites
- Node.js 16+
- npm or yarn
- Redis 6.0+
- MongoDB (if module uses database)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update .env with your configuration:
```bash
HTTP_PORT=6411
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Local Development

Start Redis first (if not already running):
```bash
redis-server
```

Run the development server:
```bash
npm run dev
```

Server will start with hot reload via nodemon.

Open Frontend:
```bash
npm start
```

## Production

```bash
npm start
```

## Testing

### Via React UI
Open http://localhost:3000 in browser to test all endpoints interactively.

### Via cURL
```bash
# Health check
curl http://localhost:6411/health

# API endpoints (check README for specifics)
curl http://localhost:6411/api/test
```

### Module Testing Checklist
- [ ] Backend server starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] All test buttons work in UI
- [ ] Redis connection successful
- [ ] No error logs in console

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -ti:6411 | xargs kill -9

# Or use different port in .env
HTTP_PORT=6411
```

### Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping
# Should respond: PONG

# Start Redis if not running
redis-server

# Check Redis config
redis-cli INFO server
```

### Dependencies Issue
```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading
- Ensure .env file exists in root directory
- Check file has no BOM (Byte Order Mark)
- Restart server after changing .env
- Use: `cat .env` to verify content

### Frontend Build Issues
```bash
# Clear cache
rm -rf build node_modules/.cache

# Rebuild
npm run build
```

## Stack Information

- **Backend:** Express.js + Redis (with Redlock)
- **Frontend:** React 18
- **Database:** In-memory (mock) or MongoDB
- **Caching:** Redis (in-memory data store)
- **Locking:** Redlock for distributed locks
- **Port Pattern:** 6401-6414 (backend), 3000 (frontend)

## Next Steps

1. Read [README.md](./README.md) for concept overview
2. Study [theory.md](./theory.md) for detailed patterns
3. Check [checklist.md](./checklist.md) for learning goals
4. Explore code in App.jsx and server.js
