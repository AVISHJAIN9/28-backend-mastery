# Module 12: Repository Pattern - Abstracting Data Access

## Overview

The Repository Pattern abstracts data access logic, decoupling business logic from database specifics. Controllers work with repositories instead of querying databases directly, creating a clean separation between application and persistence layers.

## Key Concepts

### What is the Repository Pattern?

**Without Repository (Tight Coupling):**
```javascript
app.get('/users/:id', (req, res) => {
  const user = db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(user);
});
```

**With Repository (Loose Coupling):**
```javascript
app.get('/users/:id', (req, res) => {
  const user = userRepository.getById(req.params.id);
  res.json(user);
});
```

## Benefits

1. **Separation of Concerns** - Controllers don't know about database
2. **Testability** - Mock repository easily for unit tests
3. **Consistency** - Centralized data access logic
4. **Flexibility** - Swap database implementations
5. **Reusability** - Same repository used across multiple controllers
6. **DRY** - Query logic not duplicated

## Repository Structure

A repository provides:
- `getAll()` - Fetch all records
- `getById(id)` - Fetch single record
- `create(data)` - Insert new record
- `update(id, data)` - Modify existing record
- `delete(id)` - Remove record

## Common Patterns

1. **Active Record** - Entity knows how to persist itself
2. **Data Mapper** - Separate mapper handles persistence
3. **Unit of Work** - Track changes and commit atomically
4. **Query Object** - Build complex queries

## Learning Path

1. Understand responsibilities of each layer
2. Create basic repository classes
3. Implement CRUD operations
4. Add query filtering and pagination
5. Practice with different data sources

## Module Files

- `controller.js` - Controllers using repositories
- `routes.js` - Route definitions
- `schema.js` - Validation schemas
- `middleware.js` - Express middleware
- `App.jsx` - React testing UI
- `server.js` - Express server with repository setup
