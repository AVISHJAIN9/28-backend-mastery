# async/await Patterns Theory

## What is async/await?

Syntactic sugar over Promises.

```javascript
// Promise style
function getUser() {
  return fetch('/api/user')
    .then(r => r.json())
    .then(user => user);
}

// async/await style
async function getUser() {
  const r = await fetch('/api/user');
  const user = await r.json();
  return user;
}
```

## Async Function

### Returns Promise
```javascript
async function test() {
  return 42;
}

// Returns Promise<42>
test().then(result => console.log(result)); // 42
```

### Always Promise
```javascript
// Even if no await used
async function simple() {
  return 42;
}

// Equivalent to:
function simpleEquivalent() {
  return Promise.resolve(42);
}
```

## Await

### Waits for Promise
```javascript
async function test() {
  const user = await getUser(); // Pauses here
  console.log(user); // Resumes after promise resolves
}
```

### Unwraps Promise
```javascript
// Promise<number>
const promise = Promise.resolve(42);

// number
const value = await promise;
```

### Only Works in async
```javascript
// ❌ Invalid
const value = await promise;

// ✅ Valid
async function test() {
  const value = await promise;
}
```

## Error Handling

### try/catch
```javascript
async function getUser() {
  try {
    const response = await fetch('/api/user');
    const user = await response.json();
    return user;
  } catch (err) {
    console.error('Failed:', err.message);
    throw err;
  }
}
```

### Cleanup with finally
```javascript
async function operation() {
  try {
    const connection = await db.connect();
    const data = await connection.query();
    return data;
  } finally {
    await connection.close(); // Always runs
  }
}
```

## Parallel Execution

### Sequential (Slow)
```javascript
// Takes 2+ seconds
async function getDataSequential() {
  const user = await getUser();    // 1 second
  const posts = await getUserPosts(); // 1 second
  return { user, posts };           // 2 seconds
}
```

### Parallel (Fast)
```javascript
// Takes 1+ seconds
async function getDataParallel() {
  const [user, posts] = await Promise.all([
    getUser(),           // Starts immediately
    getUserPosts()       // Starts immediately
  ]);                    // Both ~1 second
  return { user, posts };
}
```

## Promise.all Patterns

### Basic
```javascript
async function test() {
  const [a, b, c] = await Promise.all([
    promise1,
    promise2,
    promise3
  ]);
}
```

### With Results
```javascript
async function test() {
  const results = await Promise.all(
    users.map(user => fetchUserData(user.id))
  );
  // All completed successfully
}
```

### Error Handling
```javascript
async function test() {
  try {
    await Promise.all([
      operation1(),
      operation2(), // If this fails
      operation3()  // operation3 still runs (not cancelled)
    ]);
  } catch (err) {
    // One failed, thrown here
  }
}
```

## Promise.race

### First Completes
```javascript
async function getWithTimeout() {
  const result = await Promise.race([
    fetch('/api/data'),
    delay(5000).then(() => {throw new Error('Timeout')})
  ]);
  return result;
}
```

## Modern Patterns

### Promise.allSettled
```javascript
async function test() {
  const results = await Promise.allSettled([
    promise1,
    promise2,
    promise3
  ]);
  
  // All complete (success or fail)
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      console.log(result.value);
    } else {
      console.error(result.reason);
    }
  });
}
```

### Promise.any
```javascript
async function test() {
  const result = await Promise.any([
    fetch('server1.com'),
    fetch('server2.com'),
    fetch('server3.com')
  ]);
  // First successful (ignores failures)
}
```

## Anti-Patterns

### ❌ Not Parallel
```javascript
async function bad() {
  const a = await fetchA();        // 1s
  const b = await fetchB();        // 1s
  const c = await fetchC();        // 1s
  return { a, b, c };              // 3s
}

// ✅ Parallel
async function good() {
  const [a, b, c] = await Promise.all([
    fetchA(), fetchB(), fetchC()    // 1s
  ]);
  return { a, b, c };
}
```

### ❌ Forgetting return
```javascript
async function test() {
  try {
    return await operation();
  } catch {}
  // Silently fails if operation throws
}

// ✅ Proper
async function test() {
  try {
    return await operation();
  } catch (err) {
    throw err; // Rethrow
  }
}
```

### ❌ Async Event Handler
```javascript
// ❌ Error swallowed
button.addEventListener('click', async () => {
  throw new Error('Oops');
  // Error lost
});

// ✅ Catch it
button.addEventListener('click', async () => {
  try {
    // operation
  } catch (err) {
    console.error(err);
  }
});
```

## Common Patterns

### Retry Logic
```javascript
async function retryWithBackoff(fn, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxAttempts - 1) throw err;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

### Map with Concurrency Control
```javascript
async function mapWithConcurrency(items, fn, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(fn)
    );
    results.push(...chunkResults);
  }
  return results;
}
```

### Timeout Wrapper
```javascript
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
}

// Usage
await withTimeout(fetch('/api/data'), 5000);
```

## Best Practices

✅ Use async/await for readability
✅ Parallelize independent operations
✅ Proper error handling with try/catch
✅ Avoid deep nesting
✅ Handle errors from Promise.all
✅ Don't await in loops (use Promise.all)
✅ Add timeouts to prevent hanging
✅ Return in try block
✅ Use finally for cleanup
✅ Test error paths
