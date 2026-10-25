# Integration Testing with Supertest - Theory & Concepts

## What is Integration Testing?

Integration testing verifies that multiple components of your application work together correctly. Unlike unit tests that test functions in isolation, integration tests exercise real interactions between modules, databases, APIs, and external services.

### Unit Testing vs Integration Testing

| Aspect | Unit Test | Integration Test |
|--------|-----------|------------------|
| **Scope** | Single function/method | Multiple components |
| **Speed** | Very fast | Slower |
| **Isolation** | Mocked dependencies | Real/Semi-real interactions |
| **Database** | Mocked | Real or test instance |
| **Network** | Mocked | Real HTTP requests |
| **Setup** | Simple | More complex |
| **Value** | Catches logic bugs | Catches interaction bugs |

### When to Use Integration Tests

Integration tests are essential when:
- Multiple modules depend on each other
- Testing API endpoints with real middleware
- Database operations need verification
- Authentication/authorization logic needs testing
- Error handling across multiple layers
- Real-world workflows like user registration -> email -> confirmation

## Supertest Overview

Supertest is an HTTP assertion library that makes testing Express.js apps straightforward.

### Key Features

```javascript
const request = require('supertest');
const app = require('./app');

// Test HTTP requests as if they were real
const res = await request(app)
  .post('/api/users')
  .send({ name: 'Alice', email: 'alice@test.com' })
  .expect(201)
  .expect('Content-Type', /json/);

console.log(res.body); // Response body
console.log(res.status); // Status code
console.log(res.headers); // Response headers
```

### Why Supertest?

1. **No Port Binding** - Tests run against your app object, not a live server
2. **Chainable API** - Fluent interface for readable tests
3. **Assertions** - Built-in `.expect()` for common assertions
4. **Cookies/Redirects** - Handles cookies, follows redirects
5. **File Upload** - Can test multipart/form-data uploads
6. **Real Middleware** - Tests actual middleware stack

## Integration Testing Patterns

### Pattern 1: Testing API Endpoints

```javascript
describe('POST /api/users', () => {
  test('should create user with valid data', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'SecurePass123!'
      })
      .expect(201)
      .expect('Content-Type', /json/);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Alice');
  });

  test('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Bob',
        email: 'invalid-email',
        password: 'SecurePass123!'
      })
      .expect(400);

    expect(res.body.error).toContain('email');
  });
});
```

### Pattern 2: Testing Workflows

A workflow test verifies multiple related operations:

```javascript
describe('User Registration Workflow', () => {
  let userId;

  test('1. Should register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Charlie',
        email: 'charlie@test.com',
        password: 'Password123!'
      })
      .expect(201);

    userId = res.body.id;
    expect(userId).toBeDefined();
  });

  test('2. Should login with created account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'charlie@test.com',
        password: 'Password123!'
      })
      .expect(200);

    expect(res.body.token).toBeDefined();
  });

  test('3. Should access protected route with token', async () => {
    // First login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'charlie@test.com',
        password: 'Password123!'
      });

    // Then use token on protected route
    await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .expect(200);
  });
});
```

### Pattern 3: Testing Error Handling

```javascript
describe('Error Handling', () => {
  test('should handle missing required fields', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'User' })
      .expect(400);

    expect(res.body.error).toBeDefined();
    expect(res.body.details).toBeInstanceOf(Array);
  });

  test('should handle database errors gracefully', async () => {
    // Assuming email must be unique
    await request(app)
      .post('/api/users')
      .send({
        name: 'Test',
        email: 'duplicate@test.com',
        password: 'Pass123!'
      });

    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Test2',
        email: 'duplicate@test.com',
        password: 'Pass123!'
      })
      .expect(409);

    expect(res.body.error).toContain('duplicate');
  });

  test('should return 404 for non-existent resources', async () => {
    await request(app)
      .get('/api/users/99999')
      .expect(404);
  });
});
```

### Pattern 4: Testing Middleware

