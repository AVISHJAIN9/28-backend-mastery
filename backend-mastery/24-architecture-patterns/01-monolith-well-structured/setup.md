# Setup Guide - Well-Structured Monolith

## Prerequisites
- Node.js 16+ 
- npm or yarn
- Code editor (VS Code recommended)
- Terminal/Command line

## Installation

### Step 1: Navigate to Module Directory
```bash
cd /path/to/24-architecture-patterns/01-monolith-well-structured
```

### Step 2: Install Dependencies
```bash
npm install
```

This installs:
- **express** - Web framework
- **cors** - Cross-origin requests
- **helmet** - Security headers
- **dotenv** - Environment variables

### Step 3: Create Environment File
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Backend
HTTP_PORT=6501
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000
```

## How to Run

### Start Development Server
```bash
npm run dev
```

This starts the server with `nodemon` (auto-restart on file changes):
```
listening on port 6501
```

### Start Production Server
```bash
npm start
```

### Verify Server is Running
```bash
curl http://localhost:6501/health
```

Expected response:
```json
{
  "status": "ok",
  "module": "01 Monolith Well Structured",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## How to Test

### Option 1: Using curl (Command Line)

#### Get All Users
```bash
curl http://localhost:6501/api/users
```

#### Get Specific User
```bash
curl http://localhost:6501/api/users/1
```

#### Create New User
```bash
curl -X POST http://localhost:6501/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }'
```

#### Update User
```bash
curl -X PUT http://localhost:6501/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "email": "john.updated@example.com"
  }'
```

#### Delete User
```bash
curl -X DELETE http://localhost:6501/api/users/1
```

### Option 2: Using Postman

1. Open Postman
2. Create requests for each endpoint:
   - GET http://localhost:6501/api/users
   - POST http://localhost:6501/api/users
   - PUT http://localhost:6501/api/users/:id
   - DELETE http://localhost:6501/api/users/:id

3. For POST/PUT, set Body > raw > JSON and add:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "role": "user"
}
```

### Option 3: Using React Testing UI

The module includes a React UI (`App.jsx`) for testing:

1. Install React dependencies at project root:
```bash
npm install react react-dom
```

2. Start a development server that serves both backend and frontend

3. Navigate to http://localhost:3000 to access testing UI

4. Use the UI to:
   - View all users
   - Create new user
   - Edit existing user
   - Delete user
   - See real-time responses

## Key Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /health | Health check |
| GET | /api/users | Get all users |
| GET | /api/users/:id | Get user by ID |
| POST | /api/users | Create new user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |
| GET | /api/status | Architecture status |

## Validation Rules

### User Creation/Update
- **name**: Required, 2-100 characters, string
- **email**: Required, valid email format, unique
- **role**: Optional, one of: `user`, `admin`, `moderator`
- **status**: Optional, one of: `active`, `inactive`, `suspended`

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Email must be valid"
    }
  ]
}
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 6501
lsof -ti:6501 | xargs kill -9

# Or change port in .env
HTTP_PORT=6502
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors
Ensure `FRONTEND_URL` in `.env` matches your frontend origin:
```env
FRONTEND_URL=http://localhost:3000
```

### Environment Variables Not Loading
```bash
# Verify .env file exists
ls -la .env

# Check NODE_ENV
echo $NODE_ENV
```

## Development Tips

### Hot Reload During Development
Use `npm run dev` which watches for changes:
```bash
npm run dev
# Edit a file and server will auto-restart
```

### Debugging with Node Inspector
```bash
node --inspect server.js
# Then open chrome://inspect in Chrome DevTools
```

### Testing Error Cases
Try invalid inputs to test validation:
```bash
# Missing required field
curl -X POST http://localhost:6501/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'

# Invalid email format
curl -X POST http://localhost:6501/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"invalid"}'

# Invalid user ID
curl http://localhost:6501/api/users/abc
```

## Next Steps

1. **Understand the code**
   - Read through `controller.js` to see business logic
   - Review `schema.js` for validation patterns
   - Check `middleware.js` for cross-cutting concerns

2. **Extend functionality**
   - Add new endpoints for orders, products
   - Implement role-based access control
   - Add database authentication

3. **Try other patterns**
   - Module 02: Microservices
   - Module 03: Modular Monolith
   - Module 07: Clean Architecture
