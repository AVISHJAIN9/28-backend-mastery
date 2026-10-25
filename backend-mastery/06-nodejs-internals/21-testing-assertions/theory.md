# Testing & Assertions Theory

## What is the Assert Module?

Node.js's built-in `assert` module provides testing utilities for writing unit tests and validation code. It's lightweight and perfect for basic assertion testing without external dependencies.

### Core Methods

```javascript
const assert = require('assert');

// 1. assert() - Basic truthiness check
assert(true); // passes
assert(false); // throws AssertionError

// 2. strictEqual() - Strict equality
assert.strictEqual(5, 5); // passes
assert.strictEqual(5, '5'); // throws - different types

// 3. equal() - Loose equality (not recommended)
assert.equal(5, '5'); // passes (coercion)

// 4. deepStrictEqual() - Deep comparison
assert.deepStrictEqual({ a: 1 }, { a: 1 }); // passes

// 5. throws() - Expects function to throw
assert.throws(() => { throw new Error(); });

// 6. doesNotThrow() - Expects no throw
assert.doesNotThrow(() => 'ok');

// 7. match() - Regex matching
assert.match('hello', /ell/);

// 8. rejects() - Promise rejection
assert.rejects(async () => { throw new Error(); });
```

## Basic Assertion Methods

### 1. Truthiness Checks

```javascript
const assert = require('assert');

// Simple boolean check
assert(value === expected);
assert(value !== undefined);
assert(value > 0);

// With custom message
assert(value, 'Value should be truthy');
assert(value === 5, 'Value should be exactly 5');
```

### 2. Equality Assertions

```javascript
// Strict equality (===)
assert.strictEqual(5, 5); // passes
assert.strictEqual(5, '5'); // FAILS - type mismatch

// Loose equality (== ) - AVOID
assert.equal(5, '5'); // passes (coercion)

// Not equal
assert.notStrictEqual(5, '5'); // passes

// Message parameter
assert.strictEqual(actual, expected, 'Custom error message');
```

### 3. Object Comparison

```javascript
// Shallow comparison (references and primitives)
const obj1 = { a: 1 };
const obj2 = { a: 1 };
assert.strictEqual(obj1, obj2); // FAILS - different objects

// Deep comparison (recursively checks all properties)
assert.deepStrictEqual(obj1, obj2); // passes

// Complex nested structures
const nested1 = { a: { b: { c: 1 } } };
const nested2 = { a: { b: { c: 1 } } };
assert.deepStrictEqual(nested1, nested2); // passes

// With arrays
assert.deepStrictEqual([1, 2, 3], [1, 2, 3]); // passes
```

### 4. Throws and DoesNotThrow

```javascript
// Test that function throws
assert.throws(() => {
  throw new Error('Expected');
});

// Test specific error type
assert.throws(() => {
  throw new TypeError('Type error');
}, TypeError); // Matches error type

// Test error message
assert.throws(() => {
  throw new Error('Invalid input');
}, /Invalid/); // Matches regex

// Test that function does NOT throw
assert.doesNotThrow(() => {
  return 42;
});

// Test function that sometimes throws
assert.throws(
  () => { throw new Error('Expected'); },
  (err) => err instanceof Error && err.message.includes('Expected')
);
```

### 5. Regex Matching

```javascript
// Match string against regex
assert.match('hello world', /world/);

// Doesn't match
assert.doesNotMatch('hello', /goodbye/);

// Case-insensitive
assert.match('HELLO', /hello/i);
```

### 6. Promise Assertions

```javascript
// Test promise rejection
assert.rejects(
  async () => {
    throw new Error('Failed');
  },
  Error
);

// Test promise resolution
assert.doesNotReject(
  async () => {
    return 'success';
  }
);
```

## Testing Patterns

### Pattern 1: Input Validation

