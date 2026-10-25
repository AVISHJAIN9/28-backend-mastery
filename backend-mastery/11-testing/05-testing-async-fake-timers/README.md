# 05 - Testing Async Code & Fake Timers

## Overview  
Master testing asynchronous code and controlling time in tests with fake timers.

## What You'll Learn
- **Async/Await** - Testing promise-based code
- **Fake Timers** - Controlling time progression
- **Jest Fake Timers** - jest.useFakeTimers()
- **Time Control** - jest.advanceTimersByTime()
- **Callbacks** - Testing delayed callbacks
- **Timeouts & Intervals** - Mocking time-based operations

## Key Concepts

### Testing Promises
```javascript
test('async function', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### Fake Timers
```javascript
jest.useFakeTimers();
jest.advanceTimersByTime(1000);
jest.useRealTimers();
```

### Testing Delays
```javascript
jest.useFakeTimers();
const promise = delay(5000);
jest.advanceTimersByTime(5000);
await expect(promise).resolves.toUndefined();
```

## Use Cases
1. Retry logic with delays
2. Polling/polling cleanup
3. Debouncing
4. Throttling
5. Timeouts
6. Intervals

## Common Patterns
1. beforeEach - Enable fake timers
2. afterEach - Reset timers
3. jest.runAllTimers() - Run all pending
4. jest.runOnlyPendingTimers() - Run queued
5. jest.advanceTimersByTime() - Fast-forward

## API Scenarios
- Retry failed requests
- Auto-refresh data  
- Cleanup timeouts
- Batch operations
- Rate limiting

## Challenges Covered
1. Testing setTimeout
2. Testing setInterval  
3. Promise chains
4. Cleanup handlers
5. Mixed async patterns
