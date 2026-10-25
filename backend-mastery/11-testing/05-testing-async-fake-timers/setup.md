# Module 05: Testing Async Code & Fake Timers - Setup Guide

## Quick Start (5 minutes)

```bash
# Install dependencies
npm install

# Start server
npm run dev

# Run tests
npm test

# Visit UI
open http://localhost:4005
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

**Key Packages:**
- `jest` - Testing framework
- `@sinonjs/fake-timers` - Fake timer implementation
- Express, dotenv, helmet

### 2. Environment Setup

Create `.env`:

```env
HTTP_PORT=4005
NODE_ENV=development
LOG_LEVEL=debug
```

### 3. Start Server

```bash
npm run dev
```

### 4. Run Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Specific file
npm test async.test.js
```

## Testing Async Code

### Promises

```javascript
test('resolves with data', () => {
  return fetchUser(1).then(user => {
    expect(user.name).toBe('Alice');
  });
});

test('async/await', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('Alice');
});
```

### Error Handling

```javascript
test('rejects on error', () => {
  return expect(fetchUser(999))
    .rejects
    .toThrow('Not found');
});

test('async error handling', async () => {
  try {
    await fetchUser(999);
    fail('Should have thrown');
  } catch (error) {
    expect(error.message).toContain('Not found');
  }
});
```

### Multiple Promises

```javascript
test('wait for multiple promises', async () => {
  const [users, posts] = await Promise.all([
    fetchUsers(),
    fetchPosts()
  ]);
  
  expect(users).toHaveLength(3);
  expect(posts).toHaveLength(5);
});
```

## Fake Timers

### Basic Setup

```javascript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('with fake timers', () => {
  const callback = jest.fn();
  
  setTimeout(callback, 1000);
  expect(callback).not.toHaveBeenCalled();
  
  jest.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});
```

### Testing setTimeout

```javascript
test('delayed callback', () => {
  const callback = jest.fn();
  delayedFunction(callback, 500);
  
  jest.advanceTimersByTime(500);
  expect(callback).toHaveBeenCalledTimes(1);
});
```

### Testing setInterval

```javascript
test('interval called multiple times', () => {
  const callback = jest.fn();
  
  repeatEvery(callback, 1000);
  
  jest.advanceTimersByTime(3000);
  expect(callback).toHaveBeenCalledTimes(3);
});
```

### Run All Timers

```javascript
test('run all timers at once', () => {
  const callback = jest.fn();
  
  setTimeout(callback, 1000);
  setTimeout(callback, 2000);
  
  jest.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(2);
});
```

## Real-World Patterns

### Testing Retries

```javascript
test('retry with exponential backoff', async () => {
  jest.useFakeTimers();
  
  const fn = jest.fn().mockRejectedValueOnce(new Error('fail'));
  fn.mockResolvedValueOnce({ success: true });
  
  const result = retryWithBackoff(fn, { maxRetries: 2, delay: 1000 });
  
  jest.advanceTimersByTime(1000);
  await result;
  
  expect(fn).toHaveBeenCalledTimes(2);
  
  jest.useRealTimers();
});
```

### Testing Debouncing

```javascript
test('debounce function', () => {
  jest.useFakeTimers();
  
  const callback = jest.fn();
  const debounced = debounce(callback, 500);
  
  debounced();
  debounced();
  debounced();
  
  expect(callback).not.toHaveBeenCalled();
  
  jest.advanceTimersByTime(500);
  expect(callback).toHaveBeenCalledTimes(1);
  
  jest.useRealTimers();
});
```

### Testing Polling

```javascript
test('polling stops when data found', () => {
  jest.useFakeTimers();
  
  let pollCount = 0;
  const checkData = jest.fn(() => {
    pollCount++;
    return pollCount >= 3 ? { data: 'found' } : null;
  });
  
  const pollPromise = poll(checkData, 100);
  
  // Advance each poll interval
  jest.advanceTimersByTime(100);  // 1st
  jest.advanceTimersByTime(100);  // 2nd
  jest.advanceTimersByTime(100);  // 3rd - found!
  
  expect(checkData).toHaveBeenCalledTimes(3);
  
  jest.useRealTimers();
});
```

### Testing Async/Await with Timers

```javascript
test('async sleep', async () => {
  jest.useFakeTimers();
  
  const start = Date.now();
  
  const promise = sleep(5000).then(() => 
    console.log('Slept for 5 seconds')
  );
  
  jest.advanceTimersByTime(5000);
  await promise;
  
  expect(Date.now() - start).toBe(5000);
  
  jest.useRealTimers();
});
```

## Mocking Timers

### Mock setTimeout

```javascript
test('mock setTimeout', () => {
  const spy = jest.spyOn(global, 'setTimeout');
  
  scheduleTask(() => {}, 1000);
  
  expect(spy).toHaveBeenCalledWith(expect.any(Function), 1000);
  spy.mockRestore();
});
```

### Mock Date

```javascript
test('mock current date', () => {
  const mockDate = new Date('2024-01-01');
  jest.useFakeTimers();
  jest.setSystemTime(mockDate);
  
  const result = getCurrentDate();
  expect(result).toBe('2024-01-01');
  
  jest.useRealTimers();
});
```

## Common Patterns

### Request Timeout

```javascript
test('request timeout', async () => {
  jest.useFakeTimers();
  
  const promise = requestWithTimeout(10000);
  
  jest.advanceTimersByTime(10000);
  
  await expect(promise).rejects.toThrow('Timeout');
  
  jest.useRealTimers();
});
```

### Race Condition

```javascript
test('race between promises', async () => {
  jest.useFakeTimers();
  
  const slow = sleep(5000).then(() => 'slow');
  const fast = sleep(1000).then(() => 'fast');
  
  jest.advanceTimersByTime(1000);
  
  const result = await Promise.race([slow, fast]);
  expect(result).toBe('fast');
  
  jest.useRealTimers();
});
```

## Testing the React UI

At `http://localhost:4005`:

- **Async Patterns** - Promises, async/await
- **Timers** - setTimeout, setInterval behavior
- **Retries** - Exponential backoff
- **Debounce** - Function throttling
- **Polling** - Repeated checks

## Best Practices

1. **Reset Timers** - Always call `jest.useRealTimers()` after
2. **Use Fake Timers Sparingly** - Not all tests need fake timers
3. **Test Both Success and Timeout** - Cover both paths
4. **Verify Cleanup** - Ensure intervals/timeouts cleared
5. **Document Intent** - Comment why fake timers needed
6. **Mock External APIs** - With fake timers
7. **Advance Explicitly** - Better than `runAllTimers()`

## Troubleshooting

### "Timeout: Async callback was not called"

Add `jest.runAllTimers()` before async completion:

```javascript
test('async with timer', async () => {
  jest.useFakeTimers();
  const promise = delayedAsync(1000);
  jest.runOnlyPendingTimers();
  await promise;
  jest.useRealTimers();
});
```

### "Cannot find running timer"

Check fake timers are enabled:

```javascript
beforeEach(() => {
  jest.useFakeTimers();
});
```

## Cleanup Pattern

```javascript
afterEach(() => {
  // Clean up any pending timers
  jest.clearAllTimers();
  // Switch back to real timers
  jest.useRealTimers();
});
```

## Next Steps

1. ✅ Test basic async/await
2. ✅ Experiment with fake timers
3. ✅ Test retry logic
4. ✅ Test debounce/throttle
5. ✅ Test polling patterns

## Resources

- [Jest Timers](https://jestjs.io/docs/timer-mocks)
- [Jest Async](https://jestjs.io/docs/asynchronous-code)
- [Promise Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
