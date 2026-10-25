# 01 - Unit Tests with Jest & Vitest

## Overview

This module teaches you how to write effective unit tests using Jest and Vitest - the two most popular JavaScript testing frameworks. You'll learn testing principles, best practices, and practical examples.

## What You'll Learn

- **Unit Testing Fundamentals** - What, why, and how to write unit tests
- **Jest Basics** - Setup, configuration, and writing tests
- **Vitest Alternative** - Modern ESM-first testing framework
- **Assertion Patterns** - Different ways to verify test behavior
- **Test Organization** - Structuring tests for maintainability
- **Coverage Reports** - Measuring test coverage
- **Common Anti-Patterns** - What to avoid when testing

## Prerequisites

- Basic JavaScript knowledge
- Node.js installed
- Familiar with function declarations and basic testing concepts

## Quick Start

```bash
# 1. Navigate to this directory
cd 01-unit-tests-jest-vitest

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open browser to http://localhost:5401
# Or run tests via the React UI

# 5. For running Jest tests specifically
npm test
```

## File Structure

```
├── server.js           # Express backend with test endpoints
├── controller.js       # Core testing logic and examples
├── routes.js           # API endpoints for testing
├── middleware.js       # Request middleware
├── schema.js           # Input validation schemas
├── App.jsx             # React testing UI
├── theory.md           # Detailed learning material
├── package.json        # Dependencies
└── .env.example        # Environment variables template
```

## Testing Scenarios Covered

### 1. **Unit Testing Math Functions**
Testing basic calculations and utilities

```javascript
// Example: Testing a calculator
test('add should sum two numbers', () => {
  expect(add(2, 3)).toBe(5);
});
```

### 2. **Validation Function Testing**
Testing email, password, and data validators

```javascript
// Example: Email validation
test('should validate email format', () => {
  expect(validateEmail('user@example.com')).toBe(true);
  expect(validateEmail('invalid')).toBe(false);
});
```

### 3. **Array Manipulation Testing**
Testing functions that work with arrays and collections

```javascript
// Example: Array filtering
test('should filter users by age', () => {
  const users = [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 17 }
  ];
  const result = filterAdults(users);
  expect(result).toHaveLength(1);
});
```

### 4. **Error Handling Testing**
Testing that functions throw appropriate errors

```javascript
// Example: Error on invalid input
test('should throw on missing required field', () => {
  expect(() => createUser({})).toThrow('Name required');
});
```

### 5. **Object Manipulation Testing**
Testing object creation and modifications

```javascript
// Example: User creation
test('should create user with all fields', () => {
  const user = createUser({ name: 'Alice', email: 'alice@test.com' });
  expect(user).toHaveProperty('id');
  expect(user.name).toBe('Alice');
});
```

## Key Concepts

### AAA Pattern (Arrange-Act-Assert)
Every test follows three steps:

```javascript
test('description of what should happen', () => {
  // ARRANGE - Set up test data
  const input = 5;
  
  // ACT - Execute the code
  const result = doubleNumber(input);
  
  // ASSERT - Verify the result
  expect(result).toBe(10);
});
```

### Test Isolation
Each test should be independent and not rely on other tests:

```javascript
// Use beforeEach to reset state
beforeEach(() => {
  database.clear();
});

test('should add user', () => {
  database.addUser({ name: 'Alice' });
  expect(database.getUsers()).toHaveLength(1);
});

test('should add multiple users', () => {
  database.addUser({ name: 'Alice' });
  database.addUser({ name: 'Bob' });
  expect(database.getUsers()).toHaveLength(2); // Fresh database
});
```

### Coverage Metrics
Measure how much of your code is tested:

- **Line Coverage** - Are all lines executed?
- **Branch Coverage** - Are all if/else paths tested?
- **Function Coverage** - Are all functions called?
- **Statement Coverage** - Are all statements executed?

```bash
# View coverage report
npm test -- --coverage
```

## Common Testing Patterns

