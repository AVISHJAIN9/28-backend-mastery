# Module 13.2: Generics & API Response Patterns

## Overview

**Generics** allow you to write reusable, type-safe code that works with many types. Combined with **discriminated unions**, generics enable powerful API response patterns.

## What Are Generics?

A **generic** is a type parameter (placeholder) that gets filled in later:

```typescript
// Without generics (repetitive)
type UserResponse = {
  status: 'success' | 'error';
  data?: User;
  error?: string;
};

type ProductResponse = {
  status: 'success' | 'error';
  data?: Product;
  error?: string;
};

// With generics (reusable)
type ApiResponse<T> = {
  status: 'success' | 'error';
  data?: T;
  error?: string;
};

type UserResponse = ApiResponse<User>;
type ProductResponse = ApiResponse<Product>;
```

## Generic Syntax

### Basic Generic Function

```typescript
function getItem<T>(item: T): T {
  return item;
}

const str = getItem<string>('hello');   // T = string
const num = getItem<number>(42);        // T = number
const obj = getItem<User>(user);        // T = User
```

### Generic Constraints

```typescript
// T must have an `id` property
function getId<T extends { id: number }>(obj: T): number {
  return obj.id;
}

getId({ id: 1, name: 'Alice' });        // ✅ Works
getId({ name: 'Bob' });                 // ❌ Error: missing id
```

### Multiple Type Parameters

```typescript
type Tuple<A, B> = [A, B];

const pair: Tuple<string, number> = ['hello', 42];

function combine<T, U>(a: T, b: U): [T, U] {
  return [a, b];
}
```

### Keyof Constraint

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: 'Alice', email: 'alice@test.com' };
const name = getProperty(user, 'name');   // ✅ 'Alice'
getProperty(user, 'phone');               // ❌ Error
```

## API Response Patterns

### Pattern 1: Success/Error Union

```typescript
type ApiResponse<T, E = string> = 
  | { success: true; data: T }
  | { success: false; error: E };

type UserResponse = ApiResponse<User>;

function handleResponse<T>(response: ApiResponse<T>) {
  if (response.success) {
    console.log(response.data);          // ✅ T is narrowed
  } else {
    console.log(response.error);         // ✅ string
  }
}
```

### Pattern 2: Discriminated Union (Type Guard)

```typescript
type Result<T> = 
  | { kind: 'success'; value: T }
  | { kind: 'error'; error: Error }
  | { kind: 'loading' };

function processResult<T>(result: Result<T>) {
  switch (result.kind) {
    case 'success':
      console.log(result.value);         // ✅ T
      break;
    case 'error':
      console.log(result.error.message); // ✅ Error
      break;
    case 'loading':
      console.log('Still loading...');
      break;
  }
}
```

### Pattern 3: Wrapped Generic with Metadata

```typescript
type Response<T> = {
  status: number;
  data: T;
  timestamp: number;
  duration: number;
};

const userResponse: Response<User> = {
  status: 200,
  data: { id: 1, name: 'Alice' },
  timestamp: Date.now(),
  duration: 45
};
```

### Pattern 4: Paginated Response

```typescript
type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type UserList = PaginatedResponse<User>;

const userList: UserList = {
  items: [{ id: 1, name: 'Alice' }],
  total: 100,
  page: 1,
  pageSize: 20,
  hasMore: true
};
```

### Pattern 5: Conditional Generic Types

```typescript
// Extract array element type
type ArrayElement<T> = T extends (infer E)[] ? E : T;

type A = ArrayElement<string[]>;    // string
type B = ArrayElement<number>;      // number
type C = ArrayElement<User[]>;      // User
```

## Advanced Generics

### Generic Classes

```typescript
class Repository<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getAll(): T[] {
    return this.items;
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }
}

const userRepo = new Repository<User>();
userRepo.add({ id: 1, name: 'Alice' });
const user = userRepo.find(u => u.name === 'Alice');
```

### Generic Interfaces

```typescript
interface Repository<T> {
  create(item: T): Promise<T>;
  getById(id: string): Promise<T | null>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  list(): Promise<T[]>;
}

class UserRepository implements Repository<User> {
  async create(item: User): Promise<User> {
    // implementation
    return item;
  }
  // ... other methods
}
```

### Generic with Default

```typescript
type Response<T = unknown> = {
  status: 'success' | 'error';
  data: T;
};

const unknownResponse: Response = { status: 'success', data: 'anything' };
const typedResponse: Response<User> = { status: 'success', data: user };
```

## Real-World API Response Pattern

### Complete Example

```typescript
// Generic result type
type Result<T, E = { message: string; code: string }> =
  | { ok: true; data: T; meta: { timestamp: number; duration: number } }
  | { ok: false; error: E; meta: { timestamp: number } };

// User types
type User = { id: number; name: string; email: string };
type UserError = { message: string; code: 'NOT_FOUND' | 'INVALID_INPUT' };

// Specific response types
type GetUserResult = Result<User, UserError>;
type ListUsersResult = Result<User[], UserError>;

