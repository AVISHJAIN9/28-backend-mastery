# Module 13.5: Discriminated Unions

## Overview

**Discriminated Unions** (also called tagged unions or sum types) are a pattern where each variant has a unique tag property. This enables **exhaustiveness checking**, **pattern matching**, and **type-safe error handling** without lost type information.

## Key Concepts

### 1. **Discriminated Union Basics**

A common tag discriminates between variants:

```typescript
// Union with `ok` discriminator
type Result<T, E> = 
  | { ok: true; data: T }
  | { ok: false; error: E };

// Usage
const result: Result<User, string> = { ok: true, data: user };

// TypeScript narrows after checking discriminator
if (result.ok) {
  console.log(result.data); // User
} else {
  console.log(result.error); // string
}
```

### 2. **Exhaustiveness Checking**

TypeScript ensures all cases are handled:

```typescript
type Status = 'pending' | 'loading' | 'success' | 'error';

type State = 
  | { type: 'PENDING' }
  | { type: 'LOADING'; progress: number }
  | { type: 'SUCCESS'; data: string }
  | { type: 'ERROR'; error: string };

function handleState(state: State) {
  switch (state.type) {
    case 'PENDING': break;
    case 'LOADING': console.log(state.progress); break;
    case 'SUCCESS': console.log(state.data); break;
    case 'ERROR': console.log(state.error); break;
    // ✅ Compiler error if you forget any case!
  }
}
```

### 3. **Pattern Matching with Type Guards**

```typescript
type Response<T> =
  | { status: 'ok'; code: 200; body: T }
  | { status: 'created'; code: 201; body: T }
  | { status: 'error'; code: 400 | 500; error: string }
  | { status: 'unauthorized'; code: 401 };

function processResponse<T>(res: Response<T>) {
  if (res.code === 200 || res.code === 201) {
    // ✅ TypeScript knows body exists
    console.log(res.body);
  } else if (res.code === 400 || res.code === 500) {
    // ✅ TypeScript knows error exists
    console.log(res.error);
  } else {
    // ✅ Remaining case narrowed to 401
  }
}
```

### 4. **Complex State Machines**

```typescript
type OrderEvent =
  | { type: 'CREATED'; orderId: string; total: number }
  | { type: 'PROCESSING'; orderId: string }
  | { type: 'SHIPPED'; orderId: string; trackingId: string }
  | { type: 'DELIVERED'; orderId: string; signature: 'signed' | 'left' }
  | { type: 'CANCELLED'; orderId: string; reason: string };

type OrderState = 
  | { stage: 'pending'; event: Extract<OrderEvent, { type: 'CREATED' }> }
  | { stage: 'processing'; event: Extract<OrderEvent, { type: 'PROCESSING' }> }
  | { stage: 'shipped'; event: Extract<OrderEvent, { type: 'SHIPPED' }> }
  | { stage: 'delivered'; event: Extract<OrderEvent, { type: 'DELIVERED' }> }
  | { stage: 'cancelled'; event: Extract<OrderEvent, { type: 'CANCELLED' }> };

function nextStage(order: OrderState): OrderState {
  switch (order.stage) {
    case 'pending':
      return {
        stage: 'processing',
        event: { type: 'PROCESSING', orderId: order.event.orderId }
      };
    // ... other cases
  }
}
```

### 5. **Error Handling Pattern**

Modern API response pattern:

```typescript
type ApiResponse<T, E = string> = 
  | { ok: true; data: T; timestamp: number }
  | { ok: false; error: E; code: number; timestamp: number };

// Function returns discriminated union
async function fetchUser(id: string): Promise<ApiResponse<User>> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (res.ok) {
      const user = await res.json();
      return { ok: true, data: user, timestamp: Date.now() };
    } else {
      return {
        ok: false,
        error: `User not found`,
        code: res.status,
        timestamp: Date.now()
      };
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Unknown error',
      code: 500,
      timestamp: Date.now()
    };
  }
}

// Usage with exhaustive checks
const result = await fetchUser('123');

if (result.ok) {
  console.log(result.data.email);
} else {
  console.error(result.error); // Can't forget error handling!
}
```

## Real-World Patterns

### Pattern 1: Redux-style Actions
```typescript
type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.payload };
    case 'CLEAR_USER': return { ...state, user: null };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
  }
}
```

