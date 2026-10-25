# 08 - Mocking HTTP with Jest & MSW

## Overview
Mock HTTP requests using Jest and Mock Service Worker for realistic API testing.

## What You'll Learn
- **MSW (Mock Service Worker)** - HTTP mocking
- **Request Handlers** - Intercepting requests
- **REST & GraphQL** - Both protocols
- **Error Simulation** - Mock failures
- **Jest Mocks** - Native mocking
- **Network Testing** - Without real API

## Key Concepts

### MSW Benefits
- Intercepts at network level
- No code changes needed
- Works in tests and storybook
- Handles REST & GraphQL
- Request/response inspection

### Jest Mocking
- Built-in jest.mock()
- Automatic mocking
- Manual mocking
- Module factories

## Common Patterns

### Mock Success
```javascript
rest.get('/api/users', (req, res, ctx) => {
  return res(ctx.json({ id: 1, name: 'Alice' }));
})
```

### Mock Error
```javascript
rest.post('/api/users', (req, res, ctx) => {
  return res(
    ctx.status(400),
    ctx.json({ error: 'Invalid data' })
  );
})
```

## Use Cases
1. Unit test with mocked API
2. Independent component testing  
3. Error scenario testing
4. Latency simulation
5. Edge case responses

## Quick Start
```bash
npm install msw
npm run dev
```

## Setup
1. Install MSW
2. Define handlers
3. Configure server
4. Use in tests
5. Debug with inspector

## Advanced Topics
- Conditional handlers
- Dynamic responses
- Request matching
- Response delay
- Multiple scenarios
