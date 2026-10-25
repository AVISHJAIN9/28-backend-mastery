# 13.8: Conditional Types & Infer - Advanced Type Logic

## What are Conditional Types?

**Conditional types** apply logic to types using ternary operators.

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>;  // true
type B = IsString<42>;       // false
```

---

## Basic Pattern

```typescript
type Check<T> = T extends null ? 'nullable' : 'not nullable';

type A = Check<string | null>;  // 'nullable'
type B = Check<string>;         // 'not nullable'
```

---

## Infer - Extract Types

**`infer`** extracts a type from within a complex type.

```typescript
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type UserFunc = (id: number) => { id: number; name: string };
type ReturnType = GetReturnType<UserFunc>;  // { id: number; name: string }
```

---

## Practical Patterns

### Pattern 1: Extract Array Element Type

```typescript
type GetArrayElement<T> = T extends (infer E)[] ? E : never;

type Numbers = GetArrayElement<number[]>;   // number
type Users = GetArrayElement<User[]>;       // User
type NotArray = GetArrayElement<string>;    // never
```

### Pattern 2: Extract Promise Value

```typescript
type Unwrap<T> = T extends Promise<infer U> ? U : T;

type A = Unwrap<Promise<string>>;   // string
type B = Unwrap<string>;            // string
type C = Unwrap<Promise<User[]>>;   // User[]
```

### Pattern 3: Extract Union Member

```typescript
type First<T> = T extends [infer F, ...rest: any[]] ? F : never;

type StringOrNumber = First<[string, number, boolean]>;  // string
type EmptyArray = First<[]>;  // never
```

### Pattern 4: Function Parameters

```typescript
type GetParams<T> = T extends (...args: infer P) => any ? P : never;

type UpdateFunc = (id: number, data: Partial<User>) => void;
type Params = GetParams<UpdateFunc>;  // [id: number, data: Partial<User>]
```

### Pattern 5: Object Property Type

```typescript
type GetObjectValue<T, K extends keyof T> = T[K];

interface User {
  id: number;
  name: string;
}

type UserIdType = GetObjectValue<User, 'id'>;     // number
type UserNameType = GetObjectValue<User, 'name'>; // string
```

---

## Distributed Conditional Types

```typescript
type Flatten<T> = T extends any[] ? T[number] : T;

type A = Flatten<[1, 2, 3]>;       // 1 | 2 | 3
type B = Flatten<string>;          // string
type C = Flatten<[string]>;        // string
type D = Flatten<[[1, 2], [3, 4]]>; // [1, 2] | [3, 4]
```

---

## Advanced Patterns

### Pattern 1: No-Infer Helper

```typescript
type NoInfer<T> = T & {};

// Prevents type inference
function compare<T>(a: T, b: NoInfer<T>): boolean {
  return a === b;
}

compare(5, 5);      // ✓ OK
compare(5, '5');    // ❌ Error: '5' is not number
```

### Pattern 2: Overload Resolution

```typescript
type Resolve<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T extends any[] ? any[] :
  never;

type A = Resolve<'hello'>;  // string
type B = Resolve<42>;       // number
type C = Resolve<true>;     // boolean
```

### Pattern 3: Extract Keys by Value Type

```typescript
type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type StringKeys = KeysOfType<User, string>;  // 'name' | 'email'
type NumberKeys = KeysOfType<User, number>;  // 'id' | 'age'
```

### Pattern 4: Readonly to Mutable

```typescript
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

type ReadonlyUser = Readonly<User>;
type MutableUser = Mutable<ReadonlyUser>;  // Back to mutable
```

### Pattern 5: Optional to Required

```typescript
type Required<T> = {
  [K in keyof T]-?: T[K];
};

type PartialUser = {
  id?: number;
  name?: string;
  email?: string;
};

type FullUser = Required<PartialUser>;
// {
//   id: number;
//   name: string;
//   email: string;
// }
```

---

## Real-World Example: Parse JSON

```typescript
type JSON = 
  | string
  | number
  | boolean
  | null
  | JSON[]
  | { [key: string]: JSON };

type JsonPrimitive = Exclude<JSON, JSON[] | { [key: string]: JSON }>;
// string | number | boolean | null

type JsonObject = Extract<JSON, { [key: string]: JSON }>;
// { [key: string]: JSON }

type JsonArray = Extract<JSON, JSON[]>;
// JSON[]
```

---

## Complete Example: API Response Handler

```typescript
interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

type IsSuccessful<T> = T extends ApiResponse<infer U>
  ? { ok: true; data: U }
  : never;

type IsError<T> = T extends ApiResponse<any>
  ? { ok: false; error: string }
  : never;

type UserResponse = ApiResponse<{ id: number; name: string }>;

type SuccessCase = IsSuccessful<UserResponse>;
// { ok: true; data: { id: number; name: string } }

type ErrorCase = IsError<UserResponse>;
// { ok: false; error: string }
```

---

## Benefits

✅ **Powerful Abstraction** - Type logic without repetition  
✅ **Type Extraction** - Get information from complex types  
✅ **Recursive Types** - Build complex type hierarchies  
✅ **Type-safe Generics** - Constrain generics perfectly  

---

## Common Pitfalls

❌ Forgetting union distribution in conditionals  
❌ Using `infer` in wrong position (must be in extends clause)  
❌ Creating infinite recursive types  
❌ Over-complex conditional chains  

---

## Key Takeaway

**Conditional types + infer = Meta-programming with types**

Extract information from types and make type-safe decisions at compile-time.

