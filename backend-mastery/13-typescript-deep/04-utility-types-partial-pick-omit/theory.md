# 13.4: Utility Types - Partial, Pick, Omit, Record, Readonly

## What are Utility Types?

**Utility Types** are built-in TypeScript types that transform other types. They let you derive new types from existing ones without writing them from scratch.

```typescript
// Without utilities - tedious
interface UserRead {
  id: number;
  name: string;
  email: string;
  // Missing fields...
}

// With utilities - DRY
type UserRead = Readonly<Pick<User, 'id' | 'name' | 'email'>>;
```

---

## Core Utility Types

### 1. Partial<T> - Make all properties optional

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// All fields become optional
type UserUpdate = Partial<User>;
// {
//   id?: number;
//   name?: string;
//   email?: string;
//   role?: 'admin' | 'user';
// }

// Use case: Update endpoints
function updateUser(id: number, updates: Partial<User>) {
  // Can update any combination of fields
}
```

### 2. Required<T> - Make all properties required

```typescript
type UserRequired = Required<Partial<User>>;
// All fields required again

type UserForm = Required<User>;  // Same as User
```

### 3. Readonly<T> - Make all properties read-only

```typescript
type ReadonlyUser = Readonly<User>;
// {
//   readonly id: number;
//   readonly name: string;
//   readonly email: string;
// }

const user: ReadonlyUser = { id: 1, name: 'Alice', email: '...', role: 'admin' };
user.name = 'Bob';  // ❌ Error: Cannot assign
```

### 4. Pick<T, K> - Select specific properties

```typescript
// Only id, name, email
type UserPreview = Pick<User, 'id' | 'name' | 'email'>;
// {
//   id: number;
//   name: string;
//   email: string;
// }

// Use case: API response DTO
type UserDTO = Pick<User, 'id' | 'name' | 'role'>;
```

### 5. Omit<T, K> - Exclude specific properties

```typescript
// Everything except id
type UserCreate = Omit<User, 'id'>;
// {
//   name: string;
//   email: string;
//   role: 'admin' | 'user';
// }

// Use case: Request body (no auto-generated fields)
type CreateUserRequest = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
```

### 6. Record<K, T> - Create object with specific keys

```typescript
// Object with role keys pointing to permissions
type Permissions = Record<'admin' | 'user' | 'moderator', string[]>;
// {
//   admin: string[];
//   user: string[];
//   moderator: string[];
// }

const permissions: Permissions = {
  admin: ['read', 'write', 'delete'],
  user: ['read'],
  moderator: ['read', 'moderate']
};

// Use case: Configuration objects
type FeatureFlags = Record<'dark_mode' | 'analytics' | 'beta', boolean>;
```

### 7. Pick & Omit Combined

```typescript
// Start with User, remove id, then make optional
type UserUpdate = Partial<Omit<User, 'id'>>;

// All combinations possible
type AdminView = Readonly<Pick<User, 'id' | 'name' | 'role'>>;
```

### 8. Exclude<T, U> - Remove type from union

```typescript
type AllRoles = 'admin' | 'user' | 'moderator' | 'guest';

// Remove 'guest' from union
type StaffRoles = Exclude<AllRoles, 'guest'>;
// 'admin' | 'user' | 'moderator'

// Use case: Filtering union types
type PermittedRoles = Exclude<UserRole, 'superadmin'>;
```

### 9. Extract<T, U> - Select from union

```typescript
type AllTypes = string | number | boolean | undefined;

// Only primitives
type Primitives = Extract<AllTypes, string | number>;
// string | number

// Use case: Type filtering
type NonNull = Extract<AllRoles, Exclude<AllRoles, null | undefined>>;
```

### 10. ReturnType<T> - Get function return type

```typescript
function getUserById(id: number): Promise<User> {
  // ...
}

// Extract: Promise<User>
type UserPromise = ReturnType<typeof getUserById>;

// Without ReturnType, would need to duplicate
type ManualReturn = Promise<User>;
```

### 11. Parameters<T> - Get function parameter types

```typescript
function updateUser(id: number, data: Partial<User>): void {}

type UpdateParams = Parameters<typeof updateUser>;
// [id: number, data: Partial<User>]
```

### 12. InstanceType<T> - Get class instance type

```typescript
class User {
  constructor(public name: string) {}
}

type UserInstance = InstanceType<typeof User>;
// Same as: User
```

---

## Practical Patterns

### Pattern 1: CRUD Types from Single Model

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create: no id, no timestamps
type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

// Update: same as create but partial
type UpdateUserDTO = Partial<CreateUserDTO>;

// Response: exclude password
type UserDTO = Omit<User, 'password'>;

// Read-only: exclude sensitive fields
type UserPublic = Readonly<Omit<User, 'password' | 'email'>>;
```

### Pattern 2: API Response Wrapper

