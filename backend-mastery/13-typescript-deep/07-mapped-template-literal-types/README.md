# Module 13.7: Mapped & Template Literal Types

## Overview

**Mapped Types** transform object types by iterating over their keys. **Template Literal Types** create new string types dynamically. Together, they enable powerful type transformations and code generation patterns.

## Key Concepts

### 1. **Mapped Types Basics**

Iterate over object keys and transform them:

```typescript
// Getters: Convert properties to getter functions
type Getters<T> = {
  [K in keyof T]: () => T[K]
};

interface User {
  name: string;
  age: number;
}

type UserGetters = Getters<User>;
// Result:
// {
//   name: () => string;
//   age: () => number;
// }

// Usage
const user = new UserGetters();
user.name(); // () => string
```

### 2. **Template Literal Types**

Create new string types from unions:

```typescript
// Generate event handler names
type EventNames = 'click' | 'hover' | 'focus';

type EventHandlers = {
  [E in EventNames as `on${Capitalize<E>}`]: (e: Event) => void;
};

// Result:
// {
//   onClick: (e: Event) => void;
//   onHover: (e: Event) => void;
//   onFocus: (e: Event) => void;
// }
```

### 3. **Key Remapping with `as`**

Transform key names using string manipulation:

```typescript
// Add prefixes
type Prefixed<T> = {
  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K];
};

interface Settings {
  fontSize: number;
  theme: string;
}

type SettingsGetters = Prefixed<Settings>;
// {
//   getFontSize: () => number;
//   getTheme: () => string;
// }
```

### 4. **Conditional Properties**

Filter and transform properties conditionally:

```typescript
// Only keep string properties
type StringProps<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface Mixed {
  name: string;
  age: number;
  email: string;
}

type OnlyStrings = StringProps<Mixed>;
// {
//   name: string;
//   email: string;
// }
```

### 5. **Real-World: Column Mapping**

```typescript
// Database column to JavaScript property mapping
type ColumnMap = {
  user_id: number;
  first_name: string;
  last_name: string;
  created_at: Date;
};

// Convert snake_case to camelCase
type CamelCase<T extends Record<string, any>> = {
  [K in keyof T as K extends string 
    ? K extends `${infer A}_${infer B}`
      ? `${A}${Capitalize<B>}`
      : K
    : K]: T[K]
};

type JSProps = CamelCase<ColumnMap>;
// {
//   userId: number;
//   firstName: string;
//   lastName: string;
//   createdAt: Date;
// }
```

## Real-World Patterns

### Pattern 1: Readonly Wrapper
```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};

type ImmutableUser = DeepReadonly<User>;
```

### Pattern 2: Event Emitter Type-Safe
```typescript
type EventMap = {
  'user-created': User;
  'user-deleted': { id: string };
  'user-updated': { id: string; changes: Partial<User> };
};

type EventHandlers<E extends EventMap> = {
  [K in keyof E as `on${Capitalize<K & string>}`]: (data: E[K]) => void;
};

type UserEventHandlers = EventHandlers<EventMap>;
// {
//   onUserCreated: (data: User) => void;
//   onUserDeleted: (data: { id: string }) => void;
//   onUserUpdated: (data: { id: string; changes: Partial<User> }) => void;
// }
```

### Pattern 3: API Endpoint Generator
```typescript
type ApiEndpoint = {
  'GET /users': { response: User[] };
  'POST /users': { body: CreateUserDTO; response: User };
  'GET /users/:id': { response: User };
};

type ApiMethods = {
  [E in keyof ApiEndpoint as E extends `${infer Method} ${infer Path}`
    ? `${Lowercase<Method>}`
    : never]: (path: string, data?: any) => Promise<any>;
};
```

### Pattern 4: Column Property Transformer
```typescript
type ColumnToProperty<T extends Record<string, any>> = {
  [K in keyof T as K extends string ? Uncapitalize<K> : K]: T[K];
};

type UserFromDB = ColumnToProperty<{
  USER_ID: number;
  USER_NAME: string;
}>;
// {
//   uSER_ID: number;
//   uSER_NAME: string;
// }
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/mapped-types` | Get examples of mapped type transformations |
| GET | `/api/rows` | Get database rows with mapped column names |
| GET | `/api/events` | Get event handler definitions |
| POST | `/api/transform` | Transform object structure |
| GET | `/api/schema` | Show TypeScript schema with mapped types |

## Common Patterns

### Getters & Setters
```typescript
type Getters<T> = {
  [K in keyof T]: () => T[K];
};

type Setters<T> = {
  [K in keyof T]: (value: T[K]) => void;
};

type PropertyDescriptors<T> = {
  [K in keyof T]: TypedPropertyDescriptor<T[K]>;
};
```

### Record Functions
```typescript
type Functions<T> = {
  [K in keyof T]: (input: unknown) => T[K];
};

// Usage
type Validators: Functions<{
  email: boolean;
  age: boolean;
  phone: boolean;
}> = {
  email: (x) => /^[^@]+@[^@]+$/.test(x),
  age: (x) => typeof x === 'number' && x > 0,
  phone: (x) => /^[\d+\-\s]+$/.test(x)
};
```

### Constructor Types
```typescript
type Constructors<T extends Record<string, any>> = {
  [K in keyof T]: new () => T[K];
};

const classes: Constructors<{ user: User; post: Post }> = {
  user: User,
  post: Post
};
```

## Exercises

1. **Create Getters/Setters**: Build getter and setter functions for all User properties
2. **Event Handler Generator**: Generate typed event handlers from event map
3. **Column Mapper**: Convert database column names (snake_case) to JS properties (camelCase)
4. **Config Validator**: Create validators for each config property using mapped types

## Key Takeaways

✅ **Mapped Types** iterate over object keys with `[K in keyof T]`  
✅ **Template Literal Types** create strings dynamically with backticks  
✅ **Key remapping** with `as` transforms property names  
✅ Conditional types inside mapped types filter properties  
✅ Enables **zero-cost type-safe abstractions**  

## Real-World Usage

```typescript
// Event emitter with full type safety
type EventMap = {
  'connected': { timestamp: Date };
  'message': { text: string; from: string };
  'error': { code: number; message: string };
};

type EventHandlers<E extends EventMap> = {
  [K in keyof E as K extends string ? `on${Capitalize<K>}` : never]: 
    (data: E[K]) => void;
};

class TypedEmitter<E extends EventMap> {
  private listeners: Partial<EventHandlers<E>> = {};

  on<K extends keyof E>(event: K & string, handler: (data: E[K]) => void) {
    const methodName = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
    this.listeners[`on${event}` as keyof EventHandlers<E>] = handler;
  }

  emit<K extends keyof E>(event: K, data: E[K]) {
    const handler = this.listeners[`on${event}` as any];
    handler?.(data);
  }
}

// Usage
const emitter = new TypedEmitter<EventMap>();
emitter.on('message', (data) => {
  console.log(data.text); // Type-safe!
});

emitter.emit('message', { text: 'Hello', from: 'Alice' });
```

## Resources

- [TypeScript: Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [TypeScript: Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [Advanced Type Patterns](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

## Common mistakes

## Real world usage
