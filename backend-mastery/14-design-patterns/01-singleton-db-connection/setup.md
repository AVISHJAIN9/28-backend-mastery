# Setup Guide - Singleton Pattern

## 📦 Prerequisites

- Node.js 14+ (v16+ recommended)
- npm 6+ or yarn
- Basic JavaScript knowledge
- Understanding of async/await

## 🔧 Installation

### Step 1: Install Dependencies

```bash
cd 01-singleton-db-connection
npm install
```

This installs:
- **express** - Web framework
- **cors** - Cross-origin support
- **helmet** - Security headers
- **dotenv** - Environment variables
- **nodemon** - Auto-restart during development

### Step 2: Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file:
```env
HTTP_PORT=5601
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_POOL_SIZE=5
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Server starts at `http://localhost:5601`

### Production Mode

```bash
npm start
```

## 🧪 Testing

### Test Connection Status

```bash
curl http://localhost:5601/api/connection/status
```

Expected response:
```json
{
  "status": "disconnected",
  "isConnected": false,
  "connectionTime": null
}
```

### Test Connect Endpoint

```bash
curl -X POST http://localhost:5601/api/connection/connect
```

Expected response:
```json
{
  "success": true,
  "message": "Connected to database",
  "status": "connected"
}
```

### Test User Operations

```bash
# Get all users
curl http://localhost:5601/api/users

# Create new user
curl -X POST http://localhost:5601/api/users \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'

# Get specific user
curl http://localhost:5601/api/users/1

# Update user
curl -X PUT http://localhost:5601/api/users/1 \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "John Updated"
  }'

# Delete user
curl -X DELETE http://localhost:5601/api/users/1
```

## 🎨 Frontend Testing

The React UI at `http://localhost:3000` provides:

1. **Connection Manager**
   - Check connection status
   - Connect/disconnect database
   - View connection details

2. **User CRUD Interface**
   - Create new users
   - View user list
   - Update existing users
   - Delete users

3. **Instance Monitor**
   - Verify singleton behavior
   - Check if same instance is used

4. **Console Logs**
   - See all API calls
   - View error messages

## 📝 File Descriptions

| File | Purpose |
|------|----------|
| `server.js` | Express setup, middleware, routes |
| `routes.js` | API route definitions |
| `controller.js` | Business logic handlers |
| `middleware.js` | Custom middleware functions |
| `schema.js` | Data validation schemas |
| `App.jsx` | React testing UI |
| `.env.example` | Environment variable template |
| `package.json` | Dependencies and scripts |

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5601
lsof -ti:5601 | xargs kill -9

# Or change port in .env
HTTP_PORT=5602
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Nodemon Not Working

```bash
# Install globally
npm install -g nodemon

# Or use npx
npx nodemon server.js
```

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] `.env` file created and configured
- [ ] Server starts without errors
- [ ] Health check returns status
- [ ] Can connect to database
- [ ] Can create/read/update/delete users
- [ ] React UI loads successfully
- [ ] All console logs are clean

## 📚 Next Steps

1. Read `theory.md` thoroughly
2. Examine `server.js` implementation
3. Test all endpoints via cURL or UI
4. Modify code to understand behavior
5. Run with multiple requests
6. Verify only one instance is created

## 🤝 Support

If you encounter issues:

1. Check `.env` configuration
2. Verify Node.js version: `node --version`
3. Check port availability: `lsof -ti:5601`
4. Review console error messages
5. Check `theory.md` for pattern explanation
