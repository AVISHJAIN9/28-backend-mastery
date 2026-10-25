# Mutation Testing with Stryker - Theory

## What is Mutation Testing?

Mutation testing evaluates test quality by introducing small bugs (mutations) into code and checking if tests catch them. A good test suite should kill (detect) most mutations.

### The Problem It Solves

```
100% Coverage ≠ Good Tests

// 100% coverage but bad tests
function add(a, b) {
  return a - b;  // WRONG!
}

test('add works', () => {
  expect(add(2, 2)).toBe(4);  // TEST NEVER RUNS!
});
```

Mutation testing catches this:

```
Original:  a + b
Mutant 1:  a - b    ← Test should catch this
Mutant 2:  a * b    ← Test should catch this
Mutant 3:  a / b    ← Test should catch this
```

If test passes for Mutant 1, mutation is killed (test is good).

## Mutation Types

### Arithmetic Mutations

```javascript
// Original
return a + b;

// Mutations
return a - b;     // ± mutator
return a * b;     // replaced with *
return a / b;     // replaced with /
return a % b;     // replaced with %
return a ** b;    // replaced with **
```

### Comparison Mutations

```javascript
// Original
if (age > 18) { ... }

// Mutations
if (age >= 18) { ... }
if (age < 18) { ... }
if (age <= 18) { ... }
if (age === 18) { ... }
if (age !== 18) { ... }
```

### Logical Mutations

```javascript
// Original
if (isAdmin && isActive) { ... }

// Mutations
if (isAdmin || isActive) { ... }  // && → ||
if (isAdmin) { ... }              // remove isActive
if (isActive) { ... }             // remove isAdmin
```

### Return Value Mutations

```javascript
// Original
return true;

// Mutations
return false;
return undefined;
return null;
```

## Stryker Setup

### Installation

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
npx stryker init  # Generates stryker.conf.js
```

### Configuration

```javascript
// stryker.conf.js
module.exports = function(config) {
  config.set({
    testRunner: 'jest',
    testFramework: 'jest',
    mutator: 'typescript',
    reporters: ['html', 'dashboard'],
    files: ['src/**/*.js', '!src/**/*.test.js'],
    mutate: ['src/**/*.js', '!src/**/*.test.js'],
    thresholds: {
      high: 80,
      medium: 60,
      low: 0
    },
    concurrency: 4
  });
};
```

### Running Stryker

```bash
npx stryker run
```

## Understanding Results

### Kill Score

```
Kill Score = (Killed Mutations / Total Mutations) × 100

Example:
- Total mutations: 50
- Killed: 40
- Survived: 10
- Kill Score: 80%
```

### Report Output

```
✓ Killed     - Test caught the mutation
✗ Survived   - Test missed the mutation (bad!)
⊘ Timeout    - Mutation caused infinite loop
∅ No Coverage - No test exercises this code
~ Ignored    - Stryker excluded mutation
```

## Example: Finding Bad Tests

### Code With Mutation

```javascript
// discount.js
function applyDiscount(price, discountPercent) {
  const discount = price * (discountPercent / 100);
  return price - discount;
}
```

### Bad Test

```javascript
test('should apply discount', () => {
  const result = applyDiscount(100, 10);
  expect(result).toBeDefined();  // Only checks existence!
});
```

Mutation: `price - discount` → `price + discount`
Result: ✗ Survived (test didn't check actual value)

### Good Test

```javascript
test('should apply 10% discount to 100', () => {
  const result = applyDiscount(100, 10);
  expect(result).toBe(90);  // Precise assertion
});

test('should apply 50% discount to 200', () => {
  const result = applyDiscount(200, 50);
  expect(result).toBe(100);
});
```

Both mutations caught.

## Best Practices

### 1. Test Edge Cases

```javascript
// GOOD - covers edge cases
test('discount with 0%', () => {
  expect(applyDiscount(100, 0)).toBe(100);
});

test('discount with 100%', () => {
  expect(applyDiscount(100, 100)).toBe(0);
});

test('negative price', () => {
  expect(() => applyDiscount(-10, 10)).toThrow();
});
```

### 2. Use Specific Assertions

```javascript
// BAD
expect(value).toBeDefined();
expect(value).toEqual(expect.anything());
expect(value).not.toBeNull();

// GOOD
expect(value).toBe(42);
expect(value).toStrictEqual({ id: 1 });
expect(value).toContain('specific string');
```

### 3. Test Boundaries

```javascript
function validateAge(age) {
  return age >= 18 && age <= 100;
}

// GOOD - tests boundaries
test('age exactly 18 is valid', () => {
  expect(validateAge(18)).toBe(true);
});

test('age below 18 is invalid', () => {
  expect(validateAge(17)).toBe(false);
});

test('age 100 is valid', () => {
  expect(validateAge(100)).toBe(true);
});

test('age above 100 is invalid', () => {
  expect(validateAge(101)).toBe(false);
});
```

### 4. Test All Branches

```javascript
function getDiscount(role) {
  if (role === 'admin') return 0.5;    // 50%
  if (role === 'member') return 0.2;   // 20%
  return 0;                             // no discount
}

// GOOD - tests all paths
test('admin gets 50% discount', () => {
  expect(getDiscount('admin')).toBe(0.5);
});

test('member gets 20% discount', () => {
  expect(getDiscount('member')).toBe(0.2);
});

test('guest gets no discount', () => {
  expect(getDiscount('guest')).toBe(0);
});
```

### 5. Avoid Generic Assertions

```javascript
// BAD - won't catch mutations
if (result) { /* passes */ }        // Too generic
if (result !== undefined) { }       // Still generic
if (result.length) { }              // Only checks length

// GOOD - specific
if (result === 42) { }
if (Array.isArray(result) && result.length === 3) { }
if (result.status === 'success') { }
```

## Interpreting Reports

### High Kill Score (>80%)

✓ Tests are comprehensive
✓ Most mutations caught
✓ Good test quality

### Medium Kill Score (60-80%)

⚠ Some edge cases untested
⚠ Review "Survived" mutations
⚠ Add more specific assertions

### Low Kill Score (<60%)

✗ Tests too generic
✗ Many assertions pass/fail
✗ Tests need rewrite

## Common Mutations That Survive

```javascript
// 1. Generic assertions
expect(value).toBeTruthy();  // Survives mutations to falsy values

// 2. Missing boundary tests
if (x > 0) { }  // Mutation to >= not caught

// 3. Incomplete coverage
if (admin || user) { }
// Test only checks admin path

// 4. Not verifying return values
fn();
// Mutation to return nothing not caught
```

## Stryker HTML Report

After running `stryker run`:

```
✓ Green - Killed (good)
✗ Red   - Survived (bad)
⊘ Gray  - Not covered
```

Click code to see mutations that survived.

## Conclusion

Mutation testing reveals weak tests that have high coverage but don't actually verify behavior. Use it to:

1. Find generic assertions
2. Identify missing edge cases
3. Improve test quality metrics
4. Build confidence in test suite

Aim for 70%+ kill score to be confident tests catch real bugs.
