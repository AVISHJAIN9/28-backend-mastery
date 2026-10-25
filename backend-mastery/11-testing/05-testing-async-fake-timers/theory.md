# Testing Async & Fake Timers - Theory

## Challenges of Testing Async Code

### Real-Time Issues
```javascript
// ❌ Problem: Test completes before async operation
test('should fetch user', () => {
  fetchUser(1).then(user => {
    expect(user).toBeDefined(); // Never runs!
  });
});

// ✅ Solution: Return the promise
test('should fetch user', () => {
  return fetchUser(1).then(user => {
    expect(user).toBeDefined();
  });
});

// ✅ Better: Use async/await
test('should fetch user', async () => {
  const user = await fetchUser(1);
  expect(user).toBeDefined();
});
```

## Patterns for Testing Async Code

### Pattern 1: Async/Await
```javascript
test('should fetch and process user', async () => {
  const user = await fetchUser(1);
  const processed = await processUser(user);
  expect(processed.verified).toBe(true);
});
```

### Pattern 2: Chained Promises
```javascript
test('should chain promises', () => {
  return fetchUser(1)
    .then(user => processUser(user))
    .then(result => {
      expect(result.success).toBe(true);
    });
});
```

### Pattern 3: Promise.all
```javascript
test('should fetch multiple users in parallel', async () => {
  const [user1, user2, user3] = await Promise.all([
    fetchUser(1),
    fetchUser(2),
    fetchUser(3)
  ]);
  expect(user1).toBeDefined();
});
```

### Pattern 4: Error Handling
```javascript
test('should handle fetch failure', async () => {
  await expect(fetchUser(99999))
    .rejects
    .toThrow('Not found');
});
```

## Fake Timers Overview

Fake timers allow you to control time in tests, making them fast and deterministic.

### Real vs Fake Timers
| Aspect | Real | Fake |
|--------|------|------|
| **Speed** | 1 sec test = 1 sec | 1 sec test = instant |
| **Reliability** | Flaky | Reliable |
| **Setup** | Simple | Requires setup |
| **Debug** | Real behavior | Simplified |

## Using Fake Timers

### Basic Setup
```javascript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});
```

### Controlling Time
```javascript
test('should trigger after delay', () => {
  jest.useFakeTimers();
  
  const callback = jest.fn();
  setTimeout(callback, 1000);
  
  // No time has passed yet
  expect(callback).not.toHaveBeenCalled();
  
  // Advance time by 500ms
  jest.advanceTimersByTime(500);
  expect(callback).not.toHaveBeenCalled();
  
  // Advance time by 500ms more (total 1000ms)
  jest.advanceTimersByTime(500);
  expect(callback).toHaveBeenCalled();
  
  jest.useRealTimers();
});
```

### Running All Timers
```javascript
test('should run all timers', () => {
  jest.useFakeTimers();
  
  const callback1 = jest.fn();
  const callback2 = jest.fn();
  
  setTimeout(callback1, 1000);
  setTimeout(callback2, 5000);
  
  // Run all pending timers at once
  jest.runAllTimers();
  
  expect(callback1).toHaveBeenCalled();
  expect(callback2).toHaveBeenCalled();
  
  jest.useRealTimers();
});
```

## Testing Delayed Operations

### Retry Logic
```javascript
function retryOperation(fn, maxAttempts = 3) {
  let attempt = 0;
  
  const retry = () => {
    attempt++;
    return fn().catch(error => {
      if (attempt < maxAttempts) {
        return new Promise(resolve => {
          setTimeout(() => resolve(retry()), 1000);
        });
      }
      throw error;
    });
  };
  
  return retry();
}

test('should retry failed operation', async () => {
  jest.useFakeTimers();
  
  let attemptCount = 0;
  const operation = jest.fn(() => {
    attemptCount++;
    if (attemptCount < 3) {
      return Promise.reject(new Error('Failed'));
    }
    return Promise.resolve('Success');
  });
  
  const promise = retryOperation(operation);
  
  // Advance through first retry delay
  jest.advanceTimersByTime(1000);
  // Advance through second retry delay
  jest.advanceTimersByTime(1000);
  
  const result = await promise;
  expect(result).toBe('Success');
  expect(operation).toHaveBeenCalledTimes(3);
  
  jest.useRealTimers();
});
```