```typescript
function createResultType<T>(
  dataShape: T
): {
  success: { ok: true; data: T };
  error: { ok: false; error: string };
} {
  return {
    success: { ok: true as const, data: {} as T },
    error: { ok: false as const, error: '' }
  };
}

// Use:
type UserResponse = ReturnType<typeof createResultType<User>>['success'];
```

### Pattern 3: Configuration with Readonly

```typescript
interface AppConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
  debug: boolean;
}

// Read-only config ensures immutability
type ReadonlyConfig = Readonly<AppConfig>;

const config: ReadonlyConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  debug: false
};

// config.timeout = 10000;  // ❌ Error!
```

### Pattern 4: Feature Flags with Record

```typescript
type Features = 'darkMode' | 'analytics' | 'betaAccess';

type FeatureToggle = Record<Features, {
  enabled: boolean;
  rolloutPercent: number;
}>;

const features: FeatureToggle = {
  darkMode: { enabled: true, rolloutPercent: 100 },
  analytics: { enabled: true, rolloutPercent: 50 },
  betaAccess: { enabled: false, rolloutPercent: 0 }
};
```

### Pattern 5: Discriminated Record

```typescript
type EventType = 'click' | 'scroll' | 'submit';

type EventHandlers = Record<EventType, (e: Event) => void>;

const handlers: EventHandlers = {
  click: (e) => console.log('clicked'),
  scroll: (e) => console.log('scrolled'),
  submit: (e) => console.log('submitted')
};
```

---

## Combining Utilities

```typescript
// Pick only specific fields, then make readonly
type ReadonlyUserSummary = Readonly<Pick<User, 'id' | 'name'>>;

// Create request: omit id/timestamps, then make partial
type UpdateRequest = Partial<Omit<User, 'id' | 'createdAt'>>;

// Complex: narrow union type, then create record
type SafeRoles = Exclude<UserRole, 'superadmin' | 'guest'>;
type RoleConfig = Record<SafeRoles, boolean>;

// Three-level composition
type AdminView = Readonly<Omit<Pick<User, 'id' | 'name' | 'email' | 'role'>, 'password'>>;
```

---

## Common Mistakes

### ❌ Over-use of Any

```typescript
// Bad
type GetAsync = (url: any) => Promise<any>;

// Good
type GetAsync = (url: string) => Promise<User>;
```

### ❌ Forgetting Partial for Optional Updates

```typescript
// Bad - all fields required
function updateUser(data: Omit<User, 'id'>): void {}

// Good - all fields optional
function updateUser(data: Partial<Omit<User, 'id'>>): void {}
```

### ❌ Using Readonly at Wrong Level

```typescript
// This only makes top-level readonly
type ShallowReadonly = Readonly<User>;
// Nested objects are still mutable!

// For deep readonly, need custom recursive utility
// Or use libraries like ts-essentials
```

### ❌ Record with Non-discriminable Keys

```typescript
// Bad - loses type information
type BadRecord = Record<string, any>;

// Good - specific keys
type GoodRecord = Record<'admin' | 'user' | 'guest', Permission>;
```

---

## Summary Table

| Utility | Purpose | Input | Output |
|---------|---------|-------|--------|
| `Partial<T>` | All optional | `{a: 1, b: 2}` | `{a?: 1, b?: 2}` |
| `Required<T>` | All required | `{a?: 1, b?: 2}` | `{a: 1, b: 2}` |
| `Readonly<T>` | All immutable | `{a: 1, b: 2}` | `{readonly a: 1, readonly b: 2}` |
| `Pick<T, K>` | Select fields | `{a: 1, b: 2, c: 3}` + 'a' \| 'b' | `{a: 1, b: 2}` |
| `Omit<T, K>` | Exclude fields | `{a: 1, b: 2, c: 3}` + 'c' | `{a: 1, b: 2}` |
| `Record<K, V>` | Key-value map | 'x' \| 'y' + Type | `{x: Type, y: Type}` |
| `Exclude<T, U>` | Remove union | `'a' \| 'b' \| 'c'` + 'c' | `'a' \| 'b'` |
| `Extract<T, U>` | Select union | `'a' \| 'b' \| 'c'` + 'a' \| 'b' | `'a' \| 'b'` |
| `ReturnType<T>` | Function return | `() => User` | `User` |
| `Parameters<T>` | Function params | `(a: 1, b: 2) => void` | `[1, 2]` |
| `InstanceType<T>` | Class instance | `typeof User` | `User` |

---

## Key Takeaways

1. **DRY** - Don't repeat type definitions
2. **Composability** - Combine utils: `Partial<Omit<T, K>>`
3. **DTO Pattern** - Create, Read, Update use different subsets
4. **Immutability** - Use `Readonly` for constants
5. **Discriminated Records** - `Record<K, V>` with literal keys
6. **Union Filtering** - `Exclude` and `Extract` for type narrowing