### Pattern 1: Testing Pure Functions
```javascript
// Function being tested
export const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Test
test('should calculate total from items', () => {
  const items = [
    { id: 1, price: 10 },
    { id: 2, price: 20 }
  ];
  expect(calculateTotal(items)).toBe(30);
});
```

### Pattern 2: Testing with "Happy Path" and "Sad Path"
```javascript
// Happy path - normal usage
test('should parse valid JSON', () => {
  const result = parseJSON('{"name":"Alice"}');
  expect(result.name).toBe('Alice');
});

// Sad path - error cases
test('should throw on invalid JSON', () => {
  expect(() => parseJSON('not json')).toThrow();
});
```

### Pattern 3: Testing Edge Cases
```javascript
describe('discountCalculator', () => {
  test('should handle 0 price', () => {
    expect(discountCalculator(0, 0.1)).toBe(0);
  });
  
  test('should handle 100% discount', () => {
    expect(discountCalculator(100, 1.0)).toBe(0);
  });
  
  test('should handle negative discount (invalid)', () => {
    expect(discountCalculator(100, -0.1)).toBe(100);
  });
});
```

## API Endpoints

The backend provides endpoints to test different scenarios:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/test/unit-math` | Test math functions |
| POST | `/api/test/validate-email` | Test email validation |
| POST | `/api/test/validate-password` | Test password validation |
| POST | `/api/test/array-operations` | Test array manipulation |
| GET | `/api/test/coverage` | Get coverage metrics |
| POST | `/api/test/calculate` | Test calculations |

## Interactive Testing UI

The React component (App.jsx) provides an interactive UI to:

1. **Run Unit Tests** - Execute predefined test suites
2. **Test Validators** - Test email/password validation
3. **Test Calculations** - Verify math operations
4. **View Results** - See test results and coverage
5. **Execute Custom Tests** - Write and run your own tests

## Best Practices to Implement

✅ **DO:**
- Write tests that describe behavior in plain English
- Test one logical thing per test
- Use meaningful test names
- Setup and teardown state with beforeEach/afterEach
- Test both success and failure paths
- Keep tests fast and isolated
- Mock external dependencies

❌ **DON'T:**
- Test implementation details
- Create tests that depend on each other
- Write tests that are too broad
- Ignore edge cases
- Create brittle tests that break on minor changes
- Test third-party libraries
- Forget to cleanup resources

## Learning Activities

1. **Read** `theory.md` - Understand unit testing concepts (20 min)
2. **Setup** - Install dependencies and start the server (5 min)
3. **Explore** - Use the React UI to run example tests (10 min)
4. **Analyze** - Review the test code in `controller.js` (15 min)
5. **Write** - Create your own test cases using the UI (20 min)
6. **Measure** - Check your coverage metrics (5 min)
7. **Refactor** - Improve test quality and coverage (15 min)

## Real-World Applications

Unit tests are essential for:

- **Regression Prevention** - Catch bugs before they reach production
- **Documentation** - Tests show how code should be used
- **Confidence** - Refactor safely knowing tests will catch errors
- **Code Quality** - Better design leads to more testable code
- **Debugging** - Isolate failures to specific units
- **Team Communication** - Tests document expected behavior

## Troubleshooting

### Issue: Tests failing randomly
**Solution:** You likely have test interdependency or shared state. Use `beforeEach`/`afterEach` to isolate tests.

### Issue: Coverage is lower than expected
**Solution:** Check for untested branches, error paths, and edge cases. Add more test cases for these scenarios.

### Issue: Tests running slowly
**Solution:** Either tests are doing too much (testing integration), or mocking is missing. Consider splitting integration tests separately.

## Next Steps

Once you've mastered unit testing:

1. Move to **Module 02** - Integration testing with Supertest
2. Learn **Test Doubles** - Mocks, stubs, and spies
3. Explore **E2E Testing** - Full application testing with Cypress/Playwright

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Questions?

Refer to `theory.md` for deeper explanations, or test your understanding by experimenting with the interactive UI.
