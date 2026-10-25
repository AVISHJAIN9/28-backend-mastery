# Test Doubles: Mocks, Stubs & Spies - Theory

## Introduction to Test Doubles

A test double is a term used for any object that stands in for a real object during testing. Just like stunt doubles stand in for actors, test doubles replace external dependencies that make tests slow, unreliable, or complex.

## Types of Test Doubles

### 1. Stubs

A stub provides predefined responses without actually doing anything. It replaces a method to return a specific value.

```javascript
// Example: Stubbing a database query
const stub = jest.fn().mockReturnValue({
  id: 1,
  name: 'Alice',
  email: 'alice@test.com'
});

// When called, returns the predefined value
const user = stub();
expect(user.name).toBe('Alice');
```

**When to use:**
- Simple return values needed
- Want to control specific returns
- Testing without side effects

### 2. Mocks

A mock is a fully faked object with behavior configured for the test. It tracks how it's been used.

```javascript
// Example: Mocking a database service
const mockDatabase = {
  save: jest.fn().mockResolvedValue({ id: 1 }),
  delete: jest.fn().mockResolvedValue(true),
  query: jest.fn()
};

// Use in test
await mockDatabase.save(userData);

// Verify interactions
expect(mockDatabase.save).toHaveBeenCalledWith(userData);
expect(mockDatabase.save).toHaveBeenCalledTimes(1);
```

**When to use:**
- Need to verify behavior
- Complex object replacement
- Multiple interactions
- Tracking call patterns

### 3. Spies

A spy wraps an existing function, tracking how it's called without changing behavior.

```javascript
// Example: Spying on an existing function
const obj = {
  getValue: () => 42
};

const spy = jest.spyOn(obj, 'getValue');
const result = obj.getValue();

expect(spy).toHaveBeenCalled();
expect(result).toBe(42);
spy.mockRestore(); // Clean up
```

**When to use:**
- Monitoring real implementations
- Tracking calls without mocking
- Partial mocking
- Verify side effects

### 4. Fakes

A fake is a working implementation that's suitable for testing but not production.

```javascript
// Real implementation
class ProductionDatabase {
  save(data) {
    // Connect to real database
  }
}

// Fake for testing
class FakeDatabase {
  constructor() {
    this.data = {};
  }
  save(data) {
    this.data[data.id] = data;
  }
}

// Use fake in tests
const db = new FakeDatabase();
db.save({ id: 1, name: 'Product' });
```

## Creating Effective Test Doubles

### Rule 1: Stub Queries, Mock Commands

```javascript
// Queries (get data) - stub them
const mockUser = jest.fn().mockReturnValue({
  id: 1,
  name: 'Alice'
});

// Commands (do something) - mock them
const mockEmailSender = jest.fn();
await mockEmailSender('alice@test.com', 'Welcome!');
expect(mockEmailSender).toHaveBeenCalledWith('alice@test.com', 'Welcome!');
```

### Rule 2: Only Mock External Dependencies

```javascript
// ❌ DON'T mock methods of code you're testing
class UserService {
  async getUser(id) {
    // Don't mock this!
  }
}

// ✅ DO mock external dependencies
class UserService {
  constructor(database) {
    this.database = database; // Mock this
  }
}
```

### Rule 3: Mock at Boundaries

```javascript
// ❌ Overmocking - too many mocks
const service = {
  getUser: jest.fn(),
  validate: jest.fn(),
  transform: jest.fn(),
  format: jest.fn()
};

// ✅ Better - only mock external boundaries
const service = {
  database: mockDatabase, // external
  emailService: mockEmail  // external
};
```

## Verification Patterns

### Assertion-Based Verification
Verify return values and state:

```javascript
const user = userService.createUser(userData);
expect(user.name).toBe('Alice');
expect(user.id).toBeDefined();
```

### Interaction-Based Verification
Verify method calls:

```javascript
const mockDb = jest.fn();
userService.saveUser(userData, mockDb);

// Verify the mock was called
expect(mockDb).toHaveBeenCalledWith(userData);
expect(mockDb).toHaveBeenCalledTimes(1);
```

## Advanced Mocking Patterns

### Conditional Mocking

```javascript
const mockAPI = jest.fn((url) => {
  if (url.includes('/users')) {
    return Promise.resolve({ id: 1, name: 'Alice' });
  }
  if (url.includes('/products')) {
    return Promise.resolve({ id: 1, title: 'Widget' });
  }
  return Promise.reject(new Error('Not found'));
});
```

