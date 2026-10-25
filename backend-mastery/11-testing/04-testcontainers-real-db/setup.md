# Module 04: Testcontainers with Real Database - Setup Guide

## Quick Start (10 minutes)

```bash
# Install dependencies
npm install

# Ensure Docker is running
docker ps

# Start server
npm run dev

# Run tests (starts containers automatically)
npm test

# Visit UI
open http://localhost:4004
```

## Prerequisites

### Docker Installation

**macOS:**
```bash
brew install docker
# Then start Docker Desktop
```

**Linux:**
```bash
sudo apt-get install docker.io
sudo usermod -aG docker $USER
```

**Windows:**
- Download Docker Desktop from docker.com

### Verify Docker

```bash
docker --version
docker ps  # Should show: CONTAINER ID   IMAGE
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

**Key Packages:**

- `testcontainers` - Spin up containers for tests
- `jest` - Testing framework
- Database drivers: `pg`, `mysql2`, `mongodb` (choose one)
- `redis` - For caching tests

### 2. Environment Setup

Create `.env`:

```env
HTTP_PORT=4004
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=testdb
DB_USER=testuser
DB_PASSWORD=testpass
REDIS_HOST=localhost
REDIS_PORT=6379
LOG_LEVEL=debug
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Run Database Tests

```bash
# All tests (starts containers)
npm test

# Watch mode
npm test -- --watch

# Specific database
npm test postgres.test.js
```

## Testcontainers Patterns

### PostgreSQL Example

```javascript
const { PostgreSqlContainer } = require('testcontainers');

let container;
let pool;

beforeAll(async () => {
  // Start container
  container = await new PostgreSqlContainer()
    .withDatabase('testdb')
    .withUsername('test')
    .withUserPassword('test')
    .start();
  
  // Connect to database
  const host = container.getHost();
  const port = container.getPort();
  
  pool = new Pool({
    host,
    port,
    database: 'testdb',
    user: 'test',
    password: 'test'
  });
});

afterAll(async () => {
  await pool.end();
  await container.stop();
});

test('insert and retrieve user', async () => {
  await pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', 
    ['Alice', 'alice@test.com']);
  
  const result = await pool.query('SELECT * FROM users WHERE email = $1',
    ['alice@test.com']);
  
  expect(result.rows[0].name).toBe('Alice');
});
```

### MySQL Example

```javascript
const { MySqlContainer } = require('testcontainers');

let container;
let connection;

beforeAll(async () => {
  container = await new MySqlContainer()
    .withDatabase('testdb')
    .withUsername('test')
    .withUserPassword('test')
    .start();
  
  connection = mysql.createConnection({
    host: container.getHost(),
    port: container.getPort(),
    database: 'testdb',
    user: 'test',
    password: 'test'
  });
});
```

### MongoDB Example

```javascript
const { MongoDBContainer } = require('testcontainers');

let container;
let client;

beforeAll(async () => {
  container = await new MongoDBContainer().start();
  
  const uri = container.getConnectionString();
  client = new MongoClient(uri);
  await client.connect();
});

afterAll(async () => {
  await client.close();
  await container.stop();
});
```

### Redis Example

```javascript
const { GenericContainer } = require('testcontainers');
const redis = require('redis');

let container;
let client;

beforeAll(async () => {
  container = await new GenericContainer('redis:7')
    .withExposedPorts(6379)
    .start();
  
  const host = container.getHost();
  const port = container.getMappedPort(6379);
  
  client = redis.createClient({ host, port });
  await client.connect();
});
```

## Testing Patterns

### Clean Database Between Tests

```javascript
beforeEach(async () => {
  // Clear all data
  await pool.query('TRUNCATE TABLE users CASCADE');
  await pool.query('TRUNCATE TABLE posts CASCADE');
});
```

### Share Container Across Tests

```javascript
// Faster but requires cleanup
beforeEach(async () => {
  // Clear data but reuse container
});

afterAll(async () => {
  // Stop container once
});
```

### Fresh Container Per Test

```javascript
// Slower but completely isolated
beforeEach(async () => {
  container = await new PostgreSqlContainer().start();
});

afterEach(async () => {
  await container.stop();
});
```

### Testing Transactions

```javascript
test('rollback on error', async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO users VALUES ($1)', ['Alice']);
    await client.query('ROLLBACK');
    
    const result = await client.query('SELECT COUNT(*) FROM users');
    expect(parseInt(result.rows[0].count)).toBe(0);
  } finally {
    client.release();
  }
});
```

### Testing Constraints

```javascript
test('unique constraint violation', async () => {
  await pool.query('INSERT INTO users (email) VALUES ($1)', 
    ['test@test.com']);
  
  await expect(
    pool.query('INSERT INTO users (email) VALUES ($1)', 
      ['test@test.com'])
  ).rejects.toThrow('unique violation');
});
```

## Using the React UI

At `http://localhost:4004`:

- **Database Connection** - Test container startup
- **CRUD Operations** - Insert, read, update, delete
- **Transactions** - Test rollback
- **Constraints** - Verify database rules
- **Performance** - Measure query times

## Performance Tips

### Reuse Container

```javascript
// Setup once for all tests
setupModule.beforeAll(async () => {
  container = await startContainer();
});

// All tests use same container
// Clear data between tests, not container
```

### Parallel Tests

```javascript
// Run multiple test files in parallel
// Each can have its own container
```

### Network Optimization

```javascript
beforeAll(async () => {
  container = await new PostgreSqlContainer()
    .withNetworkMode('host')  // Use host network
    .start();
});
```

## Debugging

### Inspect Running Container

```bash
docker ps  # See running containers
docker logs <container-id>  # View container logs
docker exec -it <container-id> psql -U test  # Connect to database
```

### Print Container Info

```javascript
console.log('Host:', container.getHost());
console.log('Port:', container.getPort());
console.log('Logs:', container.getLogs());
```

## Troubleshooting

### "Cannot connect to Docker daemon"

```bash
# Start Docker
sudo systemctl start docker  # Linux
# or open Docker Desktop on macOS/Windows
```

### "Port already in use"

```bash
docker ps  # Find container
docker stop <container-id>  # Stop it
do docker rm <container-id> # Remove it
```

### "Test timeout"

Increase timeout and add logging:

```javascript
jest.setTimeout(30000);  // 30 seconds

beforeAll(async () => {
  console.log('Starting container...');
  container = await new PostgreSqlContainer().start();
  console.log('Container started');
});
```

### "Database connection refused"

Check credentials in test:

```javascript
const connection = {
  host: container.getHost(),
  port: container.getPort(),  // Use mapped port!
  database: 'testdb',
  user: 'test',
  password: 'test'
};
```

## Common Patterns

| Challenge | Solution |
|-----------|----------|
| Tests slow | Reuse container, clear data |
| Port conflicts | Docker assigns random ports |
| Network issues | Use container host name |
| Data isolation | TRUNCATE or fresh container |
| Transaction testing | Use client transactions |

## Next Steps

1. ✅ Verify Docker installation
2. ✅ Run tests to start first container
3. ✅ Examine test files for patterns
4. ✅ Test database constraints
5. ✅ Write custom integration tests

## Resources

- [Testcontainers Docs](https://testcontainers.com)
- [Docker Documentation](https://docs.docker.com)
- [Database Setup](https://www.testcontainers.org/modules/databases/)
