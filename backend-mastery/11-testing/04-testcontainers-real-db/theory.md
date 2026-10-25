# Testcontainers: Real Database Testing - Theory

## What are Testcontainers?

Testcontainers is a library that provides lightweight, throwaway instances of common databases, message brokers, and other services using Docker. This allows you to run tests against real databases without complex setup.

## Why Use Real Databases in Tests?

### vs Mocked Databases
| Aspect | Real DB | Mocked DB |
|--------|---------|-----------|
| **Realism** | Complete | Limited |
| **Constraints** | Real | Faked |
| **Performance** | Slower | Faster |
| **Bugs Found** | More | Fewer |
| **Setup** | Docker needed | Simple |

### Real Database Benefits
1. **Accurate Testing** - Test actual constraints and triggers
2. **SQL Validation** - Catch query errors early
3. **Integrity Checks** - Database constraints enforced
4. **Performance Insight** - Real query performance
5. **Confidence** - Know it works in production

## Architecture

### Test Execution Flow
```
Test Start
  ↓
Container Starts (1-2 sec)
  ↓
Database Migrations Run
  ↓
Test Executes
  ↓
Assertions Made
  ↓
Data Verified in Real DB
  ↓
Container Cleanup
```

## Supported Databases

### PostgreSQL
```javascript
GenericContainer('postgres:15')
  .withEnvironment({ POSTGRES_DB: 'test' })
  .withExposedPorts(5432)
```

### MySQL
```javascript
GenericContainer('mysql:8')
  .withEnvironment({ MYSQL_ROOT_PASSWORD: 'root' })
```

### MongoDB
```javascript
GenericContainer('mongo:6')
  .withExposedPorts(27017)
```

### Redis
```javascript
GenericContainer('redis:7-alpine')
  .withExposedPorts(6379)
```

## Setup Patterns

### Pattern 1: Single Container for All Tests
```javascript
let container;

beforeAll(async () => {
  container = await new GenericContainer('postgres:15')
    .withEnvironment({ POSTGRES_DB: 'test' })
    .start();
  
  // Setup schema once
  await runMigrations(container);
});

afterAll(async () => {
  await container.stop();
});

beforeEach(async () => {
  // Clean data before each test
 await container.exec(['psql', '-c', 'TRUNCATE all tables']);
});
```

### Pattern 2: Fresh Container per Test
```javascript
test('should save user', async () => {
  const container = await new GenericContainer('postgres:15')
    .start();
  
  try {
    // Run test
  } finally {
    await container.stop();
  }
});
```

### Pattern 3: Shared Container with Transactions
```javascript
beforeEach(async () => {
  connection = await container.connect();
  await connection.query('BEGIN TRANSACTION');
});

afterEach(async () => {
  await connection.query('ROLLBACK');
  await connection.end();
});
```

## Common Operations

### Running Migrations
```javascript
const migrationScript = `
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE
  );
`;

await container.exec(['psql', '-d', 'test', '-c', migrationScript]);
```

### Seeding Data
```javascript
const seedData = `
  INSERT INTO users (name, email) VALUES ('Alice', 'alice@test.com');
  INSERT INTO users (name, email) VALUES ('Bob', 'bob@test.com');
`;

await container.exec(['psql', '-d', 'test', '-c', seedData]);
```

### Verifying Data
```javascript
const result = await connection.query('SELECT * FROM users');
expect(result.rows).toHaveLength(1);
expect(result.rows[0].name).toBe('Alice');
```

## Performance Optimization

### 1. Container Reuse
```javascript
// Fast: Reuse container across tests
const container = await startContainer(); // Start once

// Slow: New container per test
test('test 1', async () => {
  const c1 = await startContainer(); // Restarts
  // ...
});
```

### 2. Transaction Rollback
```javascript
// Fast: Rollback transactions
beforeEach(() => transaction.begin());
afterEach(() => transaction.rollback());

// Slow: Full cleanup
afterEach(async () => {
  await db.truncateAllTables();
});
```

### 3. Parallel Execution
```javascript
// Can't share same port
// Each test gets fresh port
test.concurrent('test 1', async () => {
  const container = await startContainer(); // Port 5432 mapped to random
});
```

## Testing Patterns

### Pattern 1: CRUD Operations
```javascript
// Create
const user = await db.users.insert({ name: 'Alice', email: 'alice@test.com' });

// Read
const fetched = await db.users.find(user.id);

// Update
await db.users.update(user.id, { name: 'Alice Updated' });

// Delete
await db.users.delete(user.id);
```

### Pattern 2: Constraint Testing
```javascript
// Unique constraint
const user1 = await db.users.insert({ email: 'alice@test.com' });
const user2Promise = db.users.insert({ email: 'alice@test.com' });

await expect(user2Promise)
  .rejects
  .toThrow('unique violation');
```

### Pattern 3: Transaction Testing
```javascript
// Test rolled-back transaction
const txn = await connection.begin();
const user = await txn.users.insert({ name: 'Temporary', email: 'temp@test.com' });
await txn.rollback();

// Verify not persisted
const found = await db.users.find(user.id);
expect(found).toBeUndefined();
```

## Troubleshooting

### Issue: Container Takes Too Long to Start
**Solution:**
- Use smaller images (alpine)
- Reuse containers across tests
- Parallel execution

### Issue: Port Conflicts
**Solution:**
- Random port mapping
- Docker network mode
- Separate container per test env

### Issue: Data Persistence Between Tests
**Solution:**
- Clear data in afterEach
- Use transactions
- Fresh container per test

## Best Practices

1. **Start Small** - Single container, simple setup
2. **Minimize Setup** - Only what test needs
3. **Clear Teardown** - Always cleanup
4. **Transaction Rollback** - Faster than truncation
5. **Realistic Schema** - Match production
6. **Test Constraints** - Unique, FK, checks
7. **Monitor Performance** - Container startup time
8. **Use Factories** - Reusable container setup
9. **Parallel When Safe** - Speed up test suites
10. **Document Setup** - How containers configure

## When to Use Testcontainers

| Use Case | Recommendation |
|----------|-----------------|
| Unit tests | Mocks preferred |
| Integration tests | Testcontainers |
| End-to-end tests | Real database |
| API tests | Testcontainers |
| Performance tests | Real database |
| CI/CD pipelines | Testcontainers |

## Conclusion

Testcontainers bridges the gap between mocked tests and production-like testing. By providing easy access to real databases in tests, you catch bugs that mocks miss, while keeping tests fast and isolated. They're especially valuable for integration testing where realistic database behavior is critical.

