# Setup Guide - Conditional Types & Infer

## Prerequisites
- Node.js 16+
- npm or yarn
- A code editor (VS Code recommended)

## Step 1: Install Dependencies

```bash
cd 08-conditional-types-infer
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
HTTP_PORT=13008
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## Step 3: Run the Server

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:13008
```

## Step 4: Understanding Conditional Types

Conditional types apply logic with ternary operators:

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>;  // true
type B = IsString<42>;       // false
```

## Step 5: Using Infer

Infer extracts types from complex structures:

```typescript
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Func = () => string;
type Ret = GetReturnType<Func>; // string
```

## Step 6: Test Endpoints

### Using cURL

**Get return type of function:**
```bash
curl http://localhost:13008/api/return-type
```

**Get array element type:**
```bash
curl http://localhost:13008/api/array-element
```

**Extract promise value:**
```bash
curl http://localhost:13008/api/promise-value
```

**Check type conditions:**
```bash
curl -X POST http://localhost:13008/api/check-type \
  -H "Content-Type: application/json" \
  -d '{"value":"hello"}'
```

### Using React UI
1. Open http://localhost:3000
2. Test conditional type logic
3. See infer in action with complex types

## Step 7: Verify Installation

Check that server is running:
```bash
curl http://localhost:13008/api/return-type | jq
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 13008 already in use | Change `HTTP_PORT` in `.env` |
| Module not found | Run `npm install` again |
| Conditional types not working | Ensure TypeScript 4.5+ installed |
