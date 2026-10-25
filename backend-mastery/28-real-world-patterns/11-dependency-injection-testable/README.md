# Module 11: Dependency Injection - Building Testable Applications

## Overview

Dependency Injection (DI) is a design pattern that decouples components by providing their dependencies from the outside rather than having them create dependencies internally. This makes code more testable, maintainable, and flexible.

## Key Concepts

### What is Dependency Injection?

**Without DI (Tightly Coupled):**
```javascript
class UserController {
  constructor() {
    this.repository = new UserRepository(); // Hardcoded dependency
  }
}
```

**With DI (Loosely Coupled):**
```javascript
class UserController {
  constructor(repository) {
    this.repository = repository; // Injected dependency
  }
}
```

## Benefits

1. **Testability** - Easy to mock dependencies in tests
2. **Reusability** - Components work with any compatible dependency
3. **Flexibility** - Change implementations without changing consumers
4. **Maintainability** - Clear separation of concerns
5. **Scalability** - Easier to extend and modify

## How It Works

1. Define an interface/contract (e.g., Repository)
2. Pass concrete implementations to constructors
3. Use injected dependencies instead of creating them
4. Can swap implementations at runtime

## Common Mistakes

- Creating dependencies inside functions
- Hardcoding external service URLs
- Not abstracting repository/data access layers
- Mixing business logic with data access
- Not providing test-friendly alternatives

## Learning Path

1. Understand constructor injection
2. Learn property injection and setter injection
3. Explore DI containers
4. Practice with async dependencies
5. Master mock/spy objects for testing

## Module Files

- `controller.js` - Controller with injected repository
- `routes.js` - Route definitions
- `schema.js` - Validation schemas
- `middleware.js` - Express middleware
- `App.jsx` - React testing UI
- `server.js` - Express server with DI setup
