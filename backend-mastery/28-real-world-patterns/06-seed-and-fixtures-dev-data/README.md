# Module 06: Database Seeding & Fixtures - Populating Development Data

## Overview

Database seeding is the process of populating a database with initial data. Fixtures are sample datasets used for testing and development. Together, they ensure consistent development environments and enable rapid testing without manual data entry.

## Key Concepts

### Seeding vs Fixtures

**Seeding:**
- One-time initialization
- Baseline reference data (countries, states, etc.)
- Production data setup
- Environment-specific setup

**Fixtures:**
- Test-specific sample data
- Reproducible test scenarios
- Isolated test environments
- Data cleanup after tests

### Benefits

1. **Consistency** - All developers start with the same data
2. **Reproducibility** - Tests run against known data state
3. **Efficiency** - No manual data entry
4. **Testing** - Rapid test scenario setup
5. **Documentation** - Data structure shown in fixtures
6. **Automation** - Part of CI/CD pipeline

## Seed Types

1. **Reference Data** - Countries, states, categories (static)
2. **Initial State** - Admin users, default settings
3. **Test Data** - Sample records for development
4. **Production Seed** - Minimal production data

## Fixture Management

### Fixture Lifecycle

```
1. Load fixture file
2. Create test database
3. Insert fixture data
4. Run tests
5. Clean up (delete fixture data)
6. Drop test database
```

### Storage Formats

- JSON files (structured, portable)
- JavaScript (dynamic generation)
- SQL scripts (database-specific)
- YAML files (human-readable)

## Best Practices

1. **Version control fixtures** - Track in git
2. **Use factories** - Generate data dynamically
3. **Isolate per test** - Each test gets fresh data
4. **Clean up** - Remove test data after runs
5. **Document structure** - Explain what data means
6. **Use transactions** - Rollback after tests

## Common Patterns

### Factory Pattern
```javascript
function createUser(overrides) {
  return {
    name: 'Test User',
    email: 'test@example.com',
    ...overrides
  };
}
```

### One Fixture Per Test
```javascript
beforeEach(() => loadFixture('user-with-posts.json'));
afterEach(() => clearDatabase());
```

## Learning Path

1. Create basic seed script
2. Load fixtures from files
3. Implement factory functions
4. Setup/teardown lifecycle
5. Integrate with test runners

## Module Files

- `controller.js` - Seed and fixture operations
- `routes.js` - Route definitions
- `schema.js` - Validation schemas
- `middleware.js` - Express middleware
- `App.jsx` - React testing UI
- `server.js` - Express server with seeding setup
