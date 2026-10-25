# Setup Guide - Discriminated Unions

## Prerequisites
- Node.js 16+
- npm or yarn
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
cd 05-discriminated-unions
npm install
```

This installs:
- **express** - Web framework
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Security headers
- **dotenv** - Environment variables
- **nodemon** - Auto-reload during development

## Step 2: Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

The `.env` file contains:
```
HTTP_PORT=13005
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Step 3: Run the Server

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:13005
```

## Step 4: Understanding Discriminated Unions

Discriminated unions use a common field to narrow types:

```typescript
type Result = 
  | { ok: true; data: User }
  | { ok: false; error: string };

if (result.ok) {
  console.log(result.data); // TypeScript knows this exists
} else {
  console.log(result.error); // TypeScript knows this exists
}
```

## Step 5: Test Endpoints

### Using cURL

**Success response:**
```bash
curl http://localhost:13005/api/users/1
```

Response:
```json
{
  "ok": true,
  "data": { "id": 1, "name": "Alice" }
}
```

**Error response:**
```bash
curl http://localhost:13005/api/users/999
```

Response:
```json
{
  "ok": false,
  "error": "User not found"
}
```

**Create user:**
```bash
curl -X POST http://localhost:13005/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@test.com"}'
```

### Using React UI
1. Open http://localhost:3000
2. Test different response patterns
3. See type-safe error handling

## Step 6: Verify Installation

Check that server is running:
```bash
curl http://localhost:13005/api/users | jq
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 13005 already in use | Change `HTTP_PORT` in `.env` |
| Module not found | Run `npm install` again |
| Response format issues | Check discriminator field names |