```javascript
function validateUser(user) {
  assert(user, 'User is required');
  assert(typeof user.name === 'string', 'Name must be string');
  assert(user.name.length > 0, 'Name cannot be empty');
  assert(typeof user.email === 'string', 'Email must be string');
  assert(user.email.includes('@'), 'Invalid email');
  assert(user.age >= 0, 'Age must be non-negative');
  
  return true;
}

// Usage
try {
  validateUser({ name: 'Alice', email: 'alice@test.com', age: 30 });
  console.log('Validation passed');
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### Pattern 2: Type Checking

```javascript
function processData(data) {
  assert(Array.isArray(data), 'Data must be array');
  assert(data.length > 0, 'Data array cannot be empty');
  
  data.forEach((item, idx) => {
    assert(typeof item === 'object', `Item ${idx} must be object`);
    assert(item.id !== undefined, `Item ${idx} missing id`);
  });
  
  return data.map(item => item.id);
}

processData([{ id: 1 }, { id: 2 }]); // Success
processData([{ id: 1 }, {}]); // Throws: Item 1 missing id
```

### Pattern 3: Range/Boundary Testing

```javascript
function validateScore(score) {
  assert(typeof score === 'number', 'Score must be number');
  assert(score >= 0 && score <= 100, 'Score must be 0-100');
  
  let grade;
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else grade = 'F';
  
  return grade;
}

console.log(validateScore(95)); // 'A'
console.log(validateScore(50)); // 'F'
// validateScore(150); // Throws
```

### Pattern 4: State Verification

```javascript
class Counter {
  constructor() {
    this.count = 0;
  }
  
  increment() {
    this.count++;
  }
  
  decrement() {
    assert(this.count > 0, 'Cannot decrement below 0');
    this.count--;
  }
  
  getCount() {
    return this.count;
  }
}

const counter = new Counter();
assert.strictEqual(counter.getCount(), 0, 'Initial count should be 0');
counter.increment();
assert.strictEqual(counter.getCount(), 1, 'Count should be 1');
```

### Pattern 5: Async Testing

```javascript
async function testAsyncOperation() {
  // Test successful operation
  const result = await performAsyncTask();
  assert.deepStrictEqual(result, { status: 'success' });
  
  // Test error handling
  await assert.rejects(
    performFailingTask(),
    Error
  );
  
  console.log('All async tests passed');
}

async function performAsyncTask() {
  return new Promise(resolve => {
    setTimeout(() => resolve({ status: 'success' }), 100);
  });
}

async function performFailingTask() {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Failed')), 100);
  });
}

testAsyncOperation();
```

## Test Suite Patterns

### Pattern 1: Simple Test Runner

```javascript
class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }
  
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  async run() {
    console.log(`\nRunning: ${this.name}`);
    
    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`  ✓ ${test.name}`);
      } catch (error) {
        this.failed++;
        console.log(`  ✗ ${test.name}`);
        console.log(`    Error: ${error.message}`);
      }
    }
    
    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);
  }
}

// Usage
const suite = new TestSuite('Math Operations');
suite.test('Addition', () => {
  assert.strictEqual(2 + 2, 4);
});
suite.test('Multiplication', () => {
  assert.strictEqual(3 * 3, 9);
});
suite.run();
```

### Pattern 2: Before/After Hooks

```javascript
class TestSuiteWithHooks {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.beforeFn = null;
    this.afterFn = null;
  }
  
  before(fn) {
    this.beforeFn = fn;
  }
  
  after(fn) {
    this.afterFn = fn;
  }
  
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  async run() {
    console.log(`\nRunning: ${this.name}`);
    
    for (const test of this.tests) {
      try {
        if (this.beforeFn) await this.beforeFn();
        
        await test.fn();
        console.log(`  ✓ ${test.name}`);
        
        if (this.afterFn) await this.afterFn();
      } catch (error) {
        console.log(`  ✗ ${test.name}: ${error.message}`);
      }
    }
  }
}

// Usage
const suite = new TestSuiteWithHooks('Database Tests');

let db = null;
suite.before(async () => {
  db = { /* initialize */ };
});

suite.test('Insert', () => {
  assert(db !== null, 'DB should be initialized');
});

suite.after(async () => {
  db = null;
});

