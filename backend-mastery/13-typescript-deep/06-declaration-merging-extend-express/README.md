# Module 13.6: Declaration Merging - Extend Express Types

## Overview

Declaration Merging allows you to **extend and add to existing types** without creating new types. This is powerful for augmenting third-party libraries like Express.js with custom properties on `Request` and `Response` objects.

## Key Concepts

### 1. **Interface Declaration Merging**

Multiple declarations with the same name are merged into one:

```typescript
// Declaration 1
interface Window {
  myCustomProperty: string;
}

// Declaration 2 (same name!)
interface Window {
  anotherProperty: number;
}

// Result: Window has both properties
const w: Window = {
  myCustomProperty: 'hello',
  anotherProperty: 42
};
```

### 2. **Extending Express Request/Response**

Express server with custom properties on `req` and `res`:

```typescript
// Declare custom types
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
      context?: { requestId: string; timestamp: Date };
    }
    interface Response {
      sendSuccess?: (data: any) => void;
      sendError?: (error: string) => void;
    }
  }
}

// Now use in middleware
app.use((req, res, next) => {
  req.user = { id: '123', role: 'admin' };
  req.context = { requestId: uuidv4(), timestamp: new Date() };
  next();
});

// Use in routes
app.get('/api/user', (req, res) => {
  console.log(req.user?.role); // TypeScript knows this exists
  res.sendSuccess?.(req.user); // Helper method
});
```

### 3. **Module Augmentation**

Merge with global modules and namespaces:

```typescript
// Augment built-in types
declare global {
  interface String {
    padLeft(n: number): string;
  }
}

String.prototype.padLeft = function(n: number) {
  return ' '.repeat(n) + this;
};

const str = 'hello'.padLeft(5);
```

### 4. **Namespace Merging**

Add functions and types to existing namespaces:

```typescript
namespace Validation {
  export function isEmail(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }
}

namespace Validation {
  export function isPhone(str: string): boolean {
    return /^\+?[0-9]{10,}$/.test(str);
  }
}

// Both functions available in Validation namespace
Validation.isEmail('test@test.com');
Validation.isPhone('+12125551234');
```

### 5. **Real-World Express Augmentation Pattern**

```typescript
// types/express.d.ts
import { User } from './models/User';

declare global {
  namespace Express {
    interface Request {
      user: User;
      locale: string;
      requestId: string;
    }
    interface Response {
      sendSuccess<T>(data: T): void;
      sendError(message: string, status?: number): void;
      sendPaginated<T>(items: T[], total: number, page: number): void;
    }
  }
}

// Use in any route handler
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  req.user; // Typed!
  res.sendSuccess({ user }); // Typed!
});
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/context` | Get current request context (user, locale, requestId) |
| GET | `/api/users` | List users with authentication context |
| POST | `/api/validate-token` | Validate JWT token, augment with user data |
| GET | `/api/helpers` | Show available helper methods on Response |
| POST | `/api/multi-tenant/:tenant` | Access request augmentation in multi-tenant context |

## Common Patterns

### Pattern 1: Auth Context
```typescript
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'admin' | 'user';
      };
    }
  }
}

// Middleware adds it
app.use(authMiddleware); // Sets req.user
```

### Pattern 2: Response Helpers
```typescript
declare global {
  namespace Express {
    interface Response {
      sendSuccess: <T>(data: T) => void;
      sendError: (msg: string, code?: number) => void;
    }
  }
}

// Implement in middleware
app.use((req, res, next) => {
  res.sendSuccess = (data) => res.json({ ok: true, data });
  res.sendError = (msg, code = 400) => res.status(code).json({ ok: false, error: msg });
  next();
});
```

### Pattern 3: Multi-Tenant Augmentation
```typescript
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        features: string[];
      };
    }
  }
}

// Extracted from URL/header in middleware
app.use((req, res, next) => {
  const tenant = extractTenantFromRequest(req);
  req.tenant = tenant;
  next();
});
```

## Exercises

1. **Extend Express with Logging**: Add a `logger` property to `Request` that tracks operation times
2. **Add Validation Helpers**: Create custom validation functions on `Response` (e.g., `res.validateQuery()`)
3. **Multi-Tenant Integration**: Augment `Request` with `organizationId` and `userId` for multi-tenant apps
4. **Middleware Stack**: Create chained helpers on `Request` for fluent API patterns

## Key Takeaways

✅ **Declaration Merging** extends existing types without modifying originals  
✅ Use `declare global` and namespace merging for third-party libs  
✅ Express augmentation is the most common real-world pattern  
✅ Enables **type-safe middleware** chains and **context passing**  
✅ Avoid conflicts by being specific about what you're extending  

## Real-World Usage

```typescript
// Express app with full augmentation
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      user: { id: string; email: string };
      context: { requestId: string; startTime: number };
    }
    interface Response {
      sendSuccess<T>(data: T): void;
      sendError(msg: string): void;
    }
  }
}

const app = express();

// Setup augmentations
app.use((req, res, next) => {
  req.context = {
    requestId: uuidv4(),
    startTime: Date.now()
  };
  
  res.sendSuccess = (data) =>
    res.json({ ok: true, requestId: req.context.requestId, data });
  
  res.sendError = (msg) =>
    res.status(400).json({ ok: false, error: msg });
  
  next();
});

// Now use with full type safety
app.get('/data', (req, res) => {
  res.sendSuccess({ message: 'Hello', id: req.context.requestId });
});

app.listen(3000);
```

## Resources

- [TypeScript Handbook: Types vs Interfaces](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)
- [TypeScript: Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [Express Type Safety with TS](https://expressjs.com/en/resources/middleware/session.html)

## Common mistakes

## Real world usage
