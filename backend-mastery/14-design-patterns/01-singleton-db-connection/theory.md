# Singleton Pattern: Database Connection

## What is the Singleton Pattern?

The **Singleton Pattern** is a creational design pattern that restricts the instantiation of a class to a single object. This ensures that only one instance of a class exists throughout the application lifecycle.

## Key Characteristics

1. **Private Constructor** - Prevents external instantiation
2. **Static Instance** - Holds the single instance
3. **Public Access Method** - Provides global access to the instance (usually `getInstance()`)
4. **Lazy Initialization** - Instance created on first use (optional)
5. **Thread-Safe** - Prevents race conditions in concurrent environments

## Real-World Analogy

Imagine a government office that issues licenses:
- There's only one database of all licenses issued
- Multiple clerks access the same database
- No duplicate or conflicting databases exist
- The database is shared across all departments

## Why Use Singleton Pattern?

### 1. **Controlled Access**
```javascript
// Without Singleton - Multiple instances cause conflicts
const db1 = new Database('server1');
const db2 = new Database('server2');
// Two different connections, inconsistent state!

// With Singleton - Single instance
const db = Database.getInstance();
// Always the same instance
```

### 2. **Resource Management**
Database connections are expensive resources:
- Opening 100 connections is wasteful
- One connection shared is efficient
- Reduces memory usage and network overhead

### 3. **Shared State**
```javascript
// All parts of app share same state
const db = Database.getInstance();
db.setUser('Alice');

// In another part of app
const db2 = Database.getInstance();
console.log(db2.getUser()); // 'Alice' - same instance!
```

## Singleton Pattern Implementation

### Basic JavaScript Implementation

```javascript
class Database {
  static instance = null;

  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    this.connection = null;
    this.isConnected = false;
    Database.instance = this;
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  connect() {
    this.isConnected = true;
    console.log('Connected to database');
  }

  disconnect() {
    this.isConnected = false;
    console.log('Disconnected from database');
  }

  query(sql) {
    if (!this.isConnected) throw new Error('Not connected');
    return `Executing: ${sql}`;
  }
}

// Usage
const db1 = Database.getInstance();
db1.connect();

const db2 = Database.getInstance();
console.log(db1 === db2); // true - same instance!
```

### Lazy Initialization Pattern

```javascript
class DatabasePool {
  static _instance = null;

  constructor() {
    this.connections = [];
    this.activeConnections = 0;
    this.maxConnections = 10;
  }

  static getInstance() {
    if (DatabasePool._instance === null) {
      DatabasePool._instance = new DatabasePool();
      console.log('Database pool created');
    }
    return DatabasePool._instance;
  }

  getConnection() {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return { id: this.activeConnections };
    }
    throw new Error('Connection pool exhausted');
  }

  releaseConnection() {
    this.activeConnections--;
  }
}

const pool1 = DatabasePool.getInstance();
const pool2 = DatabasePool.getInstance();
console.log(pool1 === pool2); // true
```

## Module Pattern (Modern Singleton)

```javascript
const databaseModule = (() => {
  let instance;

  function createInstance() {
    return {
      connect: () => console.log('Connected'),
      query: (sql) => `Executing: ${sql}`,
      disconnect: () => console.log('Disconnected')
    };
  }

  return {
    getInstance: () => {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

const db = databaseModule.getInstance();
```

## Benefits & Drawbacks

### Benefits ✅
| Benefit | Explanation |
|---------|-------------|
| **Global Access** | Available throughout the application |
| **Single Instance** | Prevents multiple conflicting instances |
| **Resource Efficient** | No duplicate expensive resources |
| **Lazy Initialization** | Created only when needed |
| **Thread-Safe** | Controlled instantiation |

### Drawbacks ❌
| Drawback | Explanation |
|----------|-------------|
| **Testing Difficulty** | Hard to mock/stub for unit tests |
| **Hidden Dependencies** | Global state makes dependencies implicit |
| **Concurrency Issues** | Can cause race conditions in multi-threaded environments |
| **Tight Coupling** | Code becomes tightly coupled to singleton |
| **Memory Leak Risk** | Single instance lives entire application lifetime |

## Testing Challenges

### Problem: Testing with Singleton
```javascript
// Hard to test because getInstance() always returns same instance
it('should connect to database', () => {
  const db = Database.getInstance(); // Always same instance!
  db.connect();
  expect(db.isConnected).toBe(true);
  
  // Next test gets polluted state
  it('should disconnect', () => {
    const db = Database.getInstance(); // Same instance, still connected!
    db.disconnect();
  });
});
```

### Solution: Dependency Injection
```javascript
// Better approach - inject the dependency
class UserService {
  constructor(database) {
    this.database = database;
  }

  getUser(id) {
    return this.database.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// Testing
const mockDb = { query: () => 'mock user' };
const service = new UserService(mockDb);
expect(service.getUser(1)).toBe('mock user');
```

## Common Use Cases

### 1. **Database Connections**
```javascript
const db = Database.getInstance();
// Reuse single connection throughout app
```

### 2. **Logger/Configuration**
```javascript
const logger = Logger.getInstance();
const config = Config.getInstance();
// Shared logging and configuration
```

### 3. **Cache Manager**
```javascript
const cache = Cache.getInstance();
// Single cache for entire application
```

### 4. **Thread Pools**
```javascript
const threadPool = ThreadPool.getInstance();
// Manage limited threads across application
```

## Anti-Patterns & When NOT to Use

### ❌ Overusing Singleton
```javascript
// BAD - Every class is singleton
class User { static getInstance() { ... } }
class Post { static getInstance() { ... } }
class Comment { static getInstance() { ... } }
// Results in hidden dependencies and untestable code!
```

### ❌ Using Singleton for Everything
```javascript
// BAD
const errorTracker = ErrorTracker.getInstance();
const analytics = Analytics.getInstance();
const statusUpdater = StatusUpdater.getInstance();
// Better: Use dependency injection instead
```

## Best Practices

1. **Use Sparingly** - Only for truly single-instance resources
2. **Document Clearly** - Mark classes as singletons
3. **Consider Dependency Injection** - More testable
4. **Provide Reset Method** - Useful for testing
5. **Thread-Safety** - Use proper locking mechanisms
6. **Avoid for Business Logic** - Use only for infrastructure

## Comparison with Other Patterns

| Pattern | Purpose | Instances |
|---------|---------|-----------|
| Singleton | Single instance | 1 |
| Factory | Create objects | Many |
| Builder | Complex objects | Many |
| Prototype | Clone objects | Many |

## Real-World Examples

### Node.js Module Caching (Built-in Singleton)
```javascript
// In database.js
let instance = null;

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new Database();
    }
    return instance;
  }
};

// Node.js caches require() results
// So you get singleton behavior automatically!
const db = require('./database').getInstance();
```

### Express Application Instance
```javascript
const app = express();
// Express app is effectively a singleton
// One app instance for the entire server
```

## Summary

- **Singleton Pattern** ensures only one instance exists
- Perfect for **stateful resources** like databases
- Use **dependency injection** for better testability
- **Avoid overuse** - may indicate design issues
- Node.js **module caching** provides singleton-like behavior
