# Snapshot Testing & API Stability - Theory

## What is Snapshot Testing?

Snapshot testing captures the actual output of a function/endpoint and saves it as a reference. Future runs are compared against this reference to catch unintended changes.

### Example

```javascript
// getUser(1) returns:
{
  "id": 1,
  "name": "Alice",
  "email": "alice@test.com",
  "createdAt": "2024-01-01T10:00:00Z",
  "roles": ["user", "admin"]
}

// Snapshot saved for comparison
// Later, if output changes, test fails automatically
```

## Why Snapshot Testing?

### Real-World Scenario

```javascript
// Accidental code change
function formatUser(user) {
  return {
    id: user.id,
    name: user.name.toUpperCase(),  // Oops! Accidentally added
    email: user.email
  };
}

// Without snapshots: Manual testing to find this
// With snapshots: Test immediately shows difference
```

## Jest Snapshots

### Basic Usage

```javascript
test('user data snapshot', () => {
  const user = getUser(1);
  expect(user).toMatchSnapshot();
});

// First run: Snapshot created
// Subsequent runs: Compared against snapshot
```

### Snapshot File

```javascript
// __snapshots__/users.test.js.snap
exports[`user data snapshot 1`] = `
{
  "id": 1,
  "name": "Alice",
  "email": "alice@test.com",
  "createdAt": "2024-01-01T10:00:00Z",
  "roles": [
    "user",
    "admin"
  ]
}
`;
```

## API Snapshots

### Test Endpoint Response

```javascript
test('GET /api/users/:id returns expected structure', async () => {
  const response = await request(app)
    .get('/api/users/1')
    .expect(200);
  
  expect(response.body).toMatchSnapshot();
});
```

### Capture Multiple Endpoints

```javascript
test('API contract snapshot', async () => {
  const users = await request(app).get('/api/users');
  const posts = await request(app).get('/api/posts');
  const comments = await request(app).get('/api/comments');
  
  expect({
    users: users.body,
    posts: posts.body,
    comments: comments.body
  }).toMatchSnapshot();
});
```

## Snapshot Serialization

### Customize Format

```javascript
test('user snapshot with custom serialization', () => {
  const user = getUser(1);
  
  expect({
    id: user.id,
    name: user.name,
    // Exclude timestamp
    role: user.role,
    active: user.active
  }).toMatchSnapshot();
});
```

### Normalize Timestamps

```javascript
test('API response with timestamps', () => {
  const response = apiCall();
  
  expect({
    ...response,
    createdAt: '<ISO_8601_DATETIME>',  // Normalize
    updatedAt: '<ISO_8601_DATETIME>'
  }).toMatchSnapshot();
});
```

## Snapshot Matchers

### Exact Match

```javascript
expect(data).toMatchSnapshot();
```

### Partial Match

```javascript
expect(data).toMatchSnapshot({
  createdAt: expect.any(String),
  id: expect.any(Number)
});
```

### Inline Snapshots

```javascript
test('user created successfully', () => {
  const user = createUser({ name: 'Bob' });
  
  expect(user).toMatchInlineSnapshot(`
    {
      "id": 1,
      "name": "Bob",
      "active": true
    }
  `);
});
```

## Snapshot Workflow

### Step 1: Create Snapshot

```bash
jest --updateSnapshot  # First run, creates snapshot
```

### Step 2: Review Changes

```javascript
// Test fails: snapshot mismatch
Expected: { name: 'Alice' }
Received: { name: 'ALICE' }  // Capitalized!

// Review: Is this change intentional?
```

### Step 3: Update if Intentional

```bash
jest -u  # Update snapshots if change is correct
git diff __snapshots__/*.snap  # Review changes
```

## Handling Flaky Data

### Problem: Dynamic Timestamps

```javascript
// Snapshot changes every run because timestamp is new
{
  "id": 1,
  "createdAt": "2024-01-01T10:00:00Z"  // Different every time
}
```

### Solution: Normalize Before Snapshot

```javascript
test('user with timestamp', () => {
  const user = getUser(1);
  
  const snapshot = {
    id: user.id,
    name: user.name,
    createdAt: expect.any(String)  // Any valid string
  };
  
  expect(snapshot).toMatchSnapshot();
});
```

### Better: Extract Dates

```javascript
test('user snapshot normalized', () => {
  const user = getUser(1);
  
  expect(user).toMatchSnapshot({
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    id: expect.any(Number)
  });
});
```

## API Stability Testing

### Contract Verification

```javascript
test('API maintains stable contract', () => {
  const response = call('/api/users/1');
  
  // Document expected fields
  expect(response).toHaveProperty('id');
  expect(response).toHaveProperty('name');
  expect(response).toHaveProperty('email');
  
  // And snapshot complete response
  expect(response).toMatchSnapshot();
});
```

### Detecting Breaking Changes

```javascript
test('removing field breaks snapshot', () => {
  // If code removes 'email' field:
  // { id: 1, name: 'Alice' }  // Missing email!
  // Snapshot test immediately fails
});
```

## Best Practices

1. **Review All Snapshots** - Check in git
2. **Commit Snapshots** - Part of version control
3. **Don't Over-Snapshot** - Use for complex outputs
4. **Normalize Flaky Data** - Timestamps, IDs, etc.
5. **Document Intent** - Why snapshot this?
6. **Keep Snapshots Small** - Easier to review
7. **Test Deliberately** - Not as replacement for assertions
8. **Review Changes** - Before updating snapshots
9. **Version API Contracts** - Different versions = different snapshots
10. **Monitor Snapshot Updates** - Frequent updates = problems

## Common Mistakes

### ❌ Over-Snapshotting

```javascript
// BAD - too generic
expect(anyData).toMatchSnapshot();

// GOOD - specific
expect(apiResponse).toMatchSnapshot();
expect(processedData).toMatchSnapshot();
```

### ❌ Ignoring Changes

```bash
# BAD - blindly update without reviewing
jest -u

# GOOD - check what changed first
jest --no-coverage
git diff __snapshots__/
jest -u
```

### ❌ Snapshotting Volatile Data

```javascript
// BAD - timestamp changes every run
expect({
  createdAt: new Date().toISOString()  // Always different
}).toMatchSnapshot();

// GOOD - normalize
expect({
  createdAt: expect.any(String)
}).toMatchSnapshot();
```

## Integration Example

```javascript
test('full API response chain', () => {
  // Setup
  const user = createUser({ name: 'Alice' });
  
  // Execute
  const response = request(app)
    .get(`/api/users/${user.id}`);
  
  // Verify structure hasn't changed
  expect(response.body).toMatchSnapshot();
  
  // Verify specific data is correct
  expect(response.body.name).toBe('Alice');
  expect(response.body.id).toBe(user.id);
});
```

## Snapshot Regression Example

```javascript
// Version 1: Original API
// { id, name, email }

// Version 2: Someone adds middleware
// { id, name, email, role }  // New field!

// Snapshot test catches it
// Expected: { id, name, email }
// Received: { id, name, email, role }

// This forces discussion: Is adding 'role' intentional?
```

## Conclusion

Snapshot testing is powerful for detecting unintended changes to API responses and complex outputs. Best used as:

1. **Change detector** - Catch breaking changes
2. **Documentation** - Show expected format
3. **Regression blocker** - Prevent accidental changes
4. **Not a substitute** - For specific assertions

Combine with regular tests to ensure both behavior and format stability.