### Pattern 2: Finite State Machine
```typescript
type TrafficLight = 
  | { color: 'RED'; next: 'GREEN' }
  | { color: 'GREEN'; next: 'YELLOW' }
  | { color: 'YELLOW'; next: 'RED' };

function transition(light: TrafficLight): TrafficLight {
  switch (light.color) {
    case 'RED': return { color: 'GREEN', next: 'YELLOW' };
    case 'GREEN': return { color: 'YELLOW', next: 'RED' };
    case 'YELLOW': return { color: 'RED', next: 'GREEN' };
  }
}
```

### Pattern 3: Polymorphic Notifications
```typescript
type Notification =
  | { type: 'EMAIL'; to: string; subject: string; body: string }
  | { type: 'SMS'; phone: string; message: string }
  | { type: 'PUSH'; userId: string; title: string; body: string };

function send(notif: Notification): Promise<void> {
  switch (notif.type) {
    case 'EMAIL': return sendEmail(notif.to, notif.subject, notif.body);
    case 'SMS': return sendSMS(notif.phone, notif.message);
    case 'PUSH': return sendPush(notif.userId, notif.title, notif.body);
  }
}
```

### Pattern 4: Form Submission Handling
```typescript
type FormState = 
  | { status: 'IDLE' }
  | { status: 'SUBMITTING' }
  | { status: 'SUCCESS'; data: FormData }
  | { status: 'ERROR'; errors: Record<string, string> };

function renderForm(state: FormState) {
  if (state.status === 'SUBMITTING') {
    return <LoadingSpinner />;
  } else if (state.status === 'SUCCESS') {
    return <SuccessMessage data={state.data} />;
  } else if (state.status === 'ERROR') {
    return <ErrorList errors={state.errors} />;
  } else {
    return <Form />;
  }
}
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/users` | Create user (discriminated response) |
| GET | `/api/users` | List users |
| GET | `/api/users/:id` | Get user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| POST | `/api/orders` | Create order with state machine |
| POST | `/api/orders/:id/process` | Process order |
| POST | `/api/orders/:id/ship` | Ship order |
| GET | `/api/orders/:id/status` | Get order status |

## Common Mistakes to Avoid

❌ **Non-unique discriminators**
```typescript
// BAD: Both have same method, unclear which one
type Request = 
  | { type: 'GET'; url: string }
  | { type: 'GET'; headers: Record<string, string> };  // Duplicate!
```

✅ **Unique discriminators**
```typescript
// GOOD: Each has unique type value
type Request = 
  | { type: 'GET'; url: string }
  | { type: 'POST'; data: unknown };
```

## Exercises

1. **API Response Handler**: Build a discriminated union for API responses and handle all cases
2. **Order State Machine**: Model order lifecycle with discriminated states
3. **Form Validation**: Create form validation with success/error responses
4. **Notification Router**: Route notifications based on discriminated type

## Key Takeaways

✅ **Discriminated Unions** use a unique tag to distinguish variants  
✅ Enable **exhaustiveness checking** - compiler enforces all cases  
✅ **Type narrows** automatically when discriminator is checked  
✅ Perfect for **state machines** and **API responses**  
✅ Eliminate runtime errors from missed cases  

## Real-World Usage

```typescript
// Complete order processing system
type OrderEvent = 
  | { type: 'ORDER_CREATED'; id: string; total: number }
  | { type: 'PAYMENT_APPROVED'; id: string }
  | { type: 'PAYMENT_FAILED'; id: string; reason: string }
  | { type: 'SHIPPED'; id: string; tracking: string }
  | { type: 'DELIVERED'; id: string }
  | { type: 'CANCELLED'; id: string; reason: string };

class OrderProcessor {
  async process(event: OrderEvent): Promise<void> {
    switch (event.type) {
      case 'ORDER_CREATED':
        await this.validateOrder(event.id, event.total);
        break;
      case 'PAYMENT_APPROVED':
        await this.prepareShipment(event.id);
        break;
      case 'PAYMENT_FAILED':
        await this.notifyCustomer(event.id, event.reason);
        break;
      case 'SHIPPED':
        await this.updateTracking(event.id, event.tracking);
        break;
      case 'DELIVERED':
        await this.requestReview(event.id);
        break;
      case 'CANCELLED':
        await this.issueRefund(event.id, event.reason);
        break;
    }
  }
}

// TypeScript enforces that all event types are handled!
```

## Resources

- [TypeScript Handbook: Discriminated Unions](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions)
- [Exhaustiveness Checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- [ADTs in TypeScript](https://github.com/gcanti/fp-ts)

## Common mistakes

## Real world usage
