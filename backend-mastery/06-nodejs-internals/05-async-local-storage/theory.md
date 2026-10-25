# AsyncLocalStorage Theory

## What is AsyncLocalStorage?

A way to store data that follows async contexts.

### The Problem
```
Middleware sets user data
Later, in async handler, need user data
But async breaks context...

// ❌ Doesn't work reliably
app.use((req, res, next) => {
  req.userId = 123;
  next();
});

// Later in database call
db.find().then(() => {
  console.log(req.userId); // Lost!
});
```

### Solution: AsyncLocalStorage
```javascript
const { AsyncLocalStorage } = require('async_hooks');
const storage = new AsyncLocalStorage();

// Store data
storage.run({ userId: 123 }, () => {
  // Available in all async calls within this context
  db.find().then(() => {
    console.log(storage.getStore().userId); // 123!
  });
});
```

## How It Works

### Context Propagation
```
Main thread creates storage
├─ Context 1 (userId: 1)
│  ├─ Async operation A
│  ├─ Async operation B
│  └─ All see userId: 1
├─ Context 2 (userId: 2)
│  ├─ Async operation C
│  └─ All see userId: 2
└─ Each async chain remembers its context
```

## Basic Usage

### Setting Up
```javascript
const { AsyncLocalStorage } = require('async_hooks');

class RequestContext {
  constructor(userId, requestId) {
    this.userId = userId;
    this.requestId = requestId;
  }
}

const storage = new AsyncLocalStorage();
```

### Storing Data
```javascript
app.use((req, res, next) => {
  const ctx = new RequestContext(req.user.id, req.id);
  
  storage.run(ctx, () => {
    next();
  });
});
```

### Retrieving Data
```javascript
// From anywhere in that request chain
const ctx = storage.getStore();
console.log(ctx.userId); // Available!
```

## Real-World Example: Logging

### Without AsyncLocalStorage
```javascript
// Must pass requestId manually through all functions
function handle(req, res) {
  const requestId = req.id;
  
  getUserData(requestId, (data) => {
    saveData(requestId, data, () => {
      console.log('Done:', requestId);
    });
  });
}

// ❌ Tedious to pass everywhere
```

### With AsyncLocalStorage
```javascript
const storage = new AsyncLocalStorage();

function logger(msg) {
  const ctx = storage.getStore();
  console.log(`[${ctx.requestId}] ${msg}`);
}

app.use((req, res, next) => {
  storage.run({ requestId: req.id }, () => {
    next();
  });
});

app.get('/data', async (req, res) => {
  logger('Fetching data'); // Auto includes requestId
  const data = await db.find();
  logger('Data fetched');  // Auto includes requestId
  res.json(data);
});
```

## Async Context Preservation

### Promises
```javascript
const { AsyncLocalStorage } = require('async_hooks');
const storage = new AsyncLocalStorage();

storage.run({ id: 1 }, () => {
  Promise.resolve()
    .then(() => {
      console.log(storage.getStore().id); // 1
    });
});
```

### Callbacks
```javascript
storage.run({ id: 2 }, () => {
  setTimeout(() => {
    console.log(storage.getStore().id); // 2
  }, 100);
});
```

### async/await
```javascript
storage.run({ id: 3 }, async () => {
  await somePromise();
  console.log(storage.getStore().id); // 3
});
```

## Nested Contexts

### Context Isolation
```javascript
storage.run({ id: 1 }, () => {
  console.log(storage.getStore().id); // 1
  
  storage.run({ id: 2 }, () => {
    console.log(storage.getStore().id); // 2 (shadowed)
  });
  
  console.log(storage.getStore().id); // 1 (restored)
});
```

## Error Handling

### Preserves Context
```javascript
storage.run({ userId: 123 }, () => {
  Promise.reject('Error!')
    .catch(() => {
      // Context still available!
      logger('Error occurred');
    });
});
```

## Use Cases

### 1. Request Tracking
```javascript
storage.run({ 
  requestId: uuid(),
  userId: req.user.id,
  ip: req.ip
}, () => {
  // Use context throughout request lifecycle
});
```

### 2. Multi-Tenancy
```javascript
storage.run({ 
  tenantId: req.tenantId,
  database: getDatabaseForTenant(req.tenantId)
}, () => {
  // All queries automatically use correct tenant
});
```

### 3. Transaction Management
```javascript
storage.run({ 
  transactionId: uuid(),
  connection: db.getConnection()
}, () => {
  // All operations use same transaction/connection
});
```

## Performance Considerations

### Memory Overhead
```
Each context: ~100 bytes
1000 concurrent requests: ~100KB
Acceptable for most applications
```

### Lookup Speed
```
O(1) constant time
getStore() very fast
No performance penalty
```

## Best Practices

✅ Create storage at module level
✅ Use for request-scoped data
✅ Wrap entire request handler
✅ Consistent context structure
✅ Document what's in context
✅ Clean up context on error
✅ Test async context flow
✅ Don't put huge objects
✅ Use for logging/tracing
✅ Consider Thread Local Storage in native modules
