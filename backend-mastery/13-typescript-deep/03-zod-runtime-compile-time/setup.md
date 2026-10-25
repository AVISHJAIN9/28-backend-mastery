# Setup Guide - Zod Runtime & Compile-time Validation

## Prerequisites
- Node.js 16+
- npm or yarn
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
cd 03-zod-runtime-compile-time
npm install
```

This installs:
- **express** - Web framework
- **zod** - Schema validation library
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
HTTP_PORT=13003
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Step 3: Run the Server

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:13003
```

## Step 4: Understanding Zod Validation

Zod provides:
- **Runtime validation** - Check data at request time
- **Type extraction** - Generate TypeScript types automatically
- **Error reporting** - Detailed validation error messages

### Example Schema
```typescript
const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(0).max(150).optional()
});

type User = z.infer<typeof userSchema>; // Extract type
```

## Step 5: Test Endpoints

### Using cURL

**Valid POST:**
```bash
curl -X POST http://localhost:13003/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com"}'
```

**Invalid POST (email validation fails):**
```bash
curl -X POST http://localhost:13003/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"not-an-email"}'
```

Expected error response:
```json
{
  "error": "Validation failed",
  "details": [{"message": "Invalid email"}]
}
```

### Using React UI
1. Open http://localhost:3000
2. Test valid and invalid inputs
3. See validation errors in real-time

## Step 6: Verify Installation

Check Zod is working:
```bash
curl http://localhost:13003/api/validate
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 13003 already in use | Change `HTTP_PORT` in `.env` |
| Module not found | Run `npm install` again |
| Validation not working | Check zod version in package.json |