// Handler function
async function getUser(id: number): Promise<GetUserResult> {
  const start = Date.now();
  
  try {
    if (id < 1) {
      return {
        ok: false,
        error: { message: 'Invalid user ID', code: 'INVALID_INPUT' },
        meta: { timestamp: Date.now() }
      };
    }

    const user = await db.users.findById(id);
    
    if (!user) {
      return {
        ok: false,
        error: { message: 'User not found', code: 'NOT_FOUND' },
        meta: { timestamp: Date.now() }
      };
    }

    return {
      ok: true,
      data: user,
      meta: { timestamp: Date.now(), duration: Date.now() - start }
    };
  } catch (err) {
    return {
      ok: false,
      error: { message: 'Internal error', code: 'INTERNAL_ERROR' },
      meta: { timestamp: Date.now() }
    };
  }
}

// Usage with type narrowing
const result = await getUser(1);
if (result.ok) {
  console.log(result.data.name);  // ✅ User
} else {
  console.log(result.error.code); // ✅ UserError
}
```

## Generic Constraints Patterns

### Constrain to Entity with ID

```typescript
type Entity = { id: string | number };

function getId<T extends Entity>(item: T): T['id'] {
  return item.id;
}

getId({ id: 1, name: 'Alice' });           // ✅
getId({ id: 'abc', email: 'test@test.com' }); // ✅
getId({ name: 'Bob' });                    // ❌ Error
```

### Constrain to Constructor

```typescript
function create<T>(constructor: new () => T): T {
  return new constructor();
}

class User {
  id = Math.random();
}

const user = create(User);  // ✅ user: User
```

### Constrain to Specific Keys

```typescript
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: 'Alice' };
pluck(user, 'name');   // ✅ 'Alice'
pluck(user, 'phone');  // ❌ Error
```

## Generic Utility Patterns

### Extracting Types

```typescript
// Extract return type of function
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;

const fn = (): User => ({ id: 1, name: 'Alice' });
type UserType = ReturnType<typeof fn>;  // User

// Extract array element type
type ArrayElement<T> = T extends (infer E)[] ? E : T;

type Item = ArrayElement<User[]>;  // User
```

### Making Properties Optional/Required

```typescript
// Make all properties optional
type Partial<T> = {
  [K in keyof T]?: T[K];
};

// Make all properties required
type Required<T> = {
  [K in keyof T]-?: T[K];
};

// Pick specific properties
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type UserNameOnly = Pick<User, 'name'>;  // { name: string }
```

## Common Patterns

### Request/Response Pair

```typescript
type Request<T> = {
  id: string;
  method: string;
  payload: T;
  timestamp: number;
};

type Response<T> = {
  requestId: string;
  status: number;
  data: T;
  timestamp: number;
};

type CreateUserRequest = Request<{ name: string; email: string }>;
type CreateUserResponse = Response<User>;
```

### Recursive Generic

```typescript
type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonValue[] 
  | { [key: string]: JsonValue };

function stringify(value: JsonValue): string {
  return JSON.stringify(value);
}
```

### Promise-based Response

```typescript
type AsyncResult<T> = Promise<T | null>;
type AsyncResponse<T> = Promise<ApiResponse<T>>;

async function getUser(id: number): AsyncResponse<User> {
  try {
    const user = await db.users.findById(id);
    return { ok: true, data: user };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
```

## Best Practices

### 1. Use Meaningful Names

```typescript
// ❌ Generic but unclear
type T<A, B> = { request: A; response: B };

// ✅ Clear intent
type RequestResponse<Req, Res> = { request: Req; response: Res };
```

### 2. Provide Reasonable Defaults

```typescript
// ✅ Default error type
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

### 3. Constrain When Needed

```typescript
// ✅ Prevents misuse
function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### 4. Use Discriminated Unions for Type Safety

```typescript
// ❌ Easy to misuse
type Result<T> = { status: string; data?: T; error?: string };

// ✅ Impossible to misuse
type Result<T> = 
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
```

## Anti-Patterns

### ❌ Over-Generification

```typescript
// Too generic, unclear intent
type T<A, B, C, D, E> = { a: A; b: B; c: C; d: D; e: E };

// Better: Use specific types
type UserProfile = { 
  user: User; 
  posts: Post[]; 
  followers: User[];
  following: User[];
}
```

### ❌ Generic Constraint Too Loose

```typescript
// ❌ Accepts anything
function process<T>(item: T): T {
  return item;
}

// ✅ Clearer constraints
function process<T extends { id: number }>(item: T): T {
  return item;
}
```

### ❌ Mixing Multiple Response Patterns

```typescript
// ❌ Inconsistent API
type Response<T> = 
  | { success: true; data: T }
  | { ok: false; error: string }
  | { status: 'loading' };

// ✅ Consistent
type Response<T> = 
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
  | { status: 'loading' };
```

## Summary

- **Generics**: Write type-safe, reusable code
- **Type Parameters**: Placeholder types filled later
- **Constraints**: Limit what types can be passed
- **API Response Patterns**: Discriminated unions + generics = type safety
- **Defaults**: Provide sensible defaults for common cases
- **Consistency**: Use same pattern throughout codebase

Generic APIs with discriminated unions are the foundation of modern TypeScript applications.

