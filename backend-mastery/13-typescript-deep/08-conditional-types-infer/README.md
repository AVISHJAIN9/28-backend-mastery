# Module 13.8: Conditional Types & Infer

## Overview

**Conditional Types** enable type logic with `T extends U ? X : Y`. The **`infer` keyword** extracts type parameters from complex types, unlocking powerful type inference patterns used in modern TypeScript libraries.

## Key Concepts

### 1. **Conditional Types Basics**

Type logic based on constraints:

```typescript
// Check type
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>; // true
type B = IsString<number>; // false

// Return different types
type Flatten<T> = T extends Array<infer U> ? U : T;

type A = Flatten<[1, 2, 3]>; // number
type B = Flatten<'hello'>; // 'hello'
```

### 2. **Infer Keyword - Extract Type Parameters**

Extract types from complex structures:

```typescript
// Extract array element type
type GetArrayElement<T> = T extends (infer E)[] ? E : never;

type A = GetArrayElement<[1, 2, 3]>; // number
type B = GetArrayElement<string[]>; // string

// Extract Promise value
type GetPromiseValue<P> = P extends Promise<infer V> ? V : never;

type A = GetPromiseValue<Promise<string>>; // string
type B = GetPromiseValue<Promise<User>>; // User

// Extract function return type
type GetReturnType<F> = F extends (...args: any[]) => infer R ? R : never;

type A = GetReturnType<() => string>; // string
type B = GetReturnType<(x: number) => boolean>; // boolean
```

### 3. **Multiple Infer Positions**

Extract multiple parts of complex types:

```typescript
// Extract function parameters and return
type GetFunctionSignature<F> = F extends (
  ...args: infer Args
) => infer Return
  ? { args: Args; return: Return }
  : never;

type A = GetFunctionSignature<(x: number, y: string) => boolean>;
// { args: [number, string]; return: boolean }

// Extract tuple elements
type GetTuple<T> = T extends [infer First, infer Second, infer Rest]
  ? { first: First; second: Second; rest: Rest }
  : never;

type A = GetTuple<[string, number, boolean]>;
// { first: string; second: number; rest: boolean }
```

### 4. **Conditional Type Distribution**

Conditional types automatically distribute over unions:

```typescript
// Distributes over union
type Extract<T, U> = T extends U ? T : never;

type A = Extract<'a' | 'b' | string, string>;
// 'a' | 'b' | string (all extend string)

type B = Extract<1 | 2 | 'hello', number>;
// 1 | 2 (only these extend number)
```

### 5. **Real-World: API Response Unwrapping**

```typescript
// Generic response wrapper
type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// Extract success data type
type GetSuccessData<R> = R extends ApiResponse<infer D>
  ? D
  : never;

type UserData = GetSuccessData<ApiResponse<User>>;
// User

// Extract all possible data types from union
type GetAllData<R> = R extends { ok: true; data: infer D } ? D : never;
```

## Real-World Patterns

### Pattern 1: Unwrap Promises Chain
```typescript
type Awaited<T> = T extends Promise<infer U>
  ? U extends Promise<infer V>
    ? V
    : U
  : T;

type A = Awaited<Promise<Promise<string>>>; // string
type B = Awaited<Promise<string>>; // string
type C = Awaited<string>; // string
```

### Pattern 2: Function Overload Helper
```typescript
type FunctionReturn<F extends (...args: any) => any> = ReturnType<F>;
type FunctionArgs<F extends (...args: any) => any> = Parameters<F>;

// Usage
function fetchUser(id: number): Promise<User> { }

type UserFetch = FunctionReturn<typeof fetchUser>;
// Promise<User>

type FetchArgs = FunctionArgs<typeof fetchUser>;
// [number]
```

### Pattern 3: Recursive Type Unwrapping
```typescript
// Unwrap nested arrays
type DeepFlatten<T> = T extends (infer U)[]
  ? DeepFlatten<U>
  : T;

type A = DeepFlatten<[[number]]>; // number
```

### Pattern 4: Union to Intersection
```typescript
type UnionToIntersection<U> = (
  U extends any
    ? (k: U) => void
    : never
) extends (k: infer I) => void
  ? I
  : never;

type A = UnionToIntersection<{ a: 1 } | { b: 2 }>;
// { a: 1 } & { b: 2 }
```

### Pattern 5: Conditional Response Formatting
```typescript
type FormatResponse<T> = T extends string
  ? { text: T }
  : T extends number
  ? { count: T }
  : T extends object
  ? { data: T }
  : never;

type A = FormatResponse<'hello'>; // { text: 'hello' }
type B = FormatResponse<42>; // { count: 42 }
type C = FormatResponse<User>; // { data: User }
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/conditional-types` | Test conditional type evaluations |
| POST | `/api/type-inference` | Infer types from provided values |
| GET | `/api/type-tests` | Run type tests and assertions |
| POST | `/api/unwrap-response` | Unwrap API response types |
| GET | `/api/schema` | Get TypeScript schema with conditions |

## Common Patterns

### Check Types
```typescript
type IsArray<T> = T extends Array<any> ? true : false;
type IsFunction<T> = T extends (...args: any) => any ? true : false;
type IsPromise<T> = T extends Promise<any> ? true : false;
type IsObject<T> = T extends object ? true : false;
```

### Extract From Generics
```typescript
// Get type parameter from generic
type GetFirstTypeArg<T> = T extends GenericClass<infer A, any> ? A : never;

// Get key type from Record
type GetRecordKeyType<T> = T extends Record<infer K, any> ? K : never;
type GetRecordValueType<T> = T extends Record<any, infer V> ? V : never;
```

### Conditional Mapping
```typescript
type ConditionalMap<T> = T extends string
  ? 'STRING'
  : T extends number
  ? 'NUMBER'
  : T extends boolean
  ? 'BOOLEAN'
  : 'OTHER';
```

## Exercises

1. **Type Guard Generator**: Create conditional types that verify types at compile time
2. **API Response Unwrapper**: Build types to extract data from nested API responses
3. **Promise Resolver**: Unwrap nested Promise chains recursively
4. **Function Signature Extractor**: Extract parameters and return types from functions

## Key Takeaways

✅ **Conditional Types** enable type logic with `T extends U ? X : Y`  
✅ **`infer` keyword** extracts type parameters from complex types  
✅ Conditional types **distribute over unions** automatically  
✅ Enable **zero-runtime-cost type-safe abstractions**  
✅ Essential for **generic libraries** and **type utilities**  

## Real-World Usage

```typescript
// Type-safe API client with conditional response handling
type ApiCall<T> = T extends { method: 'GET' }
  ? { data: T['response']; status: 200 }
  : T extends { method: 'POST' }
  ? { data: T['response']; status: 201 }
  : never;

type FormattedResponse<R> = R extends { data: infer D }
  ? { ok: true; payload: D }
  : R extends { error: infer E }
  ? { ok: false; message: E }
  : R;

// Infer return type from any function
type AsyncResult<F extends (...args: any) => Promise<any>> = F extends (
  ...args: any
) => Promise<infer T>
  ? T
  : never;

async function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then(r => r.json());
}

type UserResult = AsyncResult<typeof getUser>;
// User

// Unwrap nested conditionals
type Unwrap<T> = T extends Promise<infer U>
  ? U extends Array<infer V>
    ? V[]
    : U
  : T;

type A = Unwrap<Promise<number[]>>; // number[]
type B = Unwrap<Promise<string>>; // string
```

## Resources

- [TypeScript: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript: Infer](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)
- [Type Inference Patterns](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

## Common mistakes

## Real world usage
