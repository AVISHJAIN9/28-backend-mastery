# Module 08: HTTP Mocking - Setup Guide

## Quick Start (5 minutes)

```bash
# Install dependencies
npm install

# Start server
npm run dev

# Run tests
npm test

# Visit UI
open http://localhost:4008
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

**Key Packages:**
- `msw` - Mock Service Worker for network interception
- `jest` - Testing framework
- `supertest` - HTTP testing

### 2. Environment Setup

Create `.env`:

```env
HTTP_PORT=4008
NODE_ENV=development
API_BASE_URL=http://localhost:4008
LOG_LEVEL=debug
```

### 3. MSW Setup

**Create MSW handlers:**

```javascript
// src/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([{ id: 1, name: 'Alice' }])
    );
  })
];
```

**Setup MSW server:**

```javascript
// src/mocks/server.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**Configure Jest:**

```javascript
// jest.setup.js
import { server } from './src/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 4. Start Server

```bash
npm run dev
```

### 5. Run Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Specific file
npm test api.test.js
```

## MSW Basics

### Request Mocking

```javascript
test('mock GET request', async () => {
  server.use(
    rest.get('/api/users/1', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ id: 1, name: 'Alice' })
      );
    })
  );
  
  const response = await fetch('/api/users/1');
  const data = await response.json();
  
  expect(data.name).toBe('Alice');
});
```

### Error Responses

```javascript
test('mock error response', async () => {
  server.use(
    rest.get('/api/users/999', (req, res, ctx) => {
      return res(
        ctx.status(404),
        ctx.json({ error: 'User not found' })
      );
    })
  );
  
  const response = await fetch('/api/users/999');
  expect(response.status).toBe(404);
});
```

### Network Errors

```javascript
test('mock network error', async () => {
  server.use(
    rest.get('/api/data', (req, res) => {
      return res.networkError('Network error');
    })
  );
  
  expect(() => fetch('/api/data')).rejects.toThrow();
});
```

### Request Inspection

```javascript
test('inspect request body', async () => {
  server.use(
    rest.post('/api/users', (req, res, ctx) => {
      const { name, email } = req.body;
      
      expect(name).toBe('Alice');
      expect(email).toBe('alice@test.com');
      
      return res(ctx.json({ id: 1, ...req.body }));
    })
  );
  
  await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice', email: 'alice@test.com' })
  });
});
```

## Testing Patterns

### CRUD Operations

```javascript
test('create, read, update, delete', async () => {
  // Create
  server.use(
    rest.post('/api/users', (req, res, ctx) => {
      return res(ctx.json({ id: 1, ...req.body }));
    })
  );
  
  // Read
  server.use(
    rest.get('/api/users/1', (req, res, ctx) => {
      return res(ctx.json({ id: 1, name: 'Alice' }));
    })
  );
  
  // Update
  server.use(
    rest.put('/api/users/1', (req, res, ctx) => {
      return res(ctx.json({ id: 1, ...req.body }));
    })
  );
  
  // Delete
  server.use(
    rest.delete('/api/users/1', (req, res, ctx) => {
      return res(ctx.status(204));
    })
  );
});
```

### Authentication

```javascript
test('request with auth header', async () => {
  server.use(
    rest.get('/api/secure', (req, res, ctx) => {
      const token = req.headers.get('Authorization');
      
      if (!token) {
        return res(
          ctx.status(401),
          ctx.json({ error: 'Unauthorized' })
        );
      }
      
      return res(ctx.json({ data: 'secret' }));
    })
  );
});
```

### Delayed Response

```javascript
test('mock slow response', async () => {
  server.use(
    rest.get('/api/slow', (req, res, ctx) => {
      return res(
        ctx.delay(1000),
        ctx.json({ data: 'delayed' })
      );
    })
  );
});
```

## React Component Testing

```javascript
test('fetch users component', async () => {
  server.use(
    rest.get('/api/users', (req, res, ctx) => {
      return res(
        ctx.json([
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ])
      );
    })
  );
  
  render(<UserList />);
  
  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Centralize Handlers** - Keep mocks organized
2. **Use Per-Test Overrides** - Don't modify global handlers
3. **Mirror Reality** - Responses match actual API
4. **Test Errors** - 4xx, 5xx, network errors
5. **Verify Requests** - Check what was sent
6. **Reset After Tests** - Clean up handlers

## Debugging

### Log Requests

```javascript
beforeEach(() => {
  server.listen({
    onUnhandledRequest: 'warn'  // Warn about unhandled requests
  });
});
```

### View Intercepted Requests

```javascript
test('debug request', async () => {
  server.use(
    rest.get('/api/users', (req, res, ctx) => {
      console.log('Intercepted request:', req.url.toString());
      console.log('Query params:', req.url.searchParams);
      console.log('Headers:', Object.fromEntries(req.headers));
      
      return res(ctx.json({}));
    })
  );
});
```

## Troubleshooting

### "Request not being mocked"

Check:
1. Handler registered in beforeAll
2. URL matches exactly
3. HTTP method correct (GET, POST, etc.)

### "Unhandled request"

```javascript
// Configure to warn or pass through
server.listen({
  onUnhandledRequest: 'warn'  // or 'bypass'
});
```

## Integration with React Testing Library

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('user interaction with mocked API', async () => {
  server.use(
    rest.post('/api/login', (req, res, ctx) => {
      return res(ctx.json({ token: 'abc123' }));
    })
  );
  
  render(<LoginForm />);
  
  await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'password');
  await userEvent.click(screen.getByRole('button', { name: /login/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
```

## Next Steps

1. ✅ Set up MSW handlers
2. ✅ Write first mocked test
3. ✅ Test error scenarios
4. ✅ Test with React components
5. ✅ Create complex mock scenarios

## Resources

- [MSW Documentation](https://mswjs.io)
- [MSW Handlers](https://mswjs.io/docs/api/setup-server/use)
- [Request Matching](https://mswjs.io/docs/api/request)
