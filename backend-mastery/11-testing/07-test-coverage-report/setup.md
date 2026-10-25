# Module 07: Test Coverage Reports - Setup Guide

## Quick Start (5 minutes)

```bash
# Install dependencies
npm install

# Start server
npm run dev

# Run tests with coverage
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

**Key Packages:**
- `jest` - Testing framework with coverage
- `@istanbul/reporter` - Coverage reporter
- `nyc` - Alternative coverage tool

### 2. Environment Setup

Create `.env`:

```env
HTTP_PORT=4007
NODE_ENV=test
COVERAGE_THRESHOLD_LINES=80
COVERAGE_THRESHOLD_BRANCHES=75
COVERAGE_THRESHOLD_FUNCTIONS=80
LOG_LEVEL=debug
```

### 3. Configure Jest for Coverage

**jest.config.js:**

```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html', 'json']
};
```

### 4. Run Tests with Coverage

```bash
# Generate coverage
npm test -- --coverage

# View report
open coverage/lcov-report/index.html
```

## Coverage Metrics

### Line Coverage

```
Line Coverage = (Lines Executed / Total Lines) × 100

Example:
10 lines of code
8 lines executed
80% line coverage
```

### Branch Coverage

```
Branch Coverage = (Branches Executed / Total Branches) × 100

Example:
if (user.active) {  // 2 branches: true/false
  ...
}

If only true path tested: 50% branch coverage
```

### Function Coverage

```
Function Coverage = (Functions Called / Total Functions) × 100

Example:
5 functions defined
4 called in tests
80% function coverage
```

### Statement Coverage

```
Statement Coverage = (Statements Executed / Total Statements) × 100

Example:
20 statements
18 executed
90% statement coverage
```

## Coverage Reports

### View HTML Report

```bash
open coverage/lcov-report/index.html
```

**Report Shows:**
- Overall coverage percentage
- Per-file coverage
- Uncovered lines highlighted
- Coverage trend over time

### Command Line Report

```bash
# Summary
npm test -- --coverage

# Output:
# ------------------|----------|----------|----------|----------|---|
# File              | % Stmts  | % Branch | % Funcs  | % Lines  |
# ------------------|----------|----------|----------|----------|---|
# All files         |    80   |    75   |    80   |    80   |
#  src/utils.js     |    90   |    85   |    95   |    91   |
#  src/api.js       |    70   |    65   |    75   |    72   |
# ------------------|----------|----------|----------|----------|---|
```

## Setting Thresholds

### Global Thresholds

```javascript
coverageThreshold: {
  global: {
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### Per-File Thresholds

```javascript
coverageThreshold: {
  global: {
    branches: 75,
    functions: 80,
    lines: 80
  },
  './src/core/': {
    branches: 90,
    functions: 90,
    lines: 90
  },
  './src/utils/': {
    branches: 70,
    functions: 75,
    lines: 75
  }
}
```

## Finding Coverage Gaps

### Identify Uncovered Lines

```javascript
// src/payment.js
function processPayment(amount, method) {
  if (method === 'credit') {
    charge(amount);
    log('Credit charged');
  } else if (method === 'debit') {
    debit(amount);
    // UNCOVERED: log line never executed
    log('Debit charged');
  }
  return true;
}
```

**Coverage Report Shows:**
- Line 7 (log) uncovered
- Branch: debit path not tested

### Add Tests

```javascript
test('process credit payment', () => {
  expect(processPayment(100, 'credit')).toBe(true);
});

test('process debit payment', () => {
  expect(processPayment(100, 'debit')).toBe(true);
});
```

**Result:** 100% coverage

## Coverage-Driven Development

### View Uncovered Code

```bash
# Generate coverage
npm test -- --coverage --collectCoverageFrom="src/**/*.js"

# Open report
open coverage/lcov-report/src/
```

### Red Lines = Uncovered

HTM report shows:
- 🔴 Red = Uncovered lines
- 🟠 Orange = Partially covered (some branches)
- 🟢 Green = Fully covered

## Continuous Integration

### Fail on Threshold

```bash
# If coverage falls below threshold, fails
npm test -- --coverage

# Exit code: 1 (failure)
```

### GitHub Actions Example

```yaml
name: Coverage
on: [push]
jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test -- --coverage
        # Fails if coverage below threshold
```

## Best Practices

### 1. Start High, Go Higher

```javascript
// Start at 80%, aim for 90%
coverageThreshold: {
  global: {
    lines: 80   // Now
  }
}

// Later
coverageThreshold: {
  global: {
    lines: 90   // Next
  }
}
```

### 2. Don't Sacrifice Quality for Coverage

```javascript
// BAD: Meaningless test
test('user object', () => {
  const user = { id: 1 };
  expect(user).toBeDefined();  // Hits line, no value
});

// GOOD: Meaningful test
test('user has required fields', () => {
  const user = createUser({ name: 'Alice' });
  expect(user).toHaveProperty('id');
  expect(user.name).toBe('Alice');
});
```

### 3. Test Important Code

```
Critical (95%+):
- Authentication
- Payment processing
- Data validation

Important (80-90%):
- API endpoints
- Business logic
- Utilities

Optional (50-75%):
- Logging
- Helpers
- UI components
```

### 4. Review Coverage Reports

```bash
# Weekly check
cron: 0 0 * * 1 npm test -- --coverage
# Alert if drops below threshold
```

## Ignoring Code

### Exclude Files

```javascript
// jest.config.js
coveragePathIgnorePatterns: [
  '/node_modules/',
  '/test/',
  '*.spec.js',
  'index.js'  // Skip exports
]
```

### Exclude Lines

```javascript
// Skip specific lines
/* istanbul ignore next */
function notTested() {
  // ...
}

// Skip block
/* istanbul ignore if  */
if (isProduction) {
  // ...
}
```

## Trends Over Time

### CodeCov Integration

```yaml
# .github/workflows/coverage.yml
- uses: codecov/codecov-action@v3
  with:
    file: ./coverage/coverage-final.json
```

### Track Metrics

```
Date     | Lines | Branches | Functions
---------|-------|----------|----------
Week 1   | 70%   | 65%      | 72%
Week 2   | 75%   | 70%      | 78%
Week 3   | 82%   | 78%      | 85%
Week 4   | 88%   | 84%      | 90%
```

## Common Issues

### "Coverage below threshold"

```bash
# Check which files/branches uncovered
npm test -- --coverage
open coverage/lcov-report/index.html

# Add missing tests
```

### "Coverage report not generated"

```javascript
// Ensure jest.config.js has:
collectCoverage: true,
coverageReporters: ['text', 'lcov', 'html']
```

## Metrics Interpretation

| % Coverage | Quality | Action |
|-----------|---------|--------|
| < 50%     | Poor    | Add many tests |
| 50-70%    | Fair    | Fill gaps |
| 70-85%    | Good    | Edge cases |
| 85-95%    | Great   | Refinement |
| 95%+      | Excellent| Maintain |

## Start the Server

```bash
npm run dev
open http://localhost:4007
```

## Next Steps

1. ✅ Generate coverage report
2. ✅ View HTML report
3. ✅ Identify uncovered code
4. ✅ Add tests for gaps
5. ✅ Monitor trends

## Resources

- [Jest Coverage](https://jestjs.io/docs/coverage)
- [Istanbul Coverage](https://istanbul.js.org)
- [CodeCov Integration](https://codecov.io)

