# Module 13.2: Generics & API Response Patterns

Master TypeScript generics through practical API response patterns. Learn how generic type parameters enable reusable, type-safe code across your entire backend.

## What You'll Learn

- **Generic Type Parameters** (`<T>`, `<T, E>`)
- **Generic Constraints** (`T extends Entity`)
- **Discriminated Unions** for type safety
- **Generic Classes & Interfaces**
- **Pagination Generics** (`PaginatedResponse<T>`)
- **Error Handling Patterns** (`Result<T, E>`)
- **Repository Pattern** with generics

## Quick Start

### 1. Install Dependencies

```bash
cd 13-typescript-deep/02-generics-api-response
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

### 3. Run Backend

```bash
npm start
# Server runs on http://localhost:13002
```

### 4. Test API

```bash
# Create user (generic Result<User>)
curl -X POST http://localhost:13002/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@test.com", "role": "admin"}'

# Get paginated users (generic PaginatedResponse<User>)
curl "http://localhost:13002/api/users?page=1&pageSize=5"

# Search users (generic Result<User[]>)
curl -X POST http://localhost:13002/api/users/search \
  -H "Content-Type: application/json" \
  -d '{"query": "John"}'
```

## API Endpoints

### User Management

| Endpoint | Method | Request | Response | Generic Type |
|----------|--------|---------|----------|--------------|
| `/api/users` | POST | `{ name, email, role }` | `Result<User>` | `Result<T>` |
| `/api/users` | GET | `?page=1&pageSize=10` | `Result<PaginatedResponse<User>>` | `PaginatedResponse<T>` |
| `/api/users/:id` | GET | URL param | `Result<User>` | `Result<T>` |
| `/api/users/:id` | PUT | `{ name?, email?, role?, isActive? }` | `Result<User>` | `Result<T>` |
| `/api/users/:id` | DELETE | URL param | `Result<boolean>` | `Result<T>` |
| `/api/users/:id/promote` | POST | - | `Result<User>` | `Result<T>` |
| `/api/users/:id/deactivate` | POST | - | `Result<User>` | `Result<T>` |
| `/api/users-by-role/:role` | GET | URL param | `Result<User[]>` | `Result<T[]>` |
| `/api/users/search` | POST | `{ query?, role?, isActive? }` | `Result<User[]>` | Conditional<T> |
| `/api/users-batch` | POST | `{ users: User[] }` | `Result<BulkResult>` | `Result<Aggregate<T>>` |
| `/api/stats` | GET | - | `Result<Stats>` | `Result<Stats>` |

## Generic Patterns

### 1. Basic Generic Result Type

```typescript
// TypeScript (for reference)
type Result<T> = {
  ok: true;
  data: T;
  timestamp: number;
  duration: number;
} | {
  ok: false;
  error: { message: string; code: string };
  timestamp: number;
};

// Usage
type UserResult = Result<User>;         // Result<T>
type UsersResult = Result<User[]>;      // Result<T[]>
type BoolResult = Result<boolean>;      // Result<T>
```

### 2. Discriminated Union Pattern

The `ok` property is a **discriminator** that narrows the union type:

```javascript
// In JavaScript/Node.js
const response = await fetch('/api/users/1').then(r => r.json());

if (response.ok) {
  // TypeScript now knows: response.data exists
  console.log(response.data.name);  // Type: T
} else {
  // TypeScript now knows: response.error exists
  console.log(response.error.message);  // Type: string
}
```

### 3. Generic Repository Pattern

```javascript
// Generic Repository class - works with any entity
class Repository {
  async create(item) { /* returns Result<T> */ }
  async getById(id) { /* returns Result<T> */ }
  async getAll() { /* returns Result<T[]> */ }
  async update(id, updates) { /* returns Result<T> */ }
  async delete(id) { /* returns Result<boolean> */ }
  async paginate(page, pageSize) { /* returns Result<PaginatedResponse<T>> */ }
}

// Specialized repository inherits generic behavior
class UserRepository extends Repository {
  async getByRole(role) { /* returns Result<User[]> */ }
  async promoteToAdmin(id) { /* returns Result<User> */ }
}
```

### 4. Generic Pagination

```typescript
// TypeScript-style definition
type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// Usage
type PaginatedUsers = PaginatedResponse<User>;
type PaginatedPosts = PaginatedResponse<Post>;
```

### 5. Generic Constraint Pattern

```typescript
// Constraint: T must have id property
interface Entity {
  id: number;
}

type WithId<T extends Entity> = T & { uniqueKey: string };

// Valid
type UserWithId = WithId<User>;  // User has id

// Invalid (would error in TypeScript)
// type NumberWithId = WithId<number>;  // number doesn't have id
```

### 6. Conditional Generic Pattern

```javascript
// Function that returns different types based on condition
async function search(filters) {
  if (filters.role) {
    return { ok: true, data: Array<User> };  // Result<User[]>
  }
  if (filters.query) {
    return { ok: true, data: Array<User> };  // Result<User[]>
  }
  return { ok: true, data: Array<User> };  // Result<User[]>
}
```

## Architecture

```
server.js          # Express setup, routes registration
│
├─ controller.js   # Generic Repository class
│  ├─ Repository<T>       # Base generic class
│  ├─ UserRepository      # Specialized subclass
│  └─ Service<T>          # Generic service layer
│
├─ routes.js       # API endpoints using controller
│  └─ All return Result<T> or PaginatedResponse<T>
│
├─ middleware.js   # Validation, error handling
│  ├─ validateUserCreation
│  ├─ validatePageParams
│  ├─ errorHandler (returns Result<null>)
│  └─ responseFormatter (ensures Result pattern)
│
└─ App.jsx         # React UI for testing
   ├─ Create User (Result<User>)
   ├─ List Users (PaginatedResponse<User>)
   ├─ Update User (Result<User>)
   ├─ Delete User (Result<boolean>)
   └─ Search Users (Result<User[]>)
