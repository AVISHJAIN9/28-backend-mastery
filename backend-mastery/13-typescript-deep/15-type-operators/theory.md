# 13.15: Keyof, Typeof & Type Operators - Advanced Inference

## Keyof Operator

**keyof** gives you keys of a type.

```typescript
interface User {
  name: string;
  age: number;
  email: string;
}

type UserKeys = keyof User;  // 'name' | 'age' | 'email'

function getProperty(obj: User, key: UserKeys) {
  return obj[key];
}
```

---

## Typeof Operator

**typeof** extracts type from a value.

```typescript
const user = { name: 'Alice', age: 30 };
type UserType = typeof user;
// { name: string; age: number }

const createUser = (data: UserType) => ({...data});
```

---

## Indexed Access Types

```typescript
interface User {
  name: string;
  age: number;
}

type NameType = User['name'];  // string
type AgeType = User['age'];    // number

type UserValues = User[keyof User];  // string | number
```

---

## Patterns

### Extract Property Names

```typescript
type Keys = keyof User;  // 'name' | 'age' | 'email'

const getKeys = <T extends object>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};
```

### Type-Safe Property Access

```typescript
function getSafely<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

getSafely(user, 'name');    // OK
// getSafely(user, 'phone');  // ERROR: no such property
```

### Conditional Type Inference

```typescript
type PropType<T, K extends keyof T> = T[K];

type NameProp = PropType<User, 'name'>;  // string
```
