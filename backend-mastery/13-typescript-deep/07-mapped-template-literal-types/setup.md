# Setup Guide - Mapped & Template Literal Types

## Prerequisites
- Node.js 16+
- npm or yarn
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
cd 07-mapped-template-literal-types
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
HTTP_PORT=13007
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Step 3: Run the Server

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:13007
```

## Step 4: Understanding Mapped Types

Mapped types iterate over object keys:

```typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K]
};

type User = { name: string; age: number };
type ReadonlyUser = Readonly<User>;
// { readonly name: string; readonly age: number }
```

## Step 5: Template Literal Types

Template literal types construct string type literals:

```typescript
type Events = 'click' | 'scroll' | 'submit';
type EventHandlers = `on${Capitalize<Events>}`;
// 'onClick' | 'onScroll' | 'onSubmit'
```

## Step 6: Test Endpoints

### Using cURL

**Get getters (mapped type):**
```bash
curl http://localhost:13007/api/user-getters
```

**Get event handlers (template literal):**
```bash
curl http://localhost:13007/api/handlers
```

**Get readonly config:**
```bash
curl http://localhost:13007/api/config
```

**Transform data with mapped types:**
```bash
curl -X POST http://localhost:13007/api/transform \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com"}'
```

### Using React UI
1. Open http://localhost:3000
2. Test mapped type transformations
3. See template literal types in action

## Step 7: Verify Installation

Check that server is running:
```bash
curl http://localhost:13007/api/handlers | jq
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 13007 already in use | Change `HTTP_PORT` in `.env` |
| Module not found | Run `npm install` again |
| Mapped type syntax errors | Ensure TypeScript 4.4+ installed |
