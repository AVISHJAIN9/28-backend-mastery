# 04 - Testcontainers: Real Database Testing

## Overview
Test with real database instances in Docker containers for authentic integration testing.

## What You'll Learn
- **Docker Containers** - Isolated database environments
- **Testcontainers** - Automated container management
- **Database Migrations** - Schema setup in tests
- **Real Interactions** - Authentic database behavior
- **Cleanup** - Automatic container teardown
- **Multi-DB Testing** - PostgreSQL, MySQL, MongoDB

## Key Concepts

### Testcontainers Benefits
1. **Real Database** - Not mocked
2. **Isolation** - Fresh instance per test
3. **Automatic** - Setup and teardown
4. **Reproducible** - Same env everywhere
5. **Fast** - Container reuse

### Setup Flow
1. Start container (beforeAll)
2. Run migrations  
3. Execute tests
4. Verify results in DB
5. Stop container (afterAll)

## Database Support
- **PostgreSQL** - Full SQL
- **MySQL** - RDBMS
- **MongoDB** - NoSQL
- **Redis** - Caching
- **Elastic** - Search

## Prerequisites
- Docker installed and running
- Node.js with testcontainers library
- Understanding of database operations

## Quick Start
```bash  
npm install
docker daemon (running)
npm run dev
```

## Common Patterns
1. Single DB for all tests
2. Fresh DB per test
3. Shared DB with transactions
4. Multiple databases
5. Custom containers

## Best Practices
- Use transactions for speed
- Share containers when safe
- Clean data between tests
- Test migrations
- Verify actual constraints
