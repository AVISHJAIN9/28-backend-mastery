# Setup Guide - Declaration Merging & Extend Express

## Prerequisites
- Node.js 16+
- npm or yarn
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
cd 06-declaration-merging-extend-express
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
HTTP_PORT=13006
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Step 3: Run the Server

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:13006
```

## Step 4: Understanding Declaration Merging

Declaration merging allows extending types across declarations:

```typescript
// Declaration 1
interface Config {
  apiUrl: string;
}

// Declaration 2
interface Config {
  timeout: number;
}

// Result: Config has both properties
const config: Config = { apiUrl: '...', timeout: 5000 };
```

## Step 5: Extending Express Types

Example of augmenting Express Request:

```typescript
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      metadata?: Record<string, any>;
    }
  }
}
```

## Step 6: Test Endpoints

### Using cURL

**Get user with extended context:**
```bash
curl -H "X-User-ID: 1" http://localhost:13006/api/context
```

**Create with merged validation:**
```bash
curl -X POST http://localhost:13006/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com"}'
```

**Get config (merged declarations):**
```bash
curl http://localhost:13006/api/config
```

### Using React UI
1. Open http://localhost:3000
2. Test extended type features
3. See declaration merging in action

## Step 7: Verify Installation

Check that server is running:
```bash
curl http://localhost:13006/api/context
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 13006 already in use | Change `HTTP_PORT` in `.env` |
| Module not found | Run `npm install` again |
| Extended types not recognized | Check global namespace declarations |
