# Setup Guide - Utility Types: Partial, Pick, Omit

## Prerequisites
- Node.js 16+
- npm or yarn
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
cd 04-utility-types-partial-pick-omit
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
HTTP_PORT=13004
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Step 3: Run the Server

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:13004
```

## Step 4: Understanding Utility Types

Utility types transform existing types:

**Partial<T>** - Make all properties optional:
```typescript
type UserUpdate = Partial<User>; // All fields optional
```

**Pick<T, K>** - Select specific properties:
```typescript
type UserPreview = Pick<User, 'id' | 'name'>; // Only id and name
```

**Omit<T, K>** - Exclude specific properties:
```typescript
type UserCreate = Omit<User, 'id'>; // Everything except id
```

## Step 5: Test Endpoints

### Using cURL

**Get all users:**
```bash
curl http://localhost:13004/api/users
```

**Update user (partial):**
```bash
curl -X PATCH http://localhost:13004/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob"}'
```

**Get user preview (pick):**
```bash
curl http://localhost:13004/api/users/1/preview
```

**Create user (omit):**
```bash
curl -X POST http://localhost:13004/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com"}'
```

### Using React UI
1. Open http://localhost:3000
2. Test different utility type patterns
3. See type safety in action

## Step 6: Verify Installation

Check that server is running:
```bash
curl http://localhost:13004/api/users | jq
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 13004 already in use | Change `HTTP_PORT` in `.env` |
| Module not found | Run `npm install` again |
| Utility types syntax errors | Ensure TypeScript 4.0+ installed |
