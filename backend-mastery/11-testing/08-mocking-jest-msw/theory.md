# Mocking HTTP with Jest & MSW - Theory

## HTTP Mocking Overview

HTTP mocking intercepts network requests and returns predefined responses, allowing tests to run without real backends.

### Benefits
- **Fast** - No network latency
- **Reliable** - No external dependencies  
- **Isolated** - Test code without backend
- **Offline** - Run tests anywhere
- **Error Simulation** - Easy to test failures

## Jest Built-in Mocking

### jest.mock() for Modules
```javascript
// api.js
export const fetchUser = (id) => {
  return fetch(`/api/users/${id}`).then(r => r.json());
};

// api.test.js
jest.mock('./api');

test('should use mocked API', async () => {
  const mockFetch = require('./api').fetchUser;
  mockFetch.mockResolvedValue({ id: 1, name: 'Alice' });
  
  const user = await fetchUser();
  expect(user.name).toBe('Alice');
});
```

### Mocking fetch
```javascript
global.fetch = jest.fn();

test('should mock fetch', async () => {
  fetch.mockResolvedValueOnce({
    json: async () => ({ id: 1, name: 'Alice' })
  });
  
  const response = await fetch('/api/users/1');
  const data = await response.json();
  
  expect(data.name).toBe('Alice');
});
```

## Mock Service Worker (MSW)

MSW intercepts requests at the network level, before they reach the actual network.

### Setup
```javascript
// handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/users/:id', (req, res, ctx) => {
    const id = req.params.id;
    return res(
      ctx.status(200),
      ctx.json({ id, name: 'Alice' })
    );
  }),
  
  rest.post('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ id: 1, ...req.body })
    );
  })
];

// server.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Response Handling
```javascript
// Success response
rest.get('/api/data', (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json({ data: 'value' })
  );
}),

// Error response
rest.post('/api/users', (req, res, ctx) => {
  if (!req.body.email) {
    return res(
      ctx.status(400),
      ctx.json({ error: 'Email required' })
    );
  }
  return res(ctx.json({ id: 1 }));
}),

// Network error
rest.delete('/api/users/:id', (req, res) => {
  return res.networkError('Failed to connect');
}),

// Delayed response
rest.get('/api/slow', (req, res, ctx) => {
  return res(
    ctx.delay(1000),
    ctx.json({ data: 'delayed' })
  );
})
```

### Request Inspection
```javascript
rest.post('/api/users', (req, res, ctx) => {
  // Get request body
  const { name, email } = req.body;
  
  // Get query params
  const id = req.url.searchParams.get('id');
  
  // Get headers
  const token = req.headers.get('Authorization');
  
  // Get cookies
  const sessionId = req.cookies.session;
  
  return res(ctx.json({ ...req.body, id: 1 }));
})
```

### Per-Test Overrides
```javascript
test('should handle user update error', async () => {
  // Override default handlers just for this test
  server.use(
    rest.put('/api/users/:id', (req, res, ctx) => {
      return res(
        ctx.status(500),
        ctx.json({ error: 'Update failed' })
      );
    })
  );
  
  await expect(updateUser(1, newData))
    .rejects.toThrow('Update failed');
});
```

## Comparison: Jest Mock vs MSW

| Aspect | Jest Mock | MSW |
|--------|-----------|-----|
| **Level** | Module | Network |
| **Import** | Jest only | Tests & Storybook |
| **Refactoring** | Mock breaks | Works with refactors |
| **Multi-endpoint** | Tedious | Easy |
| **Error simulation** | Good | Excellent |
| **Debugging** | OK | Great |

## Advanced Patterns

### Conditional Responses
```javascript
rest.post('/api/users', (req, res, ctx) => {
  if (req.body.email.includes('test')) {
    return res(
      ctx.status(400),
      ctx.json({ error: 'Invalid email' })
    );
  }
  return res(ctx.status(201), ctx.json({ id: 1 }));
})
```

### Dynamic Responses
```javascript
let userCount = 0;

rest.post('/api/users', (req, res, ctx) => {
  userCount++;
  return res(
    ctx.json({ id: userCount, ...req.body })
  );
})
```

### Database Simulation
```javascript
const users = new Map();

rest.post('/api/users', (req, res, ctx) => {
  const id = users.size + 1;
  users.set(id, { id, ...req.body });
  return res(ctx.json({ id }));
}),

rest.get('/api/users/:id', (req, res, ctx) => {
  const user = users.get(Number(req.params.id));
  if (!user) {
    return res(
      ctx.status(404),
      ctx.json({ error: 'Not found' })
    );
  }
  return res(ctx.json(user));
})
```

## Testing Async Requests

```javascript
test('should load user data', async () => {
  server.use(
    rest.get('/api/users', (req, res, ctx) => {
      return res(
        ctx.delay(100),
        ctx.json([{ id: 1, name: 'Alice' }])
      );
    })
  );
  
  const users = await fetchUsers();
  expect(users).toHaveLength(1);
});
```

## Error Testing

```javascript
test('should handle 500 error', async () => {
  server.use(
    rest.get('/api/data', (req, res, ctx) => {
      return res(
        ctx.status(500),
        ctx.json({ error: 'Server error' })
      );
    })
  );
  
  await expect(getData()).rejects.toThrow('Server error');
});
```

## Best Practices

1. **Centralize Handlers** - Keep all mocks in one place
2. **Mirror Reality** - Responses match actual APIs
3. **Use Per-Test Overrides** - Don't modify global handlers
4. **Test Error Cases** - 4xx, 5xx, network errors
5. **Verify Requests** - Check what was sent
6. **Clean Handlers** - Reset after each test
7. **Document Mocks** - Why each mock exists
8. **Delay Realistically** - Don't make tests instant
9. **Test Retries** - If API has retry logic
10. **Monitor Unhandled** - Warnings about unexpected requests

## Debugging Mocked Requests

```javascript
// Log all requests
server.listen({
  onUnhandledRequest: 'warn'  // Default behavior
});

// Enable request inspector in MSW
import { setupWorker, rest } from 'msw';
const worker = setupWorker(...handlers);
worker.start({
  onUnhandledRequest: 'bypass'  // Pass through unhandled
});
```

## Conclusion

Both Jest mocking and MSW are valuable - use Jest mocks for unit tests of individual modules, and MSW for integration and E2E tests where you need network-level interception. MSW is especially powerful for testing realistic scenarios without complex mock setup.

