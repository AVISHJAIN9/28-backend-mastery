# Setup & Installation Guide - Database Migrations: Prisma & Drizzle

## Prerequisites

- Node.js 14+
- npm or yarn
- Required database/service running
- 2GB RAM minimum

---

## Step 1: Install Dependencies

```bash
cd 06-db-migrations-prisma-drizzle
npm install
```

**Dependencies installed:**
- express
- mongoose (or relevant driver)
- joi
- helmet
- cors
- dotenv
- winston

---

## Step 2: Configure Environment

Create `.env` from template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
HTTP_PORT=5106
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=your_database_connection_string
LOG_LEVEL=info
```

---

## Step 3: Setup Database

### Option A: Local Installation
[Database-specific instructions]

### Option B: Docker
```bash
docker run -d -p 5432:5432 postgres:latest
```

### Option C: Cloud Service
Use your cloud provider's managed database service

---

## Step 4: Initialize Database

```bash
npm run init-db
```

This creates sample data and indexes.

---

## Step 5: Start Server

```bash
npm start
```

Expected output:
```
✓ Database connection established
✓ Server running on http://localhost:5106
✓ Routes registered
```

---

## Step 6: Test API

### Using curl
```bash
curl http://localhost:5106/api/health
```

### Using Python
```python
import requests
r = requests.get('http://localhost:5106/api/resources')
print(r.json())
```

---

## Troubleshooting

### Connection Refused
- Verify database is running
- Check connection string
- Verify credentials

### Port Already in Use
```bash
# Find process using port
lsof -i :5106
# Kill process
kill -9 <PID>
```

### Timeout Errors
- Increase timeout in .env
- Check database performance
- Monitor network connectivity

---

## Advanced Configuration

### Connection Pooling
```env
DATABASE_POOL_SIZE=20
DATABASE_POOL_TIMEOUT=5000
```

### Logging
```env
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

---

## Next Steps

1. ✓ Environment setup complete
2. ✓ Database configured
3. ✓ Server running
4. **Next**: Read `theory.md` for concepts
5. **Then**: Explore API in README.md
6. **Finally**: Run React UI tests

---

## Support

- Check logs for error details
- Review theory.md for concepts
- Consult README.md for API docs
- Test with provided React UI
