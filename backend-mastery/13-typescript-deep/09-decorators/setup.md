# Setup Guide - Decorators

## Prerequisites
- Node.js 16+
- npm or yarn
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
cd 09-decorators
npm install
```

This installs:
- **express** - Web framework
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Security headers
- **dotenv** - Environment variables
- **nodemon** - Auto-reload during development
- **reflect-metadata** - Decorator metadata support

## Step 2: Enable Decorators

Decorators require TypeScript configuration. Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Step 3: Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

The `.env` file contains:
```
HTTP_PORT=13009
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Step 4: Run the Server

```bash
npm run dev
```

Expected output:
```
[LOG] Method called: getUser with args: [1]
[TIMER] getUser took 5ms
Server running on http://localhost:13009
```

## Step 5: Test Decorators

### Using cURL

**Get decorator info:**
```bash
curl http://localhost:13009/api/decorator-info
```

**Get user (will log and time):**
```bash
curl http://localhost:13009/api/users/1
```

Watch console for logs:
```
[LOG] Method called: getUser with args: [1]
[TIMER] getUser took 2ms
[LOG] Method returned: { id: 1, name: 'Alice', email: '...' }
```

**Create user:**
```bash
curl -X POST http://localhost:13009/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@test.com"}'
```

### React UI
1. Open http://localhost:3000
2. Test decorator features
3. Watch console logs
4. See timing information

## Step 6: Understanding Decorators

Decorators are functions that modify behavior:

```typescript
// Before call
const user = userService.getUser(1);

// With @LogMethod decorator:
// [LOG] Method called: getUser with args: [1]
// [LOG] Method returned: { ... }

// With @Timer decorator:
// [TIMER] getUser took 5ms
```

## Step 7: Common Decorator Patterns

**Logging Decorator:**
```typescript
function Log(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args) {
    console.log(`Called ${propertyKey} with`, args);
    return originalMethod.apply(this, args);
  };
}
```

**Timing Decorator:**
```typescript
function Timer(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args) {
    const start = Date.now();
    const result = originalMethod.apply(this, args);
    console.log(`${propertyKey} took ${Date.now() - start}ms`);
    return result;
  };
}
```

**Authentication Guard:**
```typescript
function Authenticated(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(req, res, ...args) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return originalMethod.apply(this, [req, res, ...args]);
  };
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 13009 already in use | Change `HTTP_PORT` in `.env` |
| Decorators not working | Enable `experimentalDecorators` in tsconfig.json |
| Module not found | Run `npm install` again |
| Console logs not appearing | Check that `reflect-metadata` is imported |
