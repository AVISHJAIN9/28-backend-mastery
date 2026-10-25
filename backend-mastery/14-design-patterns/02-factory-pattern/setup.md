# Setup Guide - Factory Pattern Module

## Prerequisites
- Node.js 14+
- npm or yarn
- Basic knowledge of Express.js

## Installation

### 1. Install Dependencies
```bash
cd 02-factory-pattern
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env if needed (defaults work fine)
```

### 3. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:3002`

## Quick Test

### Test Vehicle Factory
```bash
curl -X POST http://localhost:3002/api/factory/create-vehicle \
  -H "Content-Type: application/json" \
  -d '{
    "type": "car",
    "brand": "Toyota",
    "model": "Camry",
    "year": 2024
  }'
```

### Test Notification Factory
```bash
curl -X POST http://localhost:3002/api/factory/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": "test@example.com",
    "subject": "Hello",
    "message": "This is a test"
  }'
```

### Health Check
```bash
curl http://localhost:3002/health
```

## Testing the Pattern

1. Create vehicles with different types (car, bike, truck)
2. Create loggers (console, file, database)
3. Send notifications via different channels
4. Observe how factory encapsulates creation logic

## Key Files to Review

- `factory.js` - Core factory implementations
- `controller.js` - Business logic using factories
- `routes.js` - API endpoints
- `App.jsx` - React UI for testing

## Common Issues

**Port Already in Use**
```bash
lsof -i :3002  # Find process
kill -9 <PID>  # Kill process
```

**Module Not Found**
```bash
rm -rf node_modules
npm install
```

## Next Steps

1. Modify factory.js to add new types
2. Add validation in schema.js
3. Extend controller.js with more operations
4. Test with React UI (App.jsx)

