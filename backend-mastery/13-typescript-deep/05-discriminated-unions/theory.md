# 13.5: Discriminated Unions - Type-Safe Type Narrowing

## What are Discriminated Unions?

**Discriminated unions** (also called **tagged unions**) use a common field (discriminator) to narrow types. This provides perfect type safety without runtime checks.

```typescript
// Without discriminator - need instanceof or typeof
type Result = User | Error;
if (result instanceof User) { /* use result as User */ }

// With discriminator - TypeScript narrows automatically
type Result = 
  | { type: 'user'; data: User }
  | { type: 'error'; error: string };

if (result.type === 'user') {
  console.log(result.data);  // TypeScript knows this exists
}
```

---

## Basic Pattern

### Single Discriminator

```typescript
type Success = { ok: true; data: string };
type Failure = { ok: false; error: string };
type Result = Success | Failure;

function handle(result: Result) {
  if (result.ok) {
    // result.data exists
    console.log(result.data);
  } else {
    // result.error exists
    console.log(result.error);
  }
}
```

### Multiple Discriminators

```typescript
type Circle = { shape: 'circle'; radius: number };
type Square = { shape: 'square'; side: number };
type Rectangle = { shape: 'rectangle'; width: number; height: number };

type Shape = Circle | Square | Rectangle;

function area(shape: Shape): number {
  switch (shape.shape) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.side ** 2;
    case 'rectangle':
      return shape.width * shape.height;
  }
}
```

---

## Advanced Patterns

### Pattern 1: API Response

```typescript
type ApiResponse<T> =
  | {
      ok: true;
      status: 200 | 201;
      data: T;
      timestamp: number;
    }
  | {
      ok: false;
      status: 400 | 401 | 404 | 500;
      error: { message: string; code: string };
      timestamp: number;
    };

function handle<T>(response: ApiResponse<T>) {
  if (response.ok) {
    // status is 200 | 201
    // data exists
    console.log(response.data);
  } else {
    // status is 400 | 401 | 404 | 500
    // error exists
    console.log(response.error);
  }
}
```

### Pattern 2: State Machine

```typescript
type AuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; user: User }
  | { status: 'error'; error: string };

function reducer(state: AuthState, action: Action): AuthState {
  switch (state.status) {
    case 'idle':
      return { status: 'loading' };
    case 'loading':
      if (action.type === 'SUCCESS') {
        return { status: 'success', user: action.payload };
      }
      return { status: 'error', error: action.error };
    case 'success':
      if (action.type === 'LOGOUT') return { status: 'idle' };
      return state;
    case 'error':
      return { status: 'idle' };
  }
}
```

### Pattern 3: Notification System

```typescript
type Notification =
  | { type: 'success'; message: string; duration: number }
  | { type: 'error'; message: string; actionLabel?: string; onAction?: () => void }
  | { type: 'info'; message: string; icon: string }
  | { type: 'warning'; message: string; dismissible: boolean };

function showNotification(notif: Notification) {
  switch (notif.type) {
    case 'success':
      displaySuccess(notif.message, notif.duration);
      break;
    case 'error':
      displayError(notif.message, notif.actionLabel, notif.onAction);
      break;
    case 'info':
      displayInfo(notif.message, notif.icon);
      break;
    case 'warning':
      displayWarning(notif.message, notif.dismissible);
      break;
  }
}
```

### Pattern 4: Event System

```typescript
type UserEvent =
  | { type: 'USER_CREATED'; userId: number; email: string }
  | { type: 'USER_UPDATED'; userId: number; changes: Partial<User> }
  | { type: 'USER_DELETED'; userId: number }
  | { type: 'USER_LOGGED_IN'; userId: number; timestamp: number }
  | { type: 'USER_LOGGED_OUT'; userId: number };

function handleEvent(event: UserEvent) {
  switch (event.type) {
    case 'USER_CREATED':
      sendWelcomeEmail(event.email);
      break;
    case 'USER_UPDATED':
      updateCache(event.userId, event.changes);
      break;
    case 'USER_DELETED':
      deleteUserData(event.userId);
      break;
    case 'USER_LOGGED_IN':
      recordLogin(event.userId, event.timestamp);
      break;
    case 'USER_LOGGED_OUT':
      recordLogout(event.userId);
      break;
  }
}
```

### Pattern 5: Form Submission States

```typescript
type FormState =
  | { stage: 'initial'; errors: Record<string, string> }
  | { stage: 'validating'; field: string }
  | { stage: 'submitting'; progress: number }
  | { stage: 'success'; message: string; redirectUrl?: string }
  | { stage: 'error'; errorMessage: string; recoverable: boolean };

function renderForm(state: FormState): JSX.Element {
  switch (state.stage) {
    case 'initial':
      return <Form errors={state.errors} />;
    case 'validating':
      return <Form validatingField={state.field} />;
    case 'submitting':
      return <SubmitProgress progress={state.progress} />;
    case 'success':
      return <SuccessMessage message={state.message} redirect={state.redirectUrl} />;
    case 'error':
      return <ErrorMessage message={state.errorMessage} recoverable={state.recoverable} />;
  }
}
```

---

## With Generic Types

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

type User = { id: number; name: string };
type ValidationError = { field: string; message: string };

type UserResult = Result<User, ValidationError>;

function process(result: UserResult) {
  if (result.ok) {
    console.log(result.value.name);  // User
  } else {
    console.log(result.error.field);  // ValidationError
  }
}
```

---

## Using Zod with Discriminated Unions

```typescript
import { z } from 'zod';

const successSchema = z.object({
  ok: z.literal(true),
  data: z.unknown()
});

const errorSchema = z.object({
  ok: z.literal(false),
  error: z.object({ message: z.string() })
});

// Zod has built-in support!
const resultSchema = z.discriminatedUnion('ok', [successSchema, errorSchema]);

type Result = z.infer<typeof resultSchema>;
// Perfect type narrowing + runtime validation
```

---

## Exhaustiveness Checking

```typescript
type Color = 'red' | 'green' | 'blue';

function handleColor(color: Color): string {
  switch (color) {
    case 'red':
      return 'FF0000';
    case 'green':
      return '00FF00';
    // ❌ Error: Color 'blue' not handled
  }
}

// Fix:
function handleColor(color: Color): string {
  switch (color) {
    case 'red':
      return 'FF0000';
    case 'green':
      return '00FF00';
    case 'blue':
      return '0000FF';
  }
}

// Or use exhaustive check helper:
function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${value}`);
}

function handleColor(color: Color): string {
  switch (color) {
    case 'red':
      return 'FF0000';
    default:
      assertNever(color);  // ❌ Error if not exhaustive
  }
}
```

---

## Benefits

✅ **Type Safety** - TypeScript narrows types automatically  
✅ **No Runtime Checks** - Discriminator is compile-time safe  
✅ **Exhaustiveness** - TS ensures all cases handled  
✅ **Self-Documenting** - Type shows all possible states  
✅ **Easy Refactoring** - Change type, TS shows all places to update  

## Common Mistakes

❌ Using `typeof` when discriminator exists  
❌ Forgetting to check discriminator before accessing fields  
❌ Making discriminator optional  
❌ Using non-literal discriminator values  

---

## Key Takeaway

**Discriminated unions = Exhaustive type narrowing without runtime overhead**

Always use when you have multiple related types that need switching logic.
