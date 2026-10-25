# Repository Pattern: Data Access Abstraction

## What is the Repository Pattern?

The **Repository Pattern** is an architectural pattern that mediates between the domain and data mapping layers, acting like an in-memory collection of domain objects.

## Key Characteristics

1. **Abstraction Layer** - Hides database details
2. **Collection-Like Interface** - Feels like working with in-memory objects
3. **Query Encapsulation** - Database queries encapsulated in repository methods
4. **Domain-Focused** - Domain models, not database models
5. **Testability** - Easy to mock for testing

## Real-World Analogy

Library repository:
- Librarian (repository) knows where all books are
- You ask librarian for books (repository methods)
- Librarian finds and gives you books
- You don't need to know the library structure
- Same interface whether books in database or files

## Why Use Repository Pattern?

### 1. **Separation of Concerns**
Business logic separated from data access logic.

### 2. **Testability**
Business logic tested with mock repositories.

### 3. **Database Independence**
Switch databases without changing business logic.

### 4. **Query Reusability**
Common queries defined in one place.

### 5. **SOLID Principles**
Follows Dependency Inversion Principle.

## Implementation Pattern

```javascript
class UserRepository {
  async findById(id) { }
  async findAll() { }
  async create(data) { }
  async update(id, data) { }
  async delete(id) { }
}
```

## Common Queries

1. **CRUD** - Create, Read, Update, Delete
2. **Filtering** - Find by criteria
3. **Pagination** - Limit and offset
4. **Sorting** - Order by field
5. **Aggregation** - Count, sum, average
6. **Relationships** - Find related records

## Benefits

1. **Abstraction** - Hide database complexity
2. **Maintainability** - Changes in one place
3. **Testability** - Mock repositories for tests
4. **Flexibility** - Switch databases easily
5. **Code Reuse** - Share queries across application
6. **DDD Alignment** - Focus on domain, not persistence

## Real-World Examples

1. **User Management** - User repository
2. **Product Catalog** - Product repository
3. **Order Processing** - Order repository
4. **Content Management** - Article repository
5. **Inventory** - Stock repository

## Patterns with Repository

| Pattern | Usage |
|---------|-------|
| **DTO** | Transfer data between layers |
| **UnitOfWork** | Manage multiple repositories |
| **Factory** | Create repositories dynamically |
| **Dependency Injection** | Inject repositories into services |

## Conclusion

Repository Pattern is essential for:
- Data access abstraction
- Loose coupling from persistence
- Testable business logic
- Flexible and clean architecture
