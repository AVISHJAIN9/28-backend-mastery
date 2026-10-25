# 13.10: Type Guards & Type Predicates - Type Narrowing

## What are Type Guards?

**Type guards** are conditional checks that narrow types within a code block. They let TypeScript infer more specific types.

```typescript
function processValue(value: string | number) {
  if (typeof value === 'string') {
    // TypeScript knows value is a string here
    console.log(value.toUpperCase());
  } else {
    // TypeScript knows value is a number here
    console.log(value.toFixed(2));
  }
}
```

---

## Built-in Type Guards

### typeof Guard

```typescript
type Value = string | number | boolean;

function check(value: Value) {
  if (typeof value === 'string') {
    return value.length;  // string methods
  }
  if (typeof value === 'number') {
    return value.toFixed();  // number methods
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;  // boolean operations
  }
}
```

### instanceof Guard

```typescript
class User {
  name: string = '';
}

class Admin extends User {
  role: string = 'admin';
}

function identify(obj: User | Admin | object) {
  if (obj instanceof Admin) {
    console.log('Admin:', obj.role);
  } else if (obj instanceof User) {
    console.log('User:', obj.name);
  } else {
    console.log('Unknown object');
  }
}
```

### Truthiness Guard

```typescript
function printLength(str: string | null) {
  if (str) {
    console.log(str.length);
  }
}

function printLength2(str: string | null | undefined) {
  if (str !== null && str !== undefined) {
    console.log(str.length);
  }
}
```

### Equality Guard

```typescript
function compare(x: string | number, y: string | boolean | number) {
  if (x === y) {
    // x and y are the same type now
    console.log(x, y);  // both strings or both numbers
  } else {
    console.log('Different types');
  }
}
```

---

## Custom Type Predicates (is keyword)

```typescript
interface Fish {
  swim: () => void;
}

interface Bird {
  fly: () => void;
}

function isFish(pet: any): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

function isBird(pet: any): pet is Bird {
  return (pet as Bird).fly !== undefined;
}

function move(pet: Fish | Bird) {
  if (isFish(pet)) {
    pet.swim();  // TypeScript knows it's Fish
  } else {
    pet.fly();   // TypeScript knows it's Bird
  }
}
```

---

## Discriminated Unions (Best Practice)

```typescript
type Result = 
  | { type: 'success'; value: string }
  | { type: 'error'; error: Error };

function handle(result: Result) {
  if (result.type === 'success') {
    console.log(result.value);  // safe to access value
  } else {
    console.log(result.error);  // safe to access error
  }
}
```

---

## Advanced Patterns

### Assertion Functions

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Not a string');
  }
}

function process(value: unknown) {
  assertIsString(value);
  console.log(value.toUpperCase());  // value is now string
}
```

### Parameterized Type Guards

```typescript
function isOfType<T>(obj: any, prop: keyof T): obj is T {
  return typeof obj === 'object' && obj !== null && prop in obj;
}
```

---

## Common Patterns

```typescript
// Array check
const isArray = (value: any): value is any[] => Array.isArray(value);

// Date check
const isDate = (value: any): value is Date => value instanceof Date;

// Object check
const isObject = (value: any): value is object => 
  value !== null && typeof value === 'object';

// String enum check
const isStatus = (value: any): value is 'active' | 'inactive' => 
  value === 'active' || value === 'inactive';
```
