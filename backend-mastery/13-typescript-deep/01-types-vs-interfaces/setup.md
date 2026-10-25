# Setup Guide - Types vs Interfaces

## Prerequisites
- Node.js 16+
- npm or yarn
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
cd 01-types-vs-interfaces
npm install
```

This installs:
- **express** - Web framework
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Security headers
- **winston** - Logging
- **dotenv** - Environment variables
- **nodemon** - Auto-reload during development

## Step 2: Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

The `.env` file contains:
```
HTTP_PORT=13001
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Step 3: Run the Server

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:13001
```

## Step 4: Test Endpoints

### Using cURL

**Get all users:**
```bash
curl http://localhost:13001/api/users
```

**Get user by ID:**
```bash
curl http://localhost:13001/api/users/1
```

**Create user:**
```bash
curl -X POST http://localhost:13001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com"}'
```

### Using React UI
1. Open http://localhost:3000
2. Interact with the test form
3. View API responses in real-time

## Step 5: Verify Installation

Check that server is running:
```bash
curl http://localhost:13001/health
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 13001 already in use | Change `HTTP_PORT` in `.env` |
| Module not found | Run `npm install` again |
| CORS errors | Check `FRONTEND_URL` in `.env` |
| Connection refused | Ensure server is running with `npm run dev` |
