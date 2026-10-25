# 13.7: Mapped & Template Literal Types - Computed Properties

## What are Mapped Types?

**Mapped types** iterate over object keys to create new types. They let you transform properties programmatically.

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

// Mapped: all properties become optional
type Partial<T> = {
  [K in keyof T]?: T[K];
};

type UserOptional = Partial<User>;
// {
//   name?: string;
//   email?: string;
//   age?: number;
// }
```

---

## Syntax & Patterns

### Pattern 1: Basic Mapping

```typescript
// Make all properties readonly
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type ReadonlyUser = Readonly<User>;
// {
//   readonly name: string;
//   readonly email: string;
//   readonly age: number;
// }
```

### Pattern 2: Transform Value Types

```typescript
// Convert all properties to getters
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// {
//   getName: () => string;
//   getEmail: () => string;
//   getAge: () => number;
// }
```

### Pattern 3: Extract Specific Types

```typescript
// Only string properties
type StringProperties<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

type UserStrings = StringProperties<User>;
// {
//   name: string;
//   email: string;
// }
```

### Pattern 4: Create Event Handlers

```typescript
type Events = {
  click: { x: number; y: number };
  scroll: { top: number };
  submit: { data: FormData };
};

// Map to handlers
type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (event: T[K]) => void;
};

type Handlers = EventHandlers<Events>;
// {
//   onClick: (event: { x: number; y: number }) => void;
//   onScroll: (event: { top: number }) => void;
//   onSubmit: (event: { data: FormData }) => void;
// }
```

---

## Template Literal Types

### What are They?

**Template Literal Types** create string unions from other types.

```typescript
type Role = 'admin' | 'user' | 'moderator';

// Create string variants
type RoleCapitalized = Capitalize<Role>;
// 'Admin' | 'User' | 'Moderator'

type Routes = `/${Role}/profile`;
// '/admin/profile' | '/user/profile' | '/moderator/profile'
```

### Pattern 1: Create Routes

```typescript
type Page = 'home' | 'about' | 'contact';
type Action = 'view' | 'edit' | 'delete';

type Route = `/pages/${Page}/${Action}`;
// '/pages/home/view' | '/pages/home/edit' | '/pages/home/delete'
// | '/pages/about/view' | ... (9 combinations)

// Type-safe routing
const routes: Record<Route, () => void> = {
  '/pages/home/view': () => {},
  '/pages/home/edit': () => {},
  // ... must implement all 9
};
```

### Pattern 2: Create Property Names

```typescript
type Methods = 'get' | 'set';
type Properties = 'name' | 'email' | 'age';

type Accessor = `${Methods}${Capitalize<Properties>}`;
// 'getName' | 'setName' | 'getEmail' | 'setEmail' | 'getAge' | 'setAge'
```

### Pattern 3: Create Event Names

```typescript
type Element = 'button' | 'input' | 'form';
type Event = 'focus' | 'blur' | 'change';

type EventName = `${Element}.${Event}`;
// 'button.focus' | 'button.blur' | 'button.change'
// | 'input.focus' | ... (9 combinations)

// System for event registration
const listeners: Partial<Record<EventName, Function>> = {};

function on(event: EventName, handler: Function) {
  listeners[event] = handler;
}

on('button.focus', () => {});  // ✓ Type-safe
on('invalid.event', () => {});  // ❌ Error!
```

---

## Combining Mapped & Template Literal

### Pattern: Database Column Mapping

```typescript
interface User {
  name: string;
  email: string;
  createdAt: Date;
}

// Map property names to SQL column names
type ColumnNames<T> = {
  [K in keyof T as `col_${string & K}`]: K;
};

type UserColumns = ColumnNames<User>;
// {
//   col_name: 'name';
//   col_email: 'email';
//   col_createdAt: 'createdAt';
// }

// Practical use
const SELECT_COLUMNS = {
  col_name: 'user_table.name',
  col_email: 'user_table.email',
  col_createdAt: 'user_table.created_at'
} as const;
```

### Pattern: API Endpoints

```typescript
type Resource = 'users' | 'posts' | 'comments';
type Method = 'list' | 'get' | 'create' | 'update' | 'delete';

type Endpoint = `${Method}${Capitalize<Resource>}`;
// 'listUsers' | 'getUsers' | 'createUsers' | ... (15 total)

type ApiClient = {
  [K in Endpoint]: (data?: unknown) => Promise<unknown>;
};

// Client has all methods
const client: ApiClient = {
  listUsers: async () => {},
  getUsers: async () => {},
  createUsers: async () => {},
  // ... must implement all 15
};
```

### Pattern: State Setters

```typescript
interface State {
  isLoading: boolean;
  error: string | null;
  data: User[];
}

// Create setState functions 
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

type StateSetters = Setters<State>;
// {
//   setIsLoading: (value: boolean) => void;
//   setError: (value: string | null) => void;
//   setData: (value: User[]) => void;
// }

const useState = (initialState: State) => {
  const state = { ...initialState };
  const setters: StateSetters = {
    setIsLoading: (v) => { state.isLoading = v; },
    setError: (v) => { state.error = v; },
    setData: (v) => { state.data = v; }
  };
  return [state, setters] as const;
};
```

---

## Built-in Template Literal Utilities

```typescript
type Hello = 'hello';

// Capitalize
type Hello1 = Capitalize<Hello>;  // 'Hello'

// Uncapitalize
type Hello2 = Uncapitalize<'HELLO'>;  // 'hELLO'

// Uppercase
type Hello3 = Uppercase<Hello>;  // 'HELLO'

// Lowercase
type Hello4 = Lowercase<'HELLO'>;  // 'hello'
```

---

## Conditional Mapped Types

```typescript
// Only map numeric properties
type NumericProperties<T> = {
  [K in keyof T as T[K] extends number ? K : never]: T[K];
};

// Result: only age
type UserNumbers = NumericProperties<User>;
// { age: number }

// Only map non-function properties
type DataProperties<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
```

---

## Practical Examples

### Example 1: Form Fields from State

```typescript
interface FormState {
  username: string;
  email: string;
  age: number;
  terms: boolean;
}

type FormFields = {
  [K in keyof FormState]: {
    name: K;
    value: FormState[K];
    onChange: (value: FormState[K]) => void;
  };
};

type UserFormFields = FormFields;
// {
//   username: { name: 'username'; value: string; onChange: (v: string) => void };
//   email: { name: 'email'; value: string; onChange: (v: string) => void };
//   age: { name: 'age'; value: number; onChange: (v: number) => void };
//   terms: { name: 'terms'; value: boolean; onChange: (v: boolean) => void };
// }
```

### Example 2: Async Operations

```typescript
type Operations = {
  fetchUsers: (limit: number) => Promise<User[]>;
  fetchPosts: (userId: number) => Promise<Post[]>;
  fetchComments: (postId: number) => Promise<Comment[]>;
};

// Create loading states for each
type LoadingStates<T> = {
  [K in keyof T as `${string & K}Loading`]: boolean;
};

type OpLoadingStates = LoadingStates<Operations>;
// {
//   fetchUsersLoading: boolean;
//   fetchPostsLoading: boolean;
//   fetchCommentsLoading: boolean;
// }
```

---

## Key Takeaways

1. **Mapped Types iterate properties** - `[K in keyof T]`
2. **Template literals create unions** - `` `prefix${Type}suffix` ``
3. **Combine for power** - Mapped + template literal = computed property names
4. **Type-safe strings** - No typos in event names, routes, etc.
5. **DRY principle** - Don't duplicate property lists