```javascript
describe('Authentication Middleware', () => {
  test('should reject requests without token', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .expect(401);

    expect(res.body.error).toContain('token');
  });

  test('should reject requests with invalid token', async () => {
    await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  test('should allow authenticated requests', async () => {
    // Assuming you have a valid token
    const token = generateValidToken();
    
    await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

## API Testing Best Practices

### 1. Test Request Methods

```javascript
// GET - Retrieve data
await request(app).get('/api/users').expect(200);

// POST - Create data
await request(app).post('/api/users').send(data).expect(201);

// PUT - Update entire resource
await request(app).put('/api/users/1').send(data).expect(200);

// PATCH - Partial update
await request(app).patch('/api/users/1').send(partial).expect(200);

// DELETE - Remove resource
await request(app).delete('/api/users/1').expect(204);
```

### 2. Test Response Content-Type

```javascript
// JSON response
await request(app)
  .get('/api/users')
  .expect('Content-Type', /json/);

// HTML response  
await request(app)
  .get('/')
  .expect('Content-Type', /html/);
```

### 3. Test Response Headers

```javascript
await request(app)
  .post('/api/users')
  .send(data)
  .expect('X-Custom-Header', 'value')
  .expect('Cache-Control', 'no-store');
```

### 4. Test Response Body

```javascript
const res = await request(app)
  .get('/api/users/1');

// Assert specific properties
expect(res.body.id).toBeDefined();
expect(res.body.name).toBe('Alice');
expect(res.body.email).toContain('@');

// Assert object structure
expect(res.body).toEqual({
  id: expect.any(Number),
  name: expect.any(String),
  email: expect.any(String)
});
```

## Advanced Supertest Patterns

### Pattern 1: Using Cookies

```javascript
const agent = request.agent(app);

test('should maintain session', async () => {
  // Login sets cookie
  await agent
    .post('/api/login')
    .send({ username: 'user', password: 'pass' });

  // Cookie persists across requests
  const res = await agent
    .get('/api/profile')
    .expect(200);

  expect(res.body.username).toBe('user');
});
```

### Pattern 2: File Uploads

```javascript
test('should upload profile picture', async () => {
  const res = await request(app)
    .post('/api/profile/picture')
    .field('name', 'Avatar')
    .attach('file', '/path/to/image.jpg')
    .expect(200);

  expect(res.body.picturePath).toBeDefined();
});
```

### Pattern 3: Following Redirects

```javascript
test('should redirect to login', async () => {
  const res = await request(app)
    .get('/api/admin')
    .redirects(1) // Follow 1 redirect
    .expect(200);

  expect(res.request.url).toContain('/login');
});
```

### Pattern 4: Custom Assertions

```javascript
// Create custom assertion helper
const expectValidUser = (body) => {
  expect(body).toHaveProperty('id');
  expect(body).toHaveProperty('email');
  expect(body.email).toMatch(/@/);
  expect(body.createdAt).toBeDefined();
};

test('should return valid user', async () => {
  const res = await request(app).get('/api/users/1');
  expectValidUser(res.body);
});
```

## Common Integration Test Anti-Patterns

### ❌ Anti-Pattern 1: Shared State Between Tests

```javascript
// BAD - Tests depend on each other
let userId;

test('1. Create user', async () => {
  const res = await request(app)
    .post('/api/users')
    .send(userData);
  userId = res.body.id; // Shared!
});

test('2. Get user', async () => {
  // This test depends on test 1!
  await request(app).get(`/api/users/${userId}`);
});
```

**Solution:** Use `beforeEach`/`afterEach` to set up/tear down:

```javascript
// GOOD - Each test is independent
describe('User API', () => {
  let userId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/users')
      .send(userData);
    userId = res.body.id;
  });

  afterEach(async () => {
    await request(app)
      .delete(`/api/users/${userId}`);
  });

  test('should get user', async () => {
    await request(app)
      .get(`/api/users/${userId}`)
      .expect(200);
  });

  test('should update user', async () => {
    await request(app)
      .put(`/api/users/${userId}`)
      .send({ name: 'Updated' })
      .expect(200);
  });
});
```

### ❌ Anti-Pattern 2: Missing Error Cases

```javascript
// BAD - Only tests happy path
test('should get user', async () => {
  await request(app)
    .get('/api/users/1')
    .expect(200);
});

