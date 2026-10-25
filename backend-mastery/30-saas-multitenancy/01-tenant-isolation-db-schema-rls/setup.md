# Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
```
Server runs on `http://localhost:4001`

### 3. Test with React UI
Navigate to `http://localhost:3000` (if React app is running)

Or use the included `preview.html` file

---

## Detailed Setup

### Prerequisites
- **Node.js** 16+
- **npm** 8+
- **PostgreSQL** 13+ (optional, demo uses mock DB)

### Environment Configuration
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
# For demo, defaults work fine
```

### Database Setup (PostgreSQL)

#### Option A: Docker PostgreSQL
```bash
# Start PostgreSQL container
docker run --name saas-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=saas_db \
  -p 5432:5432 \
  -d postgres:13

# Update .env with DB credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres
```

#### Option B: Local PostgreSQL Install
```bash
# Create database
psql -U postgres -c "CREATE DATABASE saas_db;"

# Initialize schema
psql -U postgres saas_db < schema.sql
```

#### Option C: Mock Database (Demo)
Default mode uses in-memory mock database. No PostgreSQL setup needed!

---

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Check Server is Running
```bash
curl http://localhost:4001/api/health
# Response: {"status":"ok","timestamp":"..."}
```

---

## Testing the API

### Method 1: Web UI
Open `preview.html` in browser and test through React UI

### Method 2: curl Commands

**Step 1: Login**
```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1"}'

# Response contains token
# Save: TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Step 2: Get Documents**
```bash
curl http://localhost:4001/api/documents \
  -H "Authorization: Bearer $TOKEN"
```

**Step 3: Create Document**
```bash
curl -X POST http://localhost:4001/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My Document",
    "content": "Some content",
    "is_public": false
  }'
```

**Step 4: Test RLS**
```bash
curl http://localhost:4001/api/test/rls \
  -H "Authorization: Bearer $TOKEN"

# Should show only current tenant's documents
# If it shows other tenant's docs: RLS not working!
```

---

## Docker Deployment

### Build Image
```bash
docker build -t saas-tenant-isolation .
```

### Run Container
```bash
docker run -p 4001:4001 \
  -e JWT_SECRET="your-secret" \
  saas-tenant-isolation
```

---

## Troubleshooting

### Issue: Port 4001 already in use
```bash
# Find and kill process on port 4001
lsof -i :4001
kill -9 <PID>

# Or change port
HTTP_PORT=4002 npm start
```

### Issue: Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: Token verification failed
- Check JWT_SECRET in .env
- Ensure token hasn't expired (demo tokens never expire)

### Issue: Database connection errors
- Verify PostgreSQL is running
- Check DB credentials in .env
- For mock mode, ensure DEMO_MODE=true

---

## Next Steps

1. **Study theory.md** - Understand RLS and multi-tenancy
2. **Review middleware.js** - How tenant extraction works
3. **Examine server.js** - Express setup
4. **Test with React UI** - Interact with API
5. **Modify code** - Add your own features
6. **Switch to real PostgreSQL** - Replace mock DB with actual database

---

## Files Overview

```
├── theory.md              # Deep dive into concepts
├── schema.js              # Database schema definitions
├── middleware.js          # Tenant extraction & RLS
├── controller.js          # Business logic
├── routes.js              # API routes
├── server.js              # Express server
├── App.jsx                # React testing UI
├── README.md              # Full documentation
├── package.json           # Dependencies
├── .env.example           # Environment template
├── setup.md               # This file
├── checklist.md           # Completion checklist
└── preview.html           # HTML preview
```

---

## Need Help?

See `README.md` for:
- Architecture explanation
- API endpoint documentation
- Security implementation details
- Troubleshooting guide
- Production checklist

## Environment Variables
## How to run
## How to test
