# Setup Guide - Soft Delete Pattern

## Prerequisites

- **Node.js** 16+ ([Download](https://nodejs.org))
- **npm** 7+ (comes with Node)
- **curl** or Postman for testing
- **Code Editor** (VS Code recommended)

## Step 1: Installation

### Clone or Navigate to Module

```bash
cd 28-real-world-patterns/01-soft-delete-deleted-at-restore
```

### Install Dependencies

```bash
npm install
```

**Installed Packages:**
- `express` - Web framework
- `joi` - Data validation
- `winston` - Logging
- `cors` - Cross-origin requests
- `helmet` - Security headers

## Step 2: Environment Configuration

### Create .env File

```bash
# Copy example file
cp .env.example .env
```

### Edit .env File

```bash
# .env
NODE_ENV=development
HTTP_PORT=4001
REACT_PORT=3001
LOG_LEVEL=info
```

## Step 3: Start the Backend Server

### Development Mode

```bash
npm start
```

**Output:**
```
Server running on http://localhost:4001
GET  /api/secure/users
POST /api/secure/users
GET  /api/secure/users/:id
PATCH /api/secure/users/:id
DELETE /api/secure/users/:id
POST /api/secure/users/:id/restore
```

### Verify Server is Running

```bash
curl http://localhost:4001/api/secure/users
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Alice Johnson", "email": "alice@test.com", "deleted_at": null },
    { "id": 2, "name": "Bob Smith", "email": "bob@test.com", "deleted_at": null }
  ],
  "message": "Retrieved 2 active users"
}
```

## Step 4: Test API Endpoints

### 4.1 List Active Users

```bash
curl http://localhost:4001/api/secure/users
```

### 4.2 Get Single User

```bash
curl http://localhost:4001/api/secure/users/1
```

### 4.3 Create New User

```bash
curl -X POST http://localhost:4001/api/secure/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "role": "user"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "John Doe",
    "email": "john@test.com",
    "role": "user",
    "deleted_at": null,
    "created_at": "2024-03-29T10:00:00Z"
  },
  "message": "User created successfully"
}
```

### 4.4 Soft Delete User

```bash
curl -X DELETE http://localhost:4001/api/secure/users/4
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "John Doe",
    "email": "john@test.com",
    "deleted_at": "2024-03-29T10:05:00Z"
  },
  "message": "User soft-deleted successfully. Can be restored with restore endpoint."
}
```

### 4.5 Verify Deletion (Should Return 404)

```bash
curl http://localhost:4001/api/secure/users/4
```

**Response:**
```json
{
  "error": "User has been deleted"
}
```

### 4.6 Restore Deleted User

```bash
curl -X POST http://localhost:4001/api/secure/users/4/restore
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "John Doe",
    "email": "john@test.com",
    "deleted_at": null,
    "restored_at": "2024-03-29T10:07:00Z"
  },
  "message": "User restored successfully"
}
```

### 4.7 Get Audit Trail

```bash
curl http://localhost:4001/api/secure/users/4/audit-trail
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "email": "john@test.com",
    "created_at": "2024-03-29T10:00:00Z",
    "deleted_at": "2024-03-29T10:05:00Z",
    "restored_at": "2024-03-29T10:07:00Z",
    "is_active": true,
    "status": "ACTIVE"
  }
}
```

### 4.8 List Deleted Users (Admin)

```bash
curl http://localhost:4001/api/admin/deleted-users
```

## Step 5: Vulnerable Endpoints (Educational)

### ⚠️ WARNING: These demonstrate security issues

### 5.1 List All Users (Including Deleted)

```bash
curl http://localhost:4001/api/vulnerable/users
```

**Problem:** Returns deleted users!

### 5.2 Get Deleted User Data

```bash
curl http://localhost:4001/api/vulnerable/users/4
```

**Problem:** Returns deleted user info without filtering!

### 5.3 Hard Delete (Permanent)

```bash
curl -X DELETE http://localhost:4001/api/vulnerable/users/4/hard-delete
```

**Problem:** Permanently removes user - can't be restored!

## Step 6: Test with React UI

### Start Frontend Dev Server

```bash
npm run dev
# or
npm run client
```

Opens on `http://localhost:3001`

### UI Features:
- List active users
- Create new user
- Soft delete user
- Restore user
- View audit trail
- Compare with vulnerable endpoints

## Step 7: Run Tests

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Test Coverage

```bash
npm run test:coverage
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 4001
# macOS/Linux
lsof -ti:4001 | xargs kill -9

# Windows
netstat -ano | findstr :4001
taskkill /PID <PID> /F
```

### CORS Errors

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:** Check .env file
```bash
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

### Module Not Found Errors

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues

The demo uses in-memory data, so no external DB needed.

If using real database:
```bash
# Check connection
npm run db:connect
```

## Advanced Setup

### With PostgreSQL

```bash
# Install postgres driver
npm install pg sequelize

# In .env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=soft_delete_db
```

### With MongoDB

```bash
# Install mongodb driver
npm install mongodb mongoose

# In .env
MONGODB_URI=mongodb://localhost:27017/soft-delete
```

### With Real Logging Service

```bash
# Install datadog or similar
npm install dd-trace

# In middleware.js
const tracer = require('dd-trace');
```

## Project Structure

```
01-soft-delete-deleted-at-restore/
├── controller.js       # Business logic (285 lines)
├── middleware.js       # Validation & error handling (65 lines)
├── routes.js          # Express routes (52 lines)
├── schema.js          # Joi schemas (32 lines)
├── App.jsx            # React component (270 lines)
├── server.js          # Express app setup (40 lines)
├── package.json       # Dependencies
├── .env.example       # Configuration template
├── README.md          # Overview
├── theory.md          # Technical deep-dive
├── setup.md           # This file
└── checklist.md       # Implementation guide
```

## Next Steps

1. ✅ Understand soft delete concept (read theory.md)
2. ✅ Run simple CRUD operations
3. ✅ Trigger soft delete and restore
4. ✅ View audit trails
5. ✅ Compare with vulnerable approach
6. ✅ Implement in your own project
7. ✅ Add retention policies
8. ✅ Set up automated cleanup

## Quick Reference

| Operation | Command |
|-----------|---------|
| Start server | `npm start` |
| List active users | `GET /api/secure/users` |
| Get user | `GET /api/secure/users/1` |
| Create user | `POST /api/secure/users` |
| Soft delete | `DELETE /api/secure/users/1` |
| Restore | `POST /api/secure/users/1/restore` |
| Audit trail | `GET /api/secure/users/1/audit-trail` |
| List deleted | `GET /api/admin/deleted-users` |

## Common Commands

```bash
# Development
npm start              # Start server
npm run dev           # Start with auto-reload
npm test             # Run tests

# Database
npm run db:init      # Initialize database
npm run db:seed      # Seed test data
npm run db:reset     # Reset database

# Deployment
npm run build        # Production build
npm run start:prod   # Start production server
```

---

**Total Setup Time:** 5-10 minutes  
**Difficulty:** Beginner  
**Next:** Read theory.md for deeper understanding

## Environment Variables
## How to run
## How to test
