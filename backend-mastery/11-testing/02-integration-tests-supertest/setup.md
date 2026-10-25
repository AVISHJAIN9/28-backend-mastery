# Module 02: Integration Tests with Supertest - Setup Guide

## Quick Start (5 minutes)

```bash
# Install dependencies
npm install

# Start server
npm run dev

# Run tests
npm test

# Visit UI
open http://localhost:4002
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

**Key Packages:**

- `express` - Web framework
- `supertest` - HTTP assertions
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `joi` - Request validation
- `helmet` - Security headers
- `jest` - Testing framework

### 2. Environment Setup

Create `.env` file (or copy from `.env.example`):

```bash
cp .env.example .env
```

**Configuration:**

```env
HTTP_PORT=4002
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-change-in-production
DB_TIMEOUT=5000
API_TIMEOUT=10000
ENABLE_CLEANUP=true
LOG_LEVEL=debug
```

### 3. Start Development Server

```bash
npm run dev
```

Output:
```
Server running on http://localhost:4002
Press Ctrl+C to stop
```

### 4. Run Integration Tests

```bash
# Run all tests
npm test

# Run specific file
npm test routes.test.js

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## Testing Workflow

### Test Structure

```
Integration tests verify the complete request-response cycle:
Request → Middleware → Controller → Response

Not just unit tests of individual functions
```

### Common Test Scenarios

#### 1. Successful Request

```javascript
test('GET /api/users/:id returns user', async () => {
  const response = await request(app)
    .get('/api/users/1')
    .expect(200);
  
  expect(response.body).toHaveProperty('id', 1);
});
```

#### 2. Validation Error

```javascript
test('POST /api/users with invalid data', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ name: 'Bob' })  // Missing email
    .expect(400);
  
  expect(response.body.error).toContain('email');
});
```

#### 3. Authentication

```javascript
test('GET /api/secure/users requires token', async () => {
  const response = await request(app)
    .get('/api/secure/users')
    .expect(401);
});

test('GET /api/secure/users with valid token', async () => {
  const token = jwt.sign({ id: 1, role: 'admin' }, JWT_SECRET);
  
  const response = await request(app)
    .get('/api/secure/users')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
});
```

#### 4. Error Handling

```javascript
test('POST /api/users/batch with server error', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  
  const response = await request(app)
    .post('/api/users/batch')
    .send({ names: null })
    .expect(500);
  
  expect(response.body).toHaveProperty('error');
});
```

### Using the React UI

1. Navigate to `http://localhost:4002`
2. Use the interactive tabs to test endpoints
3. See real-time responses
4. Test authentication flows

**Tabs:**

- **Create User** - POST with validation
- **Get Users** - GET all users
- **Update User** - PUT request
- **Delete User** - DELETE with auth
- **Batch Operations** - Multiple requests
- **Error Scenarios** - 4xx, 5xx responses

### API Endpoints Reference

```
GET    /api/users                  - Get all users
GET    /api/users/:id              - Get user by ID
POST   /api/users                  - Create new user
PUT    /api/users/:id              - Update user
DELETE /api/users/:id              - Delete user

GET    /api/secure/users           - Secured endpoint (requires token)
POST   /api/login                  - Login (returns JWT token)
POST   /api/users/batch            - Batch create users
GET    /api/users/search?name=Bob - Search users
```

### Example cURL Commands

**Get all users:**
```bash
curl http://localhost:4002/api/users
```

**Create user:**
```bash
curl -X POST http://localhost:4002/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","password":"secure123"}'
```

**With authentication:**
```bash
# Login
TOKEN=$(curl -X POST http://localhost:4002/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"secure123"}' | jq -r '.token')

# Use token
curl http://localhost:4002/api/secure/users \
  -H "Authorization: Bearer $TOKEN"
```

## Understanding Integration Tests

### vs Unit Tests

| Unit Tests | Integration Tests |
|-----------|------------------|
| Test single function | Test full request→response |
| Fast | Slower |
| Isolated | Touches middleware, validation |
| Jest only | Jest + Supertest |

### What to Test

✅ **DO:**
- Full request-response
- Middleware execution
- Validation on routes
- Error handling
- Status codes
- Response shape

❌ **DON'T:**
- Internal function logic (unit tests)
- Database operations (DB tests)
- Every edge case (focus on integration points)

### Test File Organization

```
__tests__/
  ├── auth.test.js          - Login, token validation
  ├── users.test.js         - User CRUD operations
  ├── validation.test.js    - Request validation
  ├── errors.test.js        - Error scenarios
  └── middleware.test.js    - Custom middleware
```

## Debugging Tests

### Enable Debug Output

```bash
# Verbose output
npm test -- --verbose

# See failed tests details
npm test -- --listTests
```

### In Test File

```javascript
test('debug example', async () => {
  const response = await request(app).get('/api/users/1');
  
  console.log('Status:', response.status);
  console.log('Body:', response.body);
  console.log('Headers:', response.headers);
  
  expect(response.status).toBe(200);
});
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 4002
lsof -ti:4002 | xargs kill -9

# Or change port in .env
HTTP_PORT=4003
```

### Tests Timeout

Increase timeout in test:

```javascript
jest.setTimeout(10000);  // 10 seconds

test('long running request', async () => {
  // ...
}, 15000);  // 15 second timeout for this test
```

### JWT Token Issues

Ensure token is properly set:

```javascript
const token = jwt.sign(
  { id: 1, role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// Use it
.set('Authorization', `Bearer ${token}`)
```

### Validation Not Working

Check middleware order in server.js:

```javascript
app.use(express.json());
app.use(validateRequest);  // Must be after json()
```

## Performance Tips

### Cache Module Imports

```javascript
// At top of test file
const request = require('supertest');
const app = require('./server');
```

### Reuse Connections

```javascript
let server;

beforeAll(() => {
  server = app.listen(4002);
});

afterAll(() => {
  server.close();
});
```

### Parallel Testing

```bash
# Run tests in parallel
npm test -- --maxWorkers=4

# Or sequentially if flaky
npm test -- --maxWorkers=1
```

## Next Steps

1. ✅ Run the development server
2. ✅ Try test scenarios in React UI
3. ✅ Examine test files to understand patterns
4. ✅ Write your own integration tests
5. ✅ Add more endpoints and test them

## Resources

- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Jest Documentation](https://jestjs.io)
- [Express Testing](https://expressjs.com/en/guide/testing.html)
- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html#status.codes)

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Tests fail with "Cannot find module" | Run `npm install` |
| Port 4002 already in use | Change `HTTP_PORT` in `.env` |
| JWT validation fails | Check `JWT_SECRET` matches |
| Validation not catching errors | Ensure middleware runs before routes |
| Tests timeout | Increase `jest.setTimeout()` |