### Progressive Mocks

```javascript
const mockFn = jest.fn()
  .mockReturnValueOnce(10)   // First call
  .mockReturnValueOnce(20)   // Second call
  .mockReturnValue(0);        // All others

expect(mockFn()).toBe(10);
expect(mockFn()).toBe(20);
expect(mockFn()).toBe(0);
```

### Error Simulation

```javascript
const mockDatabase = jest.fn();

// Normal response
mockDatabase.mockResolvedValueOnce({ id: 1 });

// Error response
mockDatabase.mockRejectedValueOnce(
  new Error('Database connection failed')
);

// Test error handling
await expect(operation()).rejects.toThrow('Database connection failed');
```

## Anti-Patterns to Avoid

### ❌ Over-Mocking
```javascript
// BAD - mocking too much
const mockArray = jest.fn();
mockArray.push = jest.fn();
mockArray.map = jest.fn();
```

### ✅ Mock What Matters
```javascript
// GOOD - mock the real dependency
const mockDatabaseQuery = jest.fn();
// Array methods work normally
```

### ❌ Mock Implementation Details
```javascript
// BAD - mocking internal methods
const userService = {
  _validateEmail: jest.fn(),  // Internal!
  _hashPassword: jest.fn()
};
```

### ✅ Mock External APIs
```javascript
// GOOD - mock external boundaries
const userService = {
  send: mockEmailService,
  save: mockDatabase
};
```

## Common Mistakes

### Mistake 1: Forgetting to Restore Mocks

```javascript
// ❌ BAD
test('first test', () => {
  jest.spyOn(console, 'log');
  // Spy not restored!
});

// ✅ GOOD
test('first test', () => {
  const spy = jest.spyOn(console, 'log');
  // ...
  spy.mockRestore(); // Restore after test
});
```

### Mistake 2: Mock Behavior Doesn't Match Reality

```javascript
// ❌ BAD - mock returns success always
const mockAPI = jest.fn().mockResolvedValue({ success: true });

// ✅ GOOD - mock realistic scenarios
const mockAPI = jest.fn()
  .mockResolvedValueOnce({ success: true })
  .mockRejectedValueOnce(new Error('Timeout'));
```

### Mistake 3: Testing the Mock Instead of Code

```javascript
// ❌ BAD - verifying the mock was set up
expect(mockFn).toBeDefined();

// ✅ GOOD - verifying the code used it correctly
expect(mockFn).toHaveBeenCalledWith(expectedArgs);
```

## Sinon.js Alternatives

While Jest mocking is powerful, Sinon.js offers more features:

```javascript
const sinon = require('sinon');

// Create a stub
const stub = sinon.stub().returns(42);

// Spy on existing object
const spy = sinon.spy(obj, 'method');

// Verify
expect(spy.calledOnce).toEqual(true);
expect(spy.firstCall.args[0]).toEqual('argument');

// Check call arguments
expect(spy.calledWith('argument')).toEqual(true);

// Restore
spy.restore();
```

## Best Practices

1. **Mock External Dependencies** - Only what goes outside your unit
2. **Use Spies for Existing Code** - When you want to track real behavior
3. **Mock at Boundaries** - API calls, database, file system
4. **Test Realistic Scenarios** - Don't make mocks too forgiving
5. **Verify Interactions** - Check how mocks were called
6. **Clean Up Mocks** - Always restore spies after tests
7. **Keep Mocks Simple** - Don't over-complicate mock setup
8. **Use Factories** - Reusable mock helpers
9. **Document Mocks** - Explain why each mock exists
10. **Consider Fakes** - Sometimes a fake is better than a mock

## When to Use What

| Scenario | Use |
|----------|-----|
| Need specific return values | Stub |
| Verify function called correctly | Mock |
| Track existing function | Spy |
| Need realistic implementation | Fake |
| Database operations | Mock |
| API calls | Mock |
| Timer/delays | Fake timers |
| Logging | Spy |
| File operations | Mock |
| Math calculations | Don't mock |

## Conclusion

Test doubles are essential for writing fast, reliable unit tests. By understanding when to use mocks, stubs, and spies, you can isolate the code you're testing and verify it behaves correctly in all scenarios. The key is mocking at the right level (external dependencies) without over-mocking implementation details.

