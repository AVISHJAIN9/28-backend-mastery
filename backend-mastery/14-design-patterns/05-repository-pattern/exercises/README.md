# Repository Pattern - Exercises

## Exercise 1: Product Repository
Create multiple implementations:
- InMemoryProductRepository
- FileSystemProductRepository
- MongoDBProductRepository

Same interface, different backends.

---

## Exercise 2: Cache Layer
Add caching to repository:
- Cache decorator that wraps repository
- Cache invalidation strategies
- TTL support

---

## Exercise 3: Query Builder
Create repository with query methods:
- findByName(name)
- findByPriceRange(min, max)
- findByCategory(category)

---

## Solutions
See `../../solutions/` for complete implementations.
