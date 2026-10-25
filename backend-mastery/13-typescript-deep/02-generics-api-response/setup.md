# Setup Guide - Generics & API Response

## Prerequisites
- Node.js 16+
- npm or yarn
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
cd 02-generics-api-response
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
HTTP_PORT=13002
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Step 3: Run the Server

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:13002
```

## Step 4: Test Endpoints

### Endpoints Available
- `GET /api/users` - List all users (generic response)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `GET /api/products` - List all products (same generic pattern)
- `POST /api/products` - Create new product

### Using cURL

**Get users with generic response:**
```bash
curl http://localhost:13002/api/users
```

**Response format:**
```json
{
  "status": "success",
  "data": [...],
  "message": "Users retrieved"
}
```

**Get products (same generic pattern):**
```bash
curl http://localhost:13002/api/products
```

### Using React UI
1. Open http://localhost:3000
2. Test generic API responses
3. View how same pattern works for different types

## Step 5: Verify Installation

Check that server is running:
```bash
curl http://localhost:13002/api/users | jq
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 13002 already in use | Change `HTTP_PORT` in `.env` |
| Module not found | Run `npm install` again |
| Generic types not working | Check TypeScript version in package.json |
