# Module 12: Snapshot Testing - Setup Guide

## Quick Start (5 minutes)

```bash
# Install dependencies
npm install

# Start server
npm run dev

# Run tests
npm test

# Update snapshots if intentional
npm test -- -u
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

**Key Packages:**
- `jest` - Snapshot testing support built-in
- `supertest` - HTTP testing

### 2. Environment Setup

Create `.env`:

```env
HTTP_PORT=4012
NODE_ENV=test
LOG_LEVEL=debug
```

### 3. Start Server

```bash
npm run dev
```

### 4. Run Tests

```bash
# First run creates snapshots
npm test

# If changes are expected
npm test -- -u

# View snapshots
cat __snapshots__/api.test.js.snap
```

## Snapshot Basics

### First Test Run

```javascript
// api.test.js
test('user response structure', async () => {
  const response = await request(app)
    .get('/api/users/1');
  
  expect(response.body).toMatchSnapshot();
});
```

**First run:** Snapshot created in `__snapshots__/api.test.js.snap`

**Subsequent runs:** Response compared against snapshot

### Snapshot File

```javascript
// __snapshots__/api.test.js.snap
exports[`user response structure 1`] = `
{
  "id": 1,
  "name": "Alice",
  "email": "alice@test.com",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "active": true
}
`;
```

## Testing API Responses

### Simple Snapshot

```javascript
test('GET /api/users/:id', async () => {
  const response = await request(app).get('/api/users/1');
  expect(response.body).toMatchSnapshot();
});

test('POST /api/users', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({
      name: 'Bob',
      email: 'bob@test.com'
    });
  
  expect(response.body).toMatchSnapshot();
});
```

### Multiple Endpoints

```javascript
test('API contracts', async () => {
  const [users, posts, comments] = await Promise.all([
    request(app).get('/api/users'),
    request(app).get('/api/posts'),
    request(app).get('/api/comments')
  ]);
  
  expect({
    users: users.body,
    posts: posts.body,
    comments: comments.body
  }).toMatchSnapshot();
});
```

## Handling Dynamic Data

### Problem: Timestamps

```javascript
// Response includes current timestamp
{
  "id": 1,
  "createdAt": "2024-01-15T14:23:45.123Z"  // Different every run!
}
```

### Solution: Normalize

```javascript
test('user with timestamp', async () => {
  const response = await request(app).get('/api/users/1');
  
  expect(response.body).toMatchSnapshot({
    createdAt: expect.any(String)    // Accept any string
  });
});
```

### Solution: Extract Fields

```javascript
test('user snapshot', async () => {
  const response = await request(app).get('/api/users/1');
  
  const user = {
    id: response.body.id,
    name: response.body.name,
    email: response.body.email,
    // Skip timestamps
  };
  
  expect(user).toMatchSnapshot();
});
```

## Advanced Patterns

### Partial Snapshots

```javascript
test('user has required fields', async () => {
  const response = await request(app).get('/api/users/1');
  
  expect(response.body).toMatchSnapshot({
    id: expect.any(Number),
    name: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String)
  });
});
```

### Inline Snapshots

```javascript
test('login response', () => {
  const result = loginUser({ email: 'user@test.com', password: 'pass' });
  
  expect(result).toMatchInlineSnapshot(`
    {
      "token": "eyJhbGc...",
      "user": {
        "id": 1,
        "email": "user@test.com"
      }
    }
  `);
});
```

### Array Snapshots

```javascript
test('user list', async () => {
  const response = await request(app).get('/api/users');
  
  expect(response.body.map(u => ({
    id: u.id,
    name: u.name
  }))).toMatchSnapshot();
});
```

## Snapshot Workflow

### Step 1: Create Test

```javascript
test('API response', () => {
  const data = apiCall();
  expect(data).toMatchSnapshot();
});
```

### Step 2: First Run

```bash
npm test
# Snapshot created
```

### Step 3: Second Run

```bash
npm test
# Compared against snapshot
# Passes if unchanged
```

### Step 4: Change Detected

```bash
npm test
# FAIL: Snapshot mismatch
# Expected: { id: 1, name: 'Alice' }
# Received: { id: 1, name: 'alice' }  # lowercase!
```

### Step 5: Review

```bash
# Is this change intentional?
git diff __snapshots__/

# If yes:
npm test -- -u  # Update snapshot

# If no:
# Fix the bug, re-run
```

## Testing Strategies

### Detect Breaking Changes

```javascript
// API changed unexpectedly
test('API contract', async () => {
  const response = await request(app).get('/api/users/1');
  expect(response.body).toMatchSnapshot();
  // Snapshot test fails immediately if response changed
});
```

### Regression Testing

```javascript
test('order response format', async () => {
  const order = await createOrder({
    items: [{ id: 1, qty: 2 }]
  });
  
  expect(order).toMatchSnapshot();
  // Catches if order format changes unexpectedly
});
```

### Documentation

```javascript
test('API response example', async () => {
  const response = await request(app).get('/api/users');
  expect(response.body).toMatchSnapshot();
  // Snapshot file serves as API documentation
});
```

## Best Practices

1. **Review Before Updating** - Check git diff first
2. **Commit Snapshots** - Include in version control
3. **Keep Snapshots Small** - Easier to review
4. **Normalize Volatile Data** - Timestamps, IDs
5. **Document Intent** - Why snapshot this?
6. **Don't Over-Snapshot** - Use for complex objects
7. **Monitor Updates** - Frequent updates = problems
8. **Test Deliberately** - Not as replacement for assertions

## Handling Updates

### Review Changes

```bash
# See what changed
git diff __snapshots__/

# Looks good?
npm test -- -u  # Update all

# Or specific file
npm test api.test.js -- -u
```

### Staged Snapshots

```bash
# Save current snapshot
cp __snapshots__/api.test.js.snap api.snap.old

# Update
npm test -- -u

# Compare
diff api.snap.old __snapshots__/api.test.js.snap
```

## Common Issues

### "Snapshot Mismatch"

Options:
1. Fix code if bug
2. Update snapshot if intentional
3. Normalize if dynamic data

### "Snapshots Not Updating"

```bash
# Use -u flag
npm test -- -u

# Or in interactive mode
npm test -- --interactive
# Then press 'u' for update
```

### "Too Many Differences"

Means significant change. Review carefully:

```bash
git diff __snapshots__/  # See all differences
npm test -- --testNamePattern='specific'  # Test one first
npm test -- -u  # Then update
```

## API Stability Example

```javascript
// Catch unintended changes
test('user API stable contract', async () => {
  const response = await request(app).get('/api/users/1');
  
  // Snapshot enforces
  // - All fields present
  // - No extra fields
  // - Correct data types
  // - Structure never changes unexpectedly
  expect(response.body).toMatchSnapshot({
    id: expect.any(Number),
    createdAt: expect.any(String)
  });
});
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
  
# Snapshots checked in, so diffs visible in PR
- uses: actions/upload-artifact@v2
  if: failure()
  with:
    name: snapshots
    path: __snapshots__/
```

## Next Steps

1. ✅ Write first snapshot test
2. ✅ Generate snapshots
3. ✅ Review snapshot file
4. ✅ Intentionally change API
5. ✅ See snapshot test fail
6. ✅ Update snapshot

## Resources

- [Jest Snapshots](https://jestjs.io/docs/snapshot-testing)
- [Jest Inline Snapshots](https://jestjs.io/docs/snapshot-testing#inline-snapshots)
- [Snapshot Testing Best Practices](https://github.com/testingjavascript/jest-dom/blob/main/TUTORIAL.md)

