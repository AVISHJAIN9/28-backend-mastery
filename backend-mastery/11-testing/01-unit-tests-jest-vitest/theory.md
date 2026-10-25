# Unit Testing with Jest and Vitest - Theory & Concepts

## What is Unit Testing?

Unit testing is the practice of testing individual, isolated components of your code in isolation. A "unit" is the smallest testable part of an application - typically a single function, method, or class. Unit tests verify that these units behave as expected under various conditions.

### Goals of Unit Testing
- **Verify correctness** - Ensure code works as designed
- **Document behavior** - Tests serve as executable documentation
- **Enable refactoring** - Safely modify code with confidence
- **Catch regressions** - Detect when changes break existing functionality
- **Design improvement** - Drive you toward more testable, modular code

## Jest vs Vitest - A Comparison

### Jest
- **Status** - Industry standard for React/JavaScript testing
- **Setup** - Zero-config setup, great for CRA projects
- **Speed** - Slower initially but has snapshot tests
- **Features** - Complete testing framework with mocking, coverage
- **ESM Support** - Added experimentally, not native

### Vitest
- **Status** - Modern alternative, growing in popularity
- **Setup** - Built on Vite, immediate hot module replacement
- **Speed** - Much faster due to ESM-first approach
- **Features** - Jest-compatible API, great for Vite projects
- **ESM Support** - Native ESM support by default

## Core Testing Concepts

### 1. Test Structure - AAA Pattern

All good tests follow the **Arrange-Act-Assert** pattern:

```javascript
test('should calculate sum correctly', () => {
  // ARRANGE - Set up test data
  const a = 5;
  const b = 3;
  
  // ACT - Execute the function
  const result = add(a, b);
  
  // ASSERT - Verify the result
  expect(result).toBe(8);
});
```

### 2. Test Isolation

Tests must run independently without affecting each other:

```javascript
describe('User Service', () => {
  let users = [];
  
  // ❌ BAD - State leaks between tests
  test('should add user', () => {
    users.push({ id: 1, name: 'Alice' });
    expect(users).toHaveLength(1);
  });
  
  test('should list users', () => {
    expect(users).toHaveLength(1); // Depends on previous test!
  });
  
  // ✅ GOOD - Reset state before each test
  beforeEach(() => {
    users = [];
  });
  
  test('should add user', () => {
    users.push({ id: 1, name: 'Alice' });
    expect(users).toHaveLength(1);
  });
  
  test('should list users', () => {
    expect(users).toHaveLength(0); // Isolated
  });
});
```

### 3. Assertion Types

Jest provides rich assertion matchers:

```javascript
// Equality
expect(value).toBe(5);                           // Strict equality (===)
expect(user).toEqual({ name: 'Alice', id: 1 }); // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(0.1 + 0.2);

// Strings
expect(message).toMatch(/error/i);
expect(message).toContain('error');

// Arrays
expect(array).toContain(value);
expect(array).toHaveLength(3);

// Objects
expect(obj).toHaveProperty('name');
expect(obj).toMatchObject({ name: 'Alice' });

// Functions
expect(fn).toThrow();
expect(fn).toThrow(Error);
expect(fn).toThrowError('specific message');

// Async
await expect(promise).resolves.toEqual(data);
await expect(promise).rejects.toThrow();
```

### 4. Coverage Metrics

**Coverage** measures what percentage of your code is tested:

- **Line Coverage** - % of lines executed
- **Branch Coverage** - % of if/else branches tested  
- **Function Coverage** - % of functions called
- **Statement Coverage** - % of statements executed

```javascript
// Jest config for coverage
// package.json
{
  "jest": {
    "collectCoverageFrom": ["src/**/*.js"],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## Testing Strategies

### 1. Black Box Testing
Test only the public interface, not implementation:

```javascript
// ✅ GOOD - Test the contract
test('validateEmail should accept valid emails', () => {
  expect(validateEmail('user@example.com')).toBe(true);
  expect(validateEmail('invalid-email')).toBe(false);
});

// ❌ BAD - Testing internal implementation
test('validateEmail should use regex with specific pattern', () => {
  expect(validateEmail.toString()).toContain('/^[^@]+@[^@]+\\.[^@]+$/');
});
```

### 2. Edge Case Testing
Test boundary conditions and unusual inputs:

```javascript
describe('calculateDiscount', () => {
  test('should return 0 for invalid inputs', () => {
    expect(calculateDiscount(null, 0.1)).toBe(0);
    expect(calculateDiscount(-100, 0.1)).toBe(0);
  });
  
  test('should handle maximum discount', () => {
    expect(calculateDiscount(100, 1.0)).toBe(0); // 100% discount = no price
  });
  
  test('should handle precision', () => {
    expect(calculateDiscount(99.99, 0.15)).toBeCloseTo(84.99);
  });
});
```

### 3. Error Path Testing
Verify behavior when things go wrong:

```javascript
test('should throw on invalid user data', () => {
  expect(() => {
    createUser();
  }).toThrow('Name is required');
});

