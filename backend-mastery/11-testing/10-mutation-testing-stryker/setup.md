# Module 10: Mutation Testing - Setup Guide

## Quick Start (5 minutes)

```bash
# Install dependencies
npm install

# Run mutation tests
npm run stryker

# View HTML report
open reports/index.html
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

**Key Packages:**
- `@stryker-mutator/core` - Mutation test engine
- `@stryker-mutator/jest-runner` - Jest integration
- `jest` - Test runner

### 2. Configure Stryker

**stryker.conf.js:**

```javascript
module.exports = function(config) {
  config.set({
    testRunner: 'jest',
    testFramework: 'jest',
    mutator: 'javascript',
    reporters: ['html', 'clear-text'],
    files: ['src/**/*.js', '!src/**/*.test.js'],
    mutate: ['src/**/*.js', '!src/**/*.test.js'],
    thresholds: {
      break: 80,
      high: 90,
      low: 70
    },
    concurrency: 4
  });
};
```

### 3. Create package.json Script

```json
{
  "scripts": {
    "stryker": "stryker run"
  }
}
```

### 4. Run Mutation Tests

```bash
# Full run
npm run stryker

# Only test specific file
npx stryker run src/utils.js

# Watch mode
npx stryker run --watch
```

## Understanding Results

### Kill Score

```✓ Killed     - Mutation caught by test (good!)\n✗ Survived   - Test missed mutation (bad!)
⊘ Timeout    - Mutation caused infinite loop
∅ No Coverage - No test exercised this code
```

### Report Output

```

File: src/utils.js
  ✓ Line 5: 10 + 5 → 10 - 5
  ✗ Line 7: if (x > 0) → if (x >= 0)
  ⊓ Line 12: return 42 → (infinite loop)
  ∅ Line 15: unused code

Kill Score: 80% (8/10 mutations killed)
```

## Mutation Types

### Arithmetic

```javascript
// Original
return a + b;

// Mutations
return a - b;   // ✗ Survived? Bad test!
return a * b;
return a / b;
return a % b;
```

Test:
```javascript
test('addition', () => {
  expect(add(2, 3)).toBe(5);  // Catches + → -
});
```

### Comparison

```javascript
// Original
if (age > 18) { }

// Mutations
if (age >= 18) { }  // Similar! Hard to catch
if (age < 18) { }
if (age === 18) { }
```

Test:
```javascript
test('boundary: 17 too young', () => {
  expect(canVote(17)).toBe(false);
});
test('boundary: 18 acceptable', () => {
  expect(canVote(18)).toBe(true);
});
```

### Return Values

```javascript
// Original
return true;

// Mutations
return false;     // Opposite
return undefined;
return null;
```

Test:
```javascript
test('exact value', () => {
  expect(isValid()).toBe(true);  // Catches false mutation
});
```

## Testing Strategies

### Strategy 1: Start Simple

```javascript
function multiply(a, b) {
  return a * b;
}

// BAD - Generic assertion
test('multiply', () => {
  expect(multiply(2, 3)).toBeGreaterThan(0);  // Survives many mutations
});

// GOOD - Specific value
test('multiply 2 by 3', () => {
  expect(multiply(2, 3)).toBe(6);
});
```

### Strategy 2: Test Boundaries

```javascript
function isEven(n) {
  return n % 2 === 0;
}

// BAD - Only one case
test('even number', () => {
  expect(isEven(4)).toBe(true);
});

// GOOD - Boundaries
test('even: 0', () => { expect(isEven(0)).toBe(true); });
test('even: 2', () => { expect(isEven(2)).toBe(true); });
test('odd: 1', () => { expect(isEven(1)).toBe(false); });
test('odd: 3', () => { expect(isEven(3)).toBe(false); });
```

### Strategy 3: Test All Paths

```javascript
function getDiscount(role) {
  if (role === 'admin') return 0.5;
  if (role === 'user') return 0.1;
  return 0;
}

// Test each branch
test('admin', () => { expect(getDiscount('admin')).toBe(0.5); });
test('user', () => { expect(getDiscount('user')).toBe(0.1); });
test('guest', () => { expect(getDiscount('guest')).toBe(0); });
```

## Interpreting Reports

### High Kill Score (>80%)

✅ Tests are good
✅ Most mutations caught
✅ High confidence

### Medium Kill Score (60-80%)

⚠️ Some edge cases untested
⚠️ Review "Survived" mutations
⚠️ Add more specific assertions

### Low Kill Score (<60%)

❌ Tests too generic
❌ Too many "toBeTruthy" type assertions
❌ Need rewrite

## Common Survived Mutations

```javascript
// Generic assertion - Survives mutations
expect(value).toBeTruthy();    // Could be any truthy value
expect(value).toBeDefined();   // Very permissive
expect(value).toEqual(expect.anything()); // No validation

// Better assertions - Catch mutations
expect(value).toBe(42);        // Exact match
expect(value).toEqual({ id: 1 }); // Specific structure
expect(value).toContain('error'); // Specific content
```

## Stryker HTML Report

```bash
# After running stryker
open reports/index.html
```

**Report Features:**
- Overall mutation score
- Per-file breakdown
- Survived mutations highlighted
- Color-coded by type

## Best Practices

1. **Start at 70%** - Gradually improve
2. **Focus on Critical Code** - Core business logic
3. **Don't Over-Test** - Diminishing returns after 85%
4. **Review Survivors** - Learn from missed mutations
5. **Use in CI/CD** - Fail on low scores
6. **Document Intent** - Why this test exists
7. **Balance with Time** - Mutation tests are slow

## Performance

### Speed Tips

```javascript
// stryker.conf.js
config.set({
  concurrency: 4,  // Parallel mutations
  timeout: 5000,   // Kill slow mutations faster
  maxTestsPerMutant: 3  // Limit tests per mutation
});
```

## Debugging Mutations

### See What Survived

```bash
# HTML report shows code with mutations
# Survived = red highlight
# Killed = green highlight
```

### Manually Check

```javascript
// If this survived
if (x > 0) { ... }  // Mutation: if (x >= 0)

// Add test for boundary
test('exact boundary', () => {
  expect(isBoundary(0)).toBe(false);  // Now catches >= mutation
});
```

## Troubleshooting

### "No mutations found"

Check `mutate` pattern in stryker.conf.js

### "Tests too slow"

Reduce concurrency or mutate fewer files

### "False positives"

Some mutations are equivalent (e.g., `a + b` vs `b + a`)

## Integration with CI/CD

```yaml
# .github/workflows/test.yml
- name: Run mutation tests
  run: npm run stryker
  
- name: Check score
  if: failure()
  run: echo "Mutation score too low"
```

## Next Steps

1. ✅ Run stryker on simple function
2. ✅ View HTML report
3. ✅ Find survived mutations
4. ✅ Improve tests
5. ✅ Target 80%+ kill score

## Resources

- [Stryker Documentation](https://stryker-mutator.io)
- [Configuration](https://stryker-mutator.io/docs/stryker/configuration)
- [Reporters](https://stryker-mutator.io/docs/stryker/reporters)
