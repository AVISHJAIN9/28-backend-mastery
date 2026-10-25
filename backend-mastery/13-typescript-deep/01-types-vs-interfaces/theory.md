# Module 13.1: Types vs Interfaces

## Overview

**Types** and **Interfaces** are two fundamental ways to define shapes of objects in TypeScript. While they appear similar, they serve different purposes and have key differences that impact how you structure your code.

## Quick Comparison

| Feature | Type | Interface |
|---------|------|-----------|
| **Declaration** | `type` keyword | `interface` keyword |
| **Merging** | ❌ No | ✅ Yes |
| **Extends** | `&` or `type X = Y & Z` | `extends` keyword |
| **Primitives** | ✅ Yes | ❌ No |
| **Union** | ✅ Yes | ❌ No |
| **Tuples** | ✅ Yes | ❌ No |
| **Maps to** | Compile-time only | Compile-time only |
| **Performance** | Identical | Identical |
| **Use Case** | Flexible modeling | Object contracts |

## Types: Flexible & Powerful

Types are **aliases** for any value type. They're more powerful but less structured.

### 1. Basic Type Definition

```typescript
type User = {
  id: number;
  name: string;
  email: string;
};

const user: User = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com'
};
```

### 2. Union Types (Types Only)

```typescript
// Can't do this with interface
type Status = 'active' | 'inactive' | 'pending';
type Role = 'admin' | 'user' | 'moderator';

type AdminUser = User & { role: 'admin' };
type UserWithStatus = User & { status: Status };
```

### 3. Primitive Types (Types Only)

```typescript
type ID = string | number;
type Timestamp = number;
type Callback = () => void;
type JSONValue = string | number | boolean | null | { [key: string]: JSONValue };
```

### 4. Tuples (Types Only)

```typescript
type Coordinates = [number, number];
type Response = [status: number, data: unknown];

const point: Coordinates = [10, 20];
```

### 5. Intersection with `&`

```typescript
type Person = { name: string };
type Employee = { employeeId: number };
type Staff = Person & Employee;

const staff: Staff = {
  name: 'Bob',
  employeeId: 123
};
```

## Interfaces: Contract-Based

Interfaces define **contracts** that objects must fulfill. They're designed for object-oriented programming.

### 1. Basic Interface

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com'
};
```

### 2. Declaration Merging (Interface Only)

```typescript
interface User {
  id: number;
  name: string;
}

interface User {
  email: string; // Merged!
}

// Final User has: id, name, email
const user: User = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com'
};
```

Useful for extending types from libraries:

```typescript
// Express augmentation
interface Request {
  user?: User;
}

// Later in another file
interface Request {
  customData?: any;
}
```

### 3. Interface Extension

```typescript
interface User {
  id: number;
  name: string;
}

interface Admin extends User {
  permissions: string[];
}

