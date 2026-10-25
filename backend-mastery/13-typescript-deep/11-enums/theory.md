# 13.11: Enums - All Enum Patterns

## What are Enums?

**Enums** allow you to define a set of named constants. They can be numeric, string, or heterogeneous.

### Numeric Enums

```typescript
enum Direction {
  Up = 1,
  Down = 2,
  Left = 3,
  Right = 4
}

let dir: Direction = Direction.Up;  // 1
```

### String Enums

```typescript
enum Status {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING'
}

let status: Status = Status.Active;  // 'ACTIVE'
```

### Heterogeneous Enums

```typescript
enum Response {
  No = 0,
  Yes = 'YES',
  Maybe = 'MAYBE'
}
```

---

## Enum Patterns

### Const Enums (Zero-cost)

```typescript
const enum Direction {
  Up = 'UP',
  Down = 'DOWN'
}

// Compiles to: let x = 'UP';
let x = Direction.Up;
```

### Reverse Mapping (Numeric only)

```typescript
enum NumericEnum {
  A = 0,
  B = 1
}

NumericEnum[0];  // 'A'
NumericEnum['A'];  // 0
```

### Enum with Functions

```typescript
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest'
}

function hasPermission(role: UserRole): boolean {
  return role === UserRole.Admin;
}
```

---

## Best Practices

1. **Use string enums** for API responses
2. **Use const enums** for performance
3. **Document enum values** in comments
4. **Use enums for fixed sets** of values
5. **Avoid numeric enums** unless needed for reverse mapping
