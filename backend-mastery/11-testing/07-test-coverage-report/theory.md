# Test Coverage Reports - Theory

## Understanding Code Coverage

Code coverage measures what percentage of your code is executed during tests. It shows which lines, branches, and functions were tested.

### Types of Coverage

**Line Coverage**  
Percentage of lines executed:
```javascript
function processUser(user) {
  if (user.active) {        // Line 2
    console.log('Active');  // Line 3 - executed
  } else {
    console.log('Inactive'); // Line 5 - NOT executed
  }
}

// 2 of 3 lines covered = 66% line coverage
```

**Branch Coverage**  
Percentage of conditional paths tested:
```javascript
if (age > 18) { /* Branch A */ }
else { /* Branch B */ }

// Testing only if (age = 25) covers Branch A
// Missing Branch B = 50% branch coverage
```

**Function Coverage**  
Percentage of functions called:
```javascript
function login() { }     // Tested
function logout() { }    // Tested
function resetPassword() { } // NOT tested

// 2 of 3 = 66% function coverage
```

**Statement Coverage**  
Percentage of statements executed:
```javascript
let total = 0;           // Stmt 1
total += 5;              // Stmt 2
console.log(total);      // Stmt 3

// All executed = 100% statement coverage
```

## Coverage Metrics Interpretation

### Lines Coverage
- **80%+** ✅ Good - Most code exercised
- **50-80%** ⚠️ Warning - Gaps exist
- **<50%** ❌ Poor - Too much untested

### Branch Coverage
Most important - ensures all paths tested
- **90%+** ✅ Excellent
- **70-90%** ✅ Good
- **50-70%** ⚠️ Fair
- **<50%** ❌ Poor

### Function Coverage
- **90%+** ✅ Most functions tested
- **70-90%** ✅ Good
- **<70%** ⚠️ Many untested functions

## Coverage Tools

### Jest
```bash
npm run test -- --coverage
```

Built-in coverage via Istanbul:
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Coverage Report Formats

**HTML Report**
```
coverage/
├── index.html       # Summary
├── src/
│   └── utils.js.html # Per-file details
```

**Text Summary**
```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
utils.js  |   85.7  |   75     |   100   |   85.7
controller.js | 92   |   88     |   90    |   92
```

**JSON Report**
```json
{
  "total": {
    "lines": { "total": 100, "covered": 85 },
    "statements": { "total": 100, "covered": 85 }
  }
}
```

## Setting Coverage Thresholds

### Global Threshold
```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80
  }
}
```

### Per-Directory Threshold
```javascript
coverageThreshold: {
  global: { lines: 80 },
  './src/utils': { lines: 90 },
  './src/api': { lines: 85 }
}
```

### Critical Path Coverage
```javascript
// Only certain files need high coverage
coverageThreshold: {
  './src/auth/': { lines: 95 },      // Auth critical
  './src/payment/': { lines: 90 },   // Payment important
  './src/ui/': { lines: 50 }          // UI less critical
}
```

## Coverage Gap Analysis

### Identifying Gaps
```javascript
// Coverage shows 85% - where's the 15%?

// 1. Untested branches
if (DEBUG) { /* line never covered */ }

// 2. Error paths
function risky() {
  try {
    // tested
  } catch (e) { /* never tested */ } // GAP
}

// 3. Edge cases
function parse(str) {
  if (str.length > 100) { /* gap */ }
}

// 4. Rare conditions
if (Math.random() < 0.01) { /* untested */ }
```

### Closing Gaps

```javascript
// 1. Add error tests
test('should handle errors', () => {
  expect(() => riskyFunction()).toThrow();
});

// 2. Add edge case tests
test('should handle long strings', () => {
  const long = 'x'.repeat(101);
  const result = parse(long);
  expect(result).toBeDefined();
});

// 3. Add condition tests
test('should handle rare condition', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.005);
  rareFunction();
  expect(rare).toHaveBeenCalled();
});
```

## Coverage Anti-Patterns

### ❌ Chasing 100% Coverage
Problems:
- Tests become fragile
- Unnecessary test code
- False confidence
- Diminishing returns

```javascript
// BAD - forcing coverage
test('test setter', () => {
  obj.name = 'test'; // Pointless test
  expect(obj.name).toBe('test');
});
```

### ✅ Target Strategic Coverage
```javascript
// GOOD coverage goals
- Auth logic: 95%+
- Business rules: 85%+
- Utils: 80%+
- UI: 50%+
```

### ❌ Excluding Too Much
```javascript
// Excluding actual code
collectCoverageFrom: [
  'src/**/*.js',
  '!src/**/.test.js',
  '!src/**' // Oops, excluded everything!
]
```

### ✅ Targeted Exclusions
```javascript
// Exclude only what shouldn't be tested
collectCoverageFrom: [
  'src/**/*.js',
  '!src/**/*.test.js',
  '!src/index.js', // Entry file
  '!src/config/*.js' // Config files
]
```

## Improving Coverage

### 1. Branch Coverage
Each if/else must be tested:
```javascript
// Test both branches
test('branch A', () => {
  expect(condition(true)).toBe('A');
});

test('branch B', () => {
  expect(condition(false)).toBe('B');
});
```

### 2. Error Paths
Test both success and failure:
```javascript
test('success path', async () => {
  const result = await operation();
  expect(result).toBeDefined();
});

test('error path', async () => {
  jest.spyOn(api, 'call').mockRejectedValue(...);
  await expect(operation()).rejects.toThrow();
});
```

### 3. Edge Cases
Test boundaries:
```javascript
test('empty input', () => {
  expect(process([])).toEqual([]);
});

test('single item', () => {
  expect(process([1])).toEqual([1]);
});

test('large input', () => {
  expect(process(new Array(1000))).toBeDefined();
});
```

### 4. Loops and Conditions
```javascript
test('no iterations', () => {
  expect(sum([])).toBe(0);
});

test('single iteration', () => {
  expect(sum([5])).toBe(5);
});

test('multiple iterations', () => {
  expect(sum([1, 2, 3])).toBe(6);
});
```

## Coverage in CI/CD

### Github Actions Example
```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/coverage-final.json
    fail_ci_if_error: true

- name: Check coverage threshold
  run: |
    coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$coverage < 80" | bc -l) )); then
      echo "Coverage below 80%"
      exit 1
    fi
```

### Coverage Quality Gates
```javascript
// Fail tests if coverage drops
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

## Coverage Tools & Services

- **Istanbul** - Coverage engine (built into Jest)
- **Codecov** - Track coverage over time
- **Coveralls** - Coverage tracking
- **SonarQube** - Code quality & coverage

## Best Practices

1. **Target 80%** - Not 100%
2. **Focus on Critical Paths** - Auth, payments, core logic
3. **Branch Coverage > Line Coverage** - More meaningful
4. **Test Edge Cases** - Where bugs hide
5. **Continuous Monitoring** - Track over time
6. **Fail Build on Drop** - Prevent regression
7. **Review Coverage Diffs** - See impact of changes
8. **Document Gaps** - Why some code isn't tested
9. **Prioritize Tests** - ROI on test time
10. **Celebrate Improvements** - Motivate team

## Conclusion

Code coverage is a useful metric but not a goal. Focus on testing important code paths and critical logic. A 70% coverage with good tests beats 100% coverage with bad tests. Use coverage reports to identify gaps, then add tests strategically rather than chasing percentage points.