### Debouncing
```javascript
function debounce(fn, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

test('should debounce function calls', () => {
  jest.useFakeTimers();
  
  const fn = jest.fn();
  const debounced = debounce(fn, 500);
  
  debounced('first');
  expect(fn).not.toHaveBeenCalled();
  
  debounced('second');
  expect(fn).not.toHaveBeenCalled();
  
  jest.advanceTimersByTime(500);
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith('second');
  
  jest.useRealTimers();
});
```

### Polling
```javascript
test('should poll until condition met', async () => {
  jest.useFakeTimers();
  
  let data = null;
  let callCount = 0;
  
  const poll = async () => {
    callCount++;
    if (callCount === 3) {
      data = { ready: true };
    }
    return data;
  };
  
  // Poll every 100ms
  let attempts = 0;
  while (!data && attempts < 5) {
    await poll();
    jest.advanceTimersByTime(100);
    attempts++;
  }
  
  expect(data).toBeDefined();
  expect(callCount).toBe(3);
  
  jest.useRealTimers();
});
```

## Advanced Timer Patterns

### Modern Timer API
```javascript
// Jest 27+
test('with modern timer', () => {
  jest.useFakeTimers('modern');
  // More reliable for Promise-based code
  jest.useRealTimers();
});
```

### Jest advanceTimersByTimeAsync
```javascript
test('should handle async with fake timers', async () => {
  jest.useFakeTimers();
  
  const callback = jest.fn();
  
  setTimeout(async () => {
    await someAsyncOp();
    callback();
  }, 1000);
  
  jest.advanceTimersByTime(1000);
  await jest.runAllTimersAsync();
  
  expect(callback).toHaveBeenCalled();
  jest.useRealTimers();
});
```

## Common Mistakes

### ❌ Mistake 1: Forgetting to Restore
```javascript
// BAD - timers not restored
test('one test', () => {
  jest.useFakeTimers();
  // Test runs with fake timers
});

// NEXT test might fail - still using fake timers!
```

### ✅ Solution: Always Restore
```javascript
afterEach(() => {
  jest.useRealTimers();
});
```

### ❌ Mistake 2: Not Awaiting Async
```javascript
// BAD - async operation not awaited
test('should process data', () => {
  jest.useFakeTimers();
  const promise = delayedProcessing();
  jest.advanceTimersByTime(1000);
  // promise might not be resolved!
});

// GOOD - await the result
test('should process data', async () => {
  jest.useFakeTimers();
  const promise = delayedProcessing();
  jest.advanceTimersByTime(1000);
  await expect(promise).resolves.toBeDefined();
  jest.useRealTimers();
});
```

### ❌ Mistake 3: Mixing Real and Fake
```javascript
// BAD - inconsistent timer usage
test('test 1', () => {
  jest.useFakeTimers();
});

test('test 2', () => {
  setTimeout(() => {}, 1000); // Is this real or fake?
});
```

## Best Practices

1. **Use async/await** - Clearest asynchronous code
2. **Always return promises** - If not using async/await
3. **Set up/tear down timers** - In beforeEach/afterEach
4. **Test error cases** - Promise rejections matter
5. **Use realistic delays** - Don't test with 0 timeouts
6. **Mock external async calls** - Don't call real APIs
7. **Clean up timers** - Prevent memory leaks
8. **Document timer expectations** - Why delays exist
9. **Test retry logic** - Exponential backoff, max attempts
10. **Consider real delays** - For E2E tests, use real timers

## When to Use Fake Timers

| Scenario | Use Fake |
|----------|----------|
| Unit tests | ✅ Yes |
| Integration tests | Maybe |
| E2E tests | ❌ No |
| Delay testing | ✅ Yes |
| Rate limiting | ✅ Yes |
| Polling | ✅ Yes |
| Retry logic | ✅ Yes |
| Real world | ❌ No |

## Conclusion

Testing asynchronous code requires proper handling of promises and async operations. Combined with fake timers, you can test time-dependent code quickly and reliably. Master these patterns to write robust async tests that catch real bugs.