```

## Code Examples

### Creating a User (Generic Result<User>)

**Request:**
```javascript
POST /api/users
{ "name": "Alice", "email": "alice@test.com", "role": "admin" }
```

**Response (Success - Result with data):**
```json
{
  "ok": true,
  "data": {
    "id": 6,
    "name": "Alice",
    "email": "alice@test.com",
    "role": "admin",
    "isActive": true
  },
  "timestamp": 1695836400123,
  "duration": 5
}
```

**Response (Error - Result with error):**
```json
{
  "ok": false,
  "error": {
    "message": "email is required and must be valid",
    "code": "VALIDATION_ERROR"
  },
  "timestamp": 1695836400130
}
```

### Getting Paginated Users (Generic PaginatedResponse<User>)

**Request:**
```javascript
GET /api/users?page=2&pageSize=3
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "items": [
      { "id": 4, "name": "Diana", "email": "diana@test.com", "role": "moderator" },
      { "id": 5, "name": "Eve", "email": "eve@test.com", "role": "user" }
    ],
    "total": 5,
    "page": 2,
    "pageSize": 3,
    "hasMore": false
  },
  "timestamp": 1695836400456,
  "duration": 3
}
```

### Search with Conditional Generics

**Request:**
```javascript
POST /api/users/search
{ "query": "Alice" }
```

**Response (Result<User[]>):**
```json
{
  "ok": true,
  "data": [
    { "id": 1, "name": "Alice", "email": "alice@test.com", "role": "admin" }
  ],
  "count": 1,
  "filters": { "query": "Alice", "role": null, "isActive": null },
  "timestamp": 1695836400789,
  "duration": 2
}
```

## Learning Exercises

### Exercise 1: Add Generic Filtering

Extend the `Repository` class to add a generic `findOne()` method:

```javascript
// Add to Repository class in controller.js
async findOne(predicate) {
  // Should return Result<T | null>
  // Implement filtering logic
}
```

### Exercise 2: Generic Batch Operations

Create a generic batch operation method:

```javascript
async batchGet(ids) {
  // Should return Result<T[]>
  // Get multiple items by array of IDs
}
```

### Exercise 3: Generic Response Caching

Implement a generic caching pattern:

```javascript
async getWithCache(id, cacheKey) {
  // Should check cache first
  // Return Result<T> with cached metadata
  // Structure: { ok: true, data: T, cached: boolean }
}
```

### Exercise 4: Generic Error Recovery

Add retry logic to any generic operation:

```javascript
async retryOperation(operation, maxRetries = 3) {
  // Should retry on failure
  // Return Result<T> with attempt count
  // Structure: { ok: true, data: T, attempts: number }
}
```

### Exercise 5: Generic Union Response

Create custom response for different scenarios:

```javascript
type Either<L, R> = 
  | { type: 'left'; value: L }
  | { type: 'right'; value: R };

// Use: Either<Error, User>
```

## Best Practices

### ✅ DO

```javascript
// Use generics for reusable operations
class Repository<T> {
  async getById(id) { /* Result<T> */ }
}

// Use discriminated unions for type safety
const response = { ok: true, data: user };
if (response.ok) {
  console.log(response.data.id);  // Type-safe
}

// Name generic parameters clearly
type Result<Data, Error = null> = { ok: boolean };

// Constrain generics when needed
class EntityRepository<T extends { id: number }> { }
```

### ❌ DON'T

```javascript
// Don't use 'any' - defeats generics purpose
async get(id) { return any }

// Don't forget to handle both branches
const response = getResult();
console.log(response.data);  // Potential error if response.ok is false

// Don't use cryptic type variable names
function process<A, B, C, D>(a: A, b: B): C | D { }

// Don't forget error cases in generics
type Result<T> = { ok: true, data: T }  // Missing error case!
```

## Key Takeaways

1. **Generics Enable Reusability** - Write once, use with many types
2. **Type Safety** - Catch errors at development time, not runtime
3. **Discriminated Unions** - Handle success/error cases explicitly
4. **Repository Pattern** - Abstract data access with generics
5. **Result Type** - Standardize error handling across your API
6. **Constraints** - Use `extends` to limit generic possibilities
7. **Pagination** - Generic pagination works for any entity type

## Common Pitfalls

| Pitfall | Issue | Solution |
|---------|-------|----------|
| Forgetting error case | Response can be success or error | Always include both in union |
| Not constraining generics | Too permissive, allows wrong types | Use `T extends Entity` |
| Mixing patterns | Inconsistent responses | Stick to one pattern |
| Over-generic | Generic for everything | Use generics only for reusable code |
| Type narrowing bugs | Forget to check discriminator | Always check `ok` before accessing data |

## References

- Module 13.1: Types vs Interfaces (Foundation)
- TypeScript Handbook: Generics
- Discriminated Union Pattern
- Repository Pattern in Microservices

---

**Status:** ✅ Complete  
**Port:** 13002  
**Time to Complete:** 30-45 minutes