const admin: Admin = {
  id: 1,
  name: 'Alice',
  permissions: ['read', 'write', 'delete']
};
```

### 4. Multiple Extension

```typescript
interface Auditable {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface Identifiable {
  id: string;
}

interface Document extends Auditable, Identifiable {
  content: string;
}

const doc: Document = {
  id: 'doc_123',
  content: 'Hello',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'alice'
};
```

## Key Differences in Action

### 1. Union Types

```typescript
// Type: Can represent unions
type Status = 'pending' | 'approved' | 'rejected';

// Interface: Cannot
// interface Payment = 'credit' | 'debit' | 'cash'; ❌ ERROR
```

### 2. Merging Declarations

```typescript
// Type: Each redeclaration overwrites
type Config = { timeout: number };
type Config = { retries: number }; // Overwrites previous

const config: Config = { retries: 3 }; // ❌ Missing timeout

// Interface: Declarations merge
interface Config {
  timeout: number;
}
interface Config {
  retries: number;
}

const config: Config = { timeout: 5000, retries: 3 }; // ✅ Has both
```

### 3. Function Types

```typescript
// Type: Natural for functions
type Callback = (data: string) => void;
type Add = (a: number, b: number) => number;

// Interface: Awkward
interface Callback {
  (data: string): void;
}
interface Add {
  (a: number, b: number): number;
}
```

### 4. Tuple and Array Shapes

```typescript
// Type: Supports tuples naturally
type Pair = [string, number];
type Triple = [x: number, y: number, z: number];

// Interface: Must use arrays
interface Coordinates {
  0: number;
  1: number;
  length: 2;
}
```

### 5. Generic Constraints

Both support generics:

```typescript
// Type
type Container<T> = {
  value: T;
  getValue: () => T;
};

// Interface
interface Container<T> {
  value: T;
  getValue(): T;
}

const strContainer: Container<string> = {
  value: 'hello',
  getValue: () => 'hello'
};
```

## When to Use What

### Use **Type** when:
- ✅ Defining unions (`'admin' | 'user'`)
- ✅ Defining tuples (`[string, number]`)
- ✅ Mapping primitives (`type ID = string`)
- ✅ Function signatures are primary
- ✅ You need complex conditionals

### Use **Interface** when:
- ✅ Defining object contracts
- ✅ You need declaration merging
- ✅ Building class hierarchies
- ✅ You want semantic clarity
- ✅ Multiple inheritance needed

## Real-World Patterns

### 1. API Response Contract (Type)

```typescript
type ApiResponse<T> = {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  timestamp: number;
};

type UserResponse = ApiResponse<{ id: number; name: string }>;
```

### 2. Database Entity (Interface)

```typescript
interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Product extends Entity {
  name: string;
  price: number;
}

interface Order extends Entity {
  userId: string;
  items: { productId: string; quantity: number }[];
}
```

### 3. Event Types (Type)

```typescript
type Event = 
  | { type: 'user.created'; userId: string; email: string }
  | { type: 'order.placed'; orderId: string; total: number }
  | { type: 'payment.failed'; orderId: string; reason: string };

function handleEvent(event: Event) {
  switch (event.type) {
    case 'user.created':
      console.log(event.email); // ✅ Narrowed type
      break;
    case 'order.placed':
      console.log(event.total); // ✅ Narrowed type
      break;
  }
}
```

### 4. Express Augmentation (Interface)

```typescript
interface Request {
  user?: User;
  startTime?: number;
}

// Later, add more properties
interface Request {
  traceId?: string;
}
```

### 5. Discriminated Union (Type)

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: number };

function processResult<T>(result: Result<T>) {
  if (result.success) {
    console.log(result.data);
  } else {
    console.log(result.error, result.code);
  }
}
```

## Advanced Concepts

### 1. Type Intersection vs Interface Extension

```typescript
// Type intersection (combinable any time)
type A = { x: string };
type B = { y: number };
type C = A & B;

// Interface extension (at declaration time)
interface A { x: string; }
interface B { y: number; }
interface C extends A, B {}
```

### 2. Readonly

Both support readonly:

```typescript
type ReadonlyUser = {
  readonly id: number;
  readonly name: string;
};

interface ReadonlyProduct {
  readonly id: number;
  readonly name: string;
}
```

### 3. Optional Properties

```typescript
type Config = {
  timeout?: number;
  retries?: number;
};

interface Settings {
  theme?: 'light' | 'dark';
  language?: string;
}
```

### 4. Index Signatures

Both support dynamic keys:

```typescript
type Dict<T> = {
  [key: string]: T;
};

interface Mapping {
  [key: string]: any;
}
```

## Performance & Compilation

**Both compile to identical JavaScript:**

```typescript
type User = { id: number; name: string };
interface User { id: number; name: string; }
```

Compiles to:
```javascript
// Nothing! Both are removed during compilation
```

No performance difference at runtime.

## Best Practices

1. **Default to Interface for objects**
   - Clearer intent (contract-based)
   - Supports merging (useful for extensions)
   - More semantic

2. **Use Type for unions & primitives**
   - More powerful
   - Natural for discriminated unions
   - Required for function overloads

3. **Be consistent in projects**
   - If team prefers types, use types everywhere
   - If team prefers interfaces, use interfaces for objects

4. **Don't mix unnecessarily**
   ```typescript
   // ❌ Unclear
   type UserType = {
     id: number;
     name: string;
   };
   interface UserInterface extends UserType {}

   // ✅ Clear
   type User = { id: number; name: string };
   interface Admin extends User { permissions: string[]; }
   ```

## Common Mistakes

### ❌ Mistake 1: Union in Interface

```typescript
// ❌ Won't work
interface Status 'active' | 'inactive' {}

// ✅ Use type
type Status = 'active' | 'inactive';
```

### ❌ Mistake 2: Merging types

```typescript
// ❌ Second declaration overwrites
type Config = { timeout: number };
type Config = { retries: number }; // Overwrites!

// ✅ Use interface
interface Config { timeout: number; }
interface Config { retries: number; } // Merges!
```

### ❌ Mistake 3: Function signature awkwardness

```typescript
// ❌ Awkward
interface Calculate {
  (a: number, b: number): number;
}

// ✅ Natural with type
type Calculate = (a: number, b: number) => number;
```

## Summary

- **Type**: Flexible, powerful, best for unions and conditionals
- **Interface**: Clear intent, supports merging, best for contracts
- **Most projects use both**: Interfaces for objects/classes, Types for everything else
- **No runtime difference**: Both are compile-time constructs
- **Modern convention**: Use interfaces for object contracts, types for everything else

Choose based on **intent**, not performance or compilation size.