// GOOD - Tests multiple scenarios
describe('GET /api/users/:id', () => {
  test('should get existing user', async () => {
    await request(app)
      .get('/api/users/1')
      .expect(200);
  });

  test('should return 404 for non-existent user', async () => {
    await request(app)
      .get('/api/users/99999')
      .expect(404);
  });

  test('should reject invalid ID format', async () => {
    await request(app)
      .get('/api/users/not-a-number')
      .expect(400);
  });
});
```

### ❌ Anti-Pattern 3: Testing Implementation Details

```javascript
// BAD - Tests internal implementation
test('should call createUserInDatabase', async () => {
  const spy = jest.spyOn(db, 'query');
  
  await request(app)
    .post('/api/users')
    .send(userData);
  
  expect(spy).toHaveBeenCalledWith('INSERT INTO users...');
});

// GOOD - Tests the contract/behavior
test('should create user and return 201', async () => {
  const res = await request(app)
    .post('/api/users')
    .send(userData)
    .expect(201);

  expect(res.body.id).toBeDefined();
  expect(res.body.name).toBe(userData.name);
});
```

## Setting Up Integration Tests

### 1. Test Database Setup

```javascript
// setupTests.js
beforeAll(async () => {
  // Start test database
  await testDb.connect();
  await testDb.migrate(); // Run migrations
});

afterAll(async () => {
  await testDb.disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  await testDb.truncateTables();
});
```

### 2. Test Data Fixtures

```javascript
// fixtures/users.js
export const users = {
  alice: {
    name: 'Alice',
    email: 'alice@test.com',
    password: 'Password123!',
    age: 25
  },
  bob: {
    name: 'Bob',
    email: 'bob@test.com',
    password: 'SecurePass456!',
    age: 30
  }
};
```

### 3. Test Utilities

```javascript
// utils/testHelpers.js
export const createUser = async (overrides = {}) => {
  const res = await request(app)
    .post('/api/users')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123!',
      ...overrides
    });
  return res.body;
};

export const loginUser = async (email, password) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.token;
};
```

## Benefits of Integration Testing

1. **Catch Integration Bugs** - Unit tests miss issues across components
2. **Real-World Testing** - Tests actual usage patterns
3. **Middleware Validation** - Verifies complete request/response cycle
4. **API Contract Testing** - Ensures API meets expectations
5. **Regression Prevention** - Catches breaks between components
6. **Documentation** - Tests show how to use the API
7. **Confidence** - Know the whole system works together

## Integration Testing Trade-offs

| Advantage | Disadvantage |
|-----------|---------------|
| Catches real bugs | Slower to run |
| Real dependencies | Harder to debug |
| Tests workflows | More setup needed |
| API contracts | Fragile to changes |

## Best Practices

1. **Use Test Database** - Separate from production/development
2. **Clean State** - Reset between tests
3. **Mock External APIs** - Control external service behavior
4. **Test Real Paths** - Use actual middleware stack
5. **Test Both Success & Failure** - Happy and sad paths
6. **Use Meaningful Names** - Tests document behavior
7. **Avoid Sharing State** - Each test independent
8. **Keep Tests Fast** - Parallel execution when possible
9. **Test Edge Cases** - Boundary conditions matter
10. **Monitor Coverage** - Aim for 80%+ endpoint coverage

## Conclusion

Integration testing with Supertest bridges the gap between unit tests and end-to-end tests. By testing how components work together through real HTTP requests, you gain confidence that your application functions correctly in production conditions. Combined with unit tests and e2e tests, integration tests form a robust testing pyramid.

