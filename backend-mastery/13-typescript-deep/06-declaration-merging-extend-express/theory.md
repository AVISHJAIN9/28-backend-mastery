# 13.6: Declaration Merging & Extend Express

## What is Declaration Merging?

**Declaration Merging** allows you to split a single type across multiple declarations. TypeScript combines them into one definition.

```typescript
// Declaration 1
interface User {
  id: number;
  name: string;
}

// Declaration 2
interface User {
  email: string;
}

// Result: User has id, name, AND email
const user: User = { id: 1, name: 'Alice', email: 'alice@test.com' };
```

---

## Why Use Declaration Merging?

1. **Augment Third-party Types** - Add fields to Express, lodash, etc.
2. **Module Namespaces** - Group related declarations
3. **Plugin Architecture** - Let plugins extend core types
4. **Type Splitting** - Separate concerns across files

---

## Merging Rules

### 1. Interface Merging (Most Common)

```typescript
// file1.ts
interface Config {
  apiUrl: string;
}

// file2.ts
interface Config {
  timeout: number;
}

// Result
const config: Config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};
```

### 2. Function & Namespace Merging

```typescript
// Function
function describe(value: string): void;
function describe(value: number): void;
function describe(value: string | number) {
  console.log(value);
}

// Namespace (same name)
namespace describe {
  export interface Options {
    verbose: boolean;
  }
}

// Usage
describe('test');
const opts: describe.Options = { verbose: true };
```

### 3. Namespace Merging

```typescript
namespace Animals {
  export class Zebra {}
}

namespace Animals {
  export interface Legged {
    numberOfLegs: number;
  }
}

// Result: Animals has Zebra class and Legged interface
```

---

## Augmenting Express

### Pattern 1: Extend Request Type

```typescript
// typings/express.d.ts or in main file
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: string };
      validated?: Record<string, unknown>;
      startTime?: number;
    }
  }
}

// Usage in middleware
app.use((req, res, next) => {
  req.user = { id: 1, role: 'admin' };
  req.validated = { /* ... */ };
  next();
});

// Usage in route handler - autocomplete works!
app.get('/profile', (req, res) => {
  console.log(req.user?.role);  // ✓ TypeScript knows about user
});
```

### Pattern 2: Extend Response Type

```typescript
declare global {
  namespace Express {
    interface Response {
      sendSuccess<T>(data: T): void;
      sendError(message: string, code: string): void;
    }
  }
}

// Add helper methods
app.use((req, res, next) => {
  res.sendSuccess = function<T>(data: T) {
    this.json({ ok: true, data, timestamp: Date.now() });
  };
  
  res.sendError = function(message: string, code: string) {
    this.status(400).json({ ok: false, error: { message, code } });
  };
  
  next();
});

// Usage with full type safety
app.get('/users/:id', (req, res) => {
  const user = getUser(parseInt(req.params.id));
  if (user) {
    res.sendSuccess(user);  // ✓ Type-safe
  } else {
    res.sendError('Not found', 'USER_NOT_FOUND');  // ✓ Type-safe
  }
});
```

### Pattern 3: Custom Context Object

```typescript
interface RequestContext {
  userId: number;
  permissions: string[];
  requestId: string;
}

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

// Set in middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.context = {
    userId: 123,
    permissions: ['read', 'write'],
    requestId: generateId()
  };
  next();
};

// Use in handlers
app.get('/data', authMiddleware, (req, res) => {
  console.log(req.context?.userId);  // Type: number | undefined
  console.log(req.context?.permissions);  // Type: string[]
});
```

---

## Declaration Merging with Modules

### Pattern 1: Augmenting Global

```typescript
// types/index.d.ts
declare global {
  var DEBUG: boolean;
  function log(message: string): void;
  
  interface Window {
    APP_CONFIG: { apiUrl: string };
  }
}

// Usage anywhere
if (DEBUG) {
  log('Debug enabled');
}
console.log(window.APP_CONFIG.apiUrl);
```

### Pattern 2: Module Augmentation

```typescript
// Augment third-party module
declare module 'lodash' {
  interface LoDashStatic {
    customMethod(): string;
  }
}

// Now available on lodash
import _ from 'lodash';
_.customMethod();  // ✓ TypeScript knows about it
```

### Pattern 3: Namespace Augmentation

```typescript
// app.ts
export namespace AppConfig {
  export interface Settings {
    apiUrl: string;
  }
}

// plugins/plugin1.ts
import { AppConfig } from './app';

declare global {
  namespace AppConfig {
    interface Settings {
      featureFlags: Record<string, boolean>;
    }
  }
}

// Result: AppConfig.Settings has both apiUrl + featureFlags
```

---

## Practical Example: Multi-Tenant Request

```typescript
// types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      tenant: {
        id: string;
        name: string;
        tier: 'free' | 'premium';
      };
      user: {
        id: number;
        email: string;
        role: 'owner' | 'member';
      } | null;
    }
  }
}

// middleware/tenant.ts
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get tenant from subdomain
  const tenant = getTenantFromRequest(req);
  if (!tenant) {
    return res.status(400).json({ error: 'Invalid tenant' });
  }
  
  req.tenant = tenant;  // ✓ Type-safe assignment
  next();
};

// routes/data.ts
router.get('/data', (req, res) => {
  // TypeScript knows req.tenant exists
  console.log(`Fetching data for tenant ${req.tenant.id}`);
  
  // And req.user (might be null)
  if (req.user) {
    console.log(`User: ${req.user.email}`);
  }
});
```

---

## Merging Order Matters

```typescript
// Order 1: Method then property
interface Car {
  drive(): void;
}

interface Car {
  wheels: number;
}

// Order 2: Property then method - SAME RESULT
interface Car {
  wheels: number;
}

interface Car {
  drive(): void;
}

// Both result in:
type Car = {
  drive(): void;
  wheels: number;
};
```

---

## Best Practices

✅ **Use for type augmentation** - Extend third-party types safely  
✅ **Document merged declarations** - Comments explain why split  
✅ **Keep related merges together** - Don't scatter declarations  
✅ **Use namespaces for organization** - Group logical declarations  

❌ **Don't merge unrelated interfaces** - Only merge related concerns  
❌ **Avoid deep merging** - Keep it simple  
❌ **Don't rely on merge order** - Order shouldn't matter  

---

## Key Takeaway

**Declaration Merging = Type-safe extension without losing type information**

Perfect for adding custom context to Express requests or augmenting third-party types.
