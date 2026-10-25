# Module 13.1: TypeScript Types vs Interfaces

## What This Covers

This module explores **the fundamental difference between TypeScript's `type` and `interface` keywords**, when to use each, and how they impact your code organization.

## Key Learning Outcomes

✅ Understand Type alias syntax and capabilities
✅ Understand Interface syntax and capabilities
✅ Know when to use Type vs Interface
✅ Learn declaration merging
✅ Build real-world applications using both patterns
✅ Write type-safe Express servers

## Project Structure

```
01-types-vs-interfaces/
├── theory.md           # Deep dive on types & interfaces
├── server.js           # Express server with type examples
├── controller.js       # Service layer with interfaces
├── routes.js           # API routes (mixed patterns)
├── middleware.js       # Middleware validators
├── App.jsx             # Interactive React UI
├── package.json        # Dependencies
├── .env.example        # Environment template
└── README.md           # This file
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
```

### 3. Start Server
```bash
npm run dev
# Server on http://localhost:13001
```

### 4. Start Frontend
```bash
npm run dev:frontend
# UI on http://localhost:3000
```

## Quick Comparison

### Types Are For...
```typescript
// Unions
type Status = 'active' | 'inactive' | 'pending';

// Primitives
type ID = string | number;

// Tuples
type Pair = [string, number];

// Functions
type Callback = (data: string) => void;

// Complex logic
type Flatten<T> = T extends Array<infer U> ? U : T;
```

### Interfaces Are For...
```typescript
// Object contracts
interface User {
  id: number;
  name: string;
  email: string;
}

// Extension (inheritance)
interface Admin extends User {
  permissions: string[];
}

// Declaration merging
interface User {
  role: 'admin' | 'user';
}
```

## API Endpoints

### User Management

**Create User (Type-based request validation)**
```bash
POST /api/users
Content-Type: application/json

{
  "name": "Alice",
  "email": "alice@example.com",
  "role": "user"
}
```

**Get All Users**
```bash
GET /api/users
```

**Get Single User**
```bash
GET /api/users/1
```

**Update User**
```bash
PUT /api/users/1
{
  "name": "Alice Updated",
  "role": "moderator"
}
```

**Delete User**
```bash
DELETE /api/users/1
```

**Promote to Admin (Interface pattern)**
```bash
POST /api/users/1/promote
{
  "permissions": ["create", "read", "update", "delete"],
  "department": "Engineering"
}
```

**Get Users by Role**
```bash
GET /api/users-by-role/admin
```

**Batch Create Users**
```bash
POST /api/users-batch
{
  "users": [
    { "name": "Bob", "email": "bob@test.com", "role": "user" },
    { "name": "Charlie", "email": "charlie@test.com", "role": "moderator" }
  ]
}
```

## Response Format

All APIs return Type-based ApiResponse:

```typescript
// Success
{
  "success": true,
  "data": { /* user object */ },
  "timestamp": 1234567890
}

// Error
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "NOT_FOUND"
  },
  "timestamp": 1234567890
}
```

## Code Examples

### Using Type for API Response

```typescript
type ApiResponse<T> = {
  success: true;
  data: T;
  timestamp: number;
} | {
  success: false;
  error: { message: string; code: string };
  timestamp: number;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
};

type UserResponse = ApiResponse<User>;
```

### Using Interface for Service Layer

```typescript
interface Entity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

interface User extends Entity {
  name: string;
  email: string;
  role: string;
}

interface Admin extends User {
  permissions: string[];
  department: string;
}

interface UserRepository {
  create(user: Omit<User, 'id'>): Promise<User>;
  getById(id: number): Promise<User | null>;
  update(id: number, updates: Partial<User>): Promise<User>;
  delete(id: number): Promise<void>;
}
```

### Declaration Merging (Interface Only)

```typescript
interface User {
  id: number;
  name: string;
}

// Can merge later
interface User {
  email: string;
}

// Result has: id, name, email
```

## Practical Examples

### 1. Express Middleware with Types

```typescript
type Request = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: Record<string, any>;
  headers?: Record<string, string>;
};

type Response<T> = {
  status: number;
  data: T;
  headers?: Record<string, string>;
};
```

### 2. Database Query with Interfaces

```typescript
interface QueryBuilder<T> {
  where(condition: Partial<T>): QueryBuilder<T>;
  select(...fields: (keyof T)[]): QueryBuilder<T>;
  orderBy(field: keyof T, direction: 'asc' | 'desc'): QueryBuilder<T>;
  limit(n: number): QueryBuilder<T>;
  execute(): Promise<T[]>;
}
```

### 3. Event System with Types

```typescript
type Event = 
  | { type: 'user.created'; userId: string }
  | { type: 'user.deleted'; userId: string }
  | { type: 'order.placed'; orderId: string };

type EventHandler<T extends Event> = (event: T) => void;

function on<T extends Event>(
  eventType: T['type'],
  handler: EventHandler<T>
): void {
  // implementation
}
```

## Exercises

1. **Extend User Interface**
   - Add a `preferences` interface extending User
   - Add `notifications` interface for preferences
   - Merge declarations to add new fields

2. **Create API Response Type**
   - Define generic TypeResponse
   - Create specialized types: UserResponse, ErrorResponse
   - Use discriminated unions

3. **Build Form Validator**
   - Create Type for validation errors
   - Create Interface for ValidationRule
   - Implement validator using both

4. **Multi-level Hierarchy**
   - Create Entity interface (base)
   - Create User extending Entity
   - Create Admin extending User
   - Create SuperAdmin extending Admin

## When to Use What: Decision Tree

```
Need to describe a shape?
├─ Object with properties?
│  └─ Use Interface
├─ Union of multiple values?
│  └─ Use Type
├─ Function type?
│  └─ Use Type
├─ Need declaration merging?
│  └─ Use Interface
├─ Generic constraints?
│  └─ Either works
└─ Single primitive type?
   └─ Use Type
```

## Common Mistakes

### ❌ Using Interface for Unions
```typescript
interface Status 'pending' | 'approved'; // ❌ Error
```

### ✅ Using Type for Unions
```typescript
type Status = 'pending' | 'approved'; // ✅ Correct
```

### ❌ Expecting Type Merging
```typescript
type Config = { a: string };
type Config = { b: number }; // ❌ Second overwrites

// Use in code only has 'b'
```

### ✅ Using Interface Merging
```typescript
interface Config { a: string; }
interface Config { b: number; } // ✅ Merges

// Use in code has both 'a' and 'b'
```

## Performance Notes

- **No runtime difference**: Both compile away to nothing
- **Bundle size**: Identical (both are compile-time only)
- **Type checking**: Equivalent speed
- **IDE experience**: Both provide excellent autocomplete

## Next Steps

- Module 13.2: Generics & API Response Patterns
- Module 13.3: Zod for Runtime + Compile-Time Safety
- Module 13.4: Utility Types (Partial, Pick, Omit)
- Module 13.5: Discriminated Unions
- Module 13.6: Declaration Merging with Express

## Resources

- [TypeScript Handbook: Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [TypeScript Handbook: Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript Handbook: Unions](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html#union-types)