suite.run();
```

### Pattern 3: Describe Blocks

```javascript
class TestDescribe {
  constructor(name) {
    this.name = name;
    this.suites = [];
  }
  
  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      test(testName, testFn) {
        this.tests.push({ name: testName, fn: testFn });
      }
    };
    fn(suite);
    this.suites.push(suite);
  }
  
  async run() {
    for (const suite of this.suites) {
      console.log(`\n${suite.name}`);
      for (const test of suite.tests) {
        try {
          await test.fn();
          console.log(`  ✓ ${test.name}`);
        } catch (error) {
          console.log(`  ✗ ${test.name}: ${error.message}`);
        }
      }
    }
  }
}

// Usage
const root = new TestDescribe('User Management');

root.describe('User Creation', (it) => {
  it.test('creates user with valid data', () => {
    assert.strictEqual(1 + 1, 2);
  });
  
  it.test('rejects invalid email', () => {
    assert.throws(() => validateEmail('invalid'));
  });
});

root.run();
```

## Error Handling in Tests

### 1. Custom Error Messages

```javascript
assert(value > 100, `Expected value > 100, got ${value}`);

// Better: use context
function assert(condition, message, context = {}) {
  if (!condition) {
    throw new AssertionError({
      message: `${message} - ${JSON.stringify(context)}`,
      actual: context.actual,
      expected: context.expected
    });
  }
}
```

### 2. Debugging Failed Assertions

```javascript
function debugAssert(actual, expected, message) {
  try {
    assert.strictEqual(actual, expected, message);
  } catch (error) {
    console.error('Assertion failed:');
    console.error('  Expected:', expected);
    console.error('  Actual:', actual);
    console.error('  Message:', message);
    console.error('  Stack:', error.stack);
    throw error;
  }
}
```

### 3. Assertion Counters

```javascript
let assertionCount = 0;
let failureCount = 0;

function countingAssert(condition, message) {
  assertionCount++;
  try {
    assert(condition, message);
  } catch (error) {
    failureCount++;
    throw error;
  }
}

function printStats() {
  console.log(`Assertions: ${assertionCount}`);
  console.log(`Failures: ${failureCount}`);
  console.log(`Pass rate: ${((1 - failureCount/assertionCount) * 100).toFixed(1)}%`);
}
```

## Testing Real-World Scenarios

### Scenario 1: API Response Validation

```javascript
async function testAPIResponse() {
  const response = { status: 200, data: { id: 1, name: 'Test' } };
  
  assert.strictEqual(response.status, 200);
  assert(response.data, 'Response should have data');
  assert.strictEqual(typeof response.data.id, 'number');
  assert.strictEqual(typeof response.data.name, 'string');
  
  console.log('API response valid');
}
```

### Scenario 2: Function Behavior Testing

```javascript
function testMapBehavior() {
  const map = new Map();
  
  map.set('a', 1);
  assert.strictEqual(map.get('a'), 1);
  assert.strictEqual(map.size, 1);
  
  map.delete('a');
  assert.strictEqual(map.size, 0);
  
  console.log('Map behavior correct');
}
```

### Scenario 3: Error Edge Cases

```javascript
function testEdgeCases() {
  // Division by zero
  assert.strictEqual(1 / Infinity, 0);
  
  // NaN equality
  assert(Number.isNaN(0 / 0));
  
  // Array bounds
  const arr = [1, 2, 3];
  assert.strictEqual(arr[999], undefined);
  
  // Type coercion
  assert.strictEqual('' == false, true); // loose
  assert.notStrictEqual('', false); // strict
  
  console.log('Edge cases handled correctly');
}
```

## Best Practices

1. **Use strictEqual** - Not equal() - Avoid type coercion bugs
2. **Clear Messages** - Make failure messages helpful
3. **Test One Thing** - Each test should verify one behavior
4. **Fail Fast** - Stop on first error
5. **DRY Tests** - Use helpers and fixtures
6. **Test Async Properly** - Use async/await and rejects/doesNotReject
7. **Group Related Tests** - Use describe/suite organization
8. **Performance Tests** - Monitor test execution time

## Assert Module Limitations

```
✓ Good for: Unit tests, validation, simple testing
✓ Good for: Learning testing patterns
✗ Not good for: Large test suites (use Jest/Mocha)
✗ Not good for: Complex mocking/stubbing
✗ Not good for: Async test orchestration

For production testing → Use Jest, Mocha, or Vitest
```
