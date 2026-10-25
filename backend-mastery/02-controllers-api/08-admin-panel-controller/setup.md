# Admin Panel Controller - Setup Guide

## Installation

```bash
# Install dependencies
npm install express joi uuid

# Copy environment file
cp .env.example .env
```

## Environment Variables

Configure `.env`:
```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
JWT_SECRET=your_jwt_secret_key_here
MAX_USERS=10000
MAINTENANCE_MODE=false
LOG_RETENTION_DAYS=90
ENABLE_2FA=true
ENABLE_API_KEYS=true
ENABLE_WEBHOOKS=true
ENABLE_RATE_LIMIT=true
```

## Running

```bash
# Development
npm start

# With watch mode
npm run dev

# Run tests
npm test
```

## Express Setup

```javascript
const express = require('express');
const adminRouter = require('./02-controllers-api/08-admin-panel-controller/routes');
const adminMiddleware = require('./02-controllers-api/08-admin-panel-controller/middleware');

const app = express();
app.use(express.json());

// Mock auth for development
app.use((req, res, next) => {
  req.user = { id: 'admin-1', role: 'admin' };
  next();
});

// Admin routes
app.use('/admin', adminMiddleware.requireAdmin, adminRouter);
app.use(adminMiddleware.errorHandler);

app.listen(3000, () => console.log('Admin panel running!'));
```

## Quick API Test

```bash
# Get dashboard
curl http://localhost:3000/admin/dashboard

# Create user
curl -X POST http://localhost:3000/admin/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# List users
curl http://localhost:3000/admin/users?page=1&limit=10
```

## See Also
- README.md for full API documentation
- theory.md for technical concepts