test('should handle database errors gracefully', () => {
  const mockDb = { save: () => Promise.reject(new Error('Connection lost')) };
  
  return expect(saveUser(mockDb, data))
    .rejects
    .toThrow('Connection lost');
});
```

## Anti-Patterns to Avoid

### 1. Testing Implementation, Not Behavior
```javascript
// ❌ BAD - Tightly coupled to implementation
test('should use Array.map to transform', () => {
  const result = transform([1, 2, 3]);
  expect(result).toEqual([2, 4, 6]);
  // More specific assertions about HOW it works
});

// ✅ GOOD - Test the outcome
test('should double array elements', () => {
  expect(transform([1, 2, 3])).toEqual([2, 4, 6]);
});
```

### 2. Multiple Assertions per Test
```javascript
// ❌ BAD - Testing multiple behaviors in one test
test('user creation', () => {
  const user = createUser({ name: 'Alice' });
  expect(user.name).toBe('Alice');
  expect(user.id).toBeDefined();
  expect(user.createdAt).toBeDefined();
  expect(user.isActive).toBe(true);
});

// ✅ GOOD - One behavior per test
test('should set user name', () => {
  const user = createUser({ name: 'Alice' });
  expect(user.name).toBe('Alice');
});

test('should generate user id', () => {
  const user = createUser({ name: 'Alice' });
  expect(user.id).toBeDefined();
});
```

### 3. Ignoring Async Tests
```javascript
// ❌ BAD - Promise not awaited or returned
test('should fetch user', () => {
  fetchUser(1).then(user => {
    expect(user.name).toBe('Alice');
  });
});

// ✅ GOOD - Properly handle async
test('should fetch user', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('Alice');
});

// OR
test('should fetch user', () => {
  return fetchUser(1).then(user => {
    expect(user.name).toBe('Alice');
  });
});
```

### 4. Brittle Tests
```javascript
// ❌ BAD - Over-specific assertions
test('should format date', () => {
  const result = formatDate(new Date('2024-01-15'));
  expect(result).toBe('Monday, January 15, 2024 at 12:00:00 AM')
});

// ✅ GOOD - Test what matters
test('should format date', () => {
  const result = formatDate(new Date('2024-01-15'));
  expect(result).toMatch(/January 15, 2024/);
});
```

## Jest Setup & Configuration

### 1. Basic Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### 2. Test Helpers
```javascript
// __tests__/helpers.js
export const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  isActive: true,
  ...overrides
});

export const mockUserService = {
  create: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};
```

### 3. Setup & Teardown
```javascript
beforeAll(() => {
  // Runs once before all tests in suite
  console.log('Starting test suite');
});

beforeEach(() => {
  // Runs before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Runs after each test
  // Cleanup
});

afterAll(() => {
  // Runs once after all tests
  console.log('Test suite complete');
});
```

## Real-World Example: Testing Validation Functions

```javascript
// validators.js
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
};

// validators.test.js
describe('validateEmail', () => {
  test('should accept valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('name.surname@company.co.uk')).toBe(true);
  });
  
  test('should reject invalid emails', () => {
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

describe('validatePassword', () => {
  test('should reject short passwords', () => {
    expect(validatePassword('Short1')).toBe(false);
  });
  
  test('should reject passwords without uppercase', () => {
    expect(validatePassword('lowercase123')).toBe(false);
  });
  
  test('should reject passwords without numbers', () => {
    expect(validatePassword('NoNumbers')).toBe(false);
  });
  
  test('should accept strong passwords', () => {
    expect(validatePassword('StrongPass123')).toBe(true);
  });
});
```

## Vitest Specifics

### 1. ESM Support
```javascript
// Vitest natively supports ES modules
import { describe, test, expect, beforeEach } from 'vitest';
import { add, multiply } from './math.js';

describe('math functions', () => {
  test('should add numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

### 2. Configuration
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
});
```

### 3. Watch Mode
```bash
# Run tests in watch mode
vitest --watch

# Coverage report
vitest --coverage

# UI mode
vitest --ui
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Keep tests simple** - Each test should be quick to understand
3. **Use descriptive names** - Test names should explain what they verify
4. **Avoid test interdependency** - Each test should be independent
5. **Mock external dependencies** - Isolate the unit being tested
6. **Cover happy path and edge cases** - Test normal usage and edge cases
7. **Maintain good coverage** - Aim for 80%+ coverage, not 100%
8. **Keep tests fast** - Tests should provide quick feedback
9. **Use constants for test data** - DRY up your test code
10. **Refactor tests like production code** - Keep them maintainable

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Testing implementation | Brittle tests | Test the contract/interface |
| Shared test state | Tests fail randomly | Use beforeEach/afterEach |
| Missing async handling | Tests pass incorrectly | Use async/await or return promises |
| Too many assertions | Hard to diagnose failures | One logical assertion per test |
| Testing external APIs | Slow, unreliable tests | Mock external dependencies |
| No edge case testing | Missing bugs | Test boundaries and errors |

## Conclusion

Unit tests are the foundation of reliable software. By following the AAA pattern, testing behavior over implementation, and maintaining good test coverage, you can build confidence in your code and enable fearless refactoring. Whether using Jest or Vitest, the principles remain the same: write clear, isolated, focused tests that verify your code works as expected.
