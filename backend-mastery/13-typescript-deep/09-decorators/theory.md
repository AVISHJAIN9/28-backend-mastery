# 13.9: Decorators - Class & Method Decoration

## What are Decorators?

**Decorators** are functions that modify classes, methods, properties, or parameters. They provide a declarative way to add behavior.

```typescript
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`Called ${propertyKey} with`, args);
    return originalMethod.apply(this, args);
  };
}

class User {
  @Log
  greet(name: string) {
    return `Hello ${name}`;
  }
}
```

---

## Decorator Types

### 1. Class Decorators

```typescript
function Sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@Sealed
class User {
  name: string = 'Alice';
}

// Can't add new properties to User
```

### 2. Method Decorators

```typescript
function Validate(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args: any[]) {
    // Validation logic before method call
    if (!args[0]) throw new Error('Argument required');
    return originalMethod.apply(this, args);
  };
}

class UserService {
  @Validate
  getUser(id: number) {
    return { id, name: 'Alice' };
  }
}
```

### 3. Property Decorators

```typescript
function Min(min: number) {
  return function(target: any, propertyKey: string) {
    let value: number;
    Object.defineProperty(target, propertyKey, {
      get() { return value; },
      set(v: number) {
        if (v < min) throw new Error(`Value must be >= ${min}`);
        value = v;
      }
    });
  };
}

class User {
  @Min(18)
  age: number = 0;
}
```

### 4. Parameter Decorators

```typescript
function Required(target: any, propertyKey: string, parameterIndex: number) {
  console.log(`Parameter ${parameterIndex} of ${propertyKey} is required`);
}

class User {
  greet(@Required name: string) {
    return `Hello ${name}`;
  }
}
```

---

## Practical Express Patterns

### Authentication Decorator

```typescript
function Authenticated(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(req: any, res: any, ...args: any[]) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return originalMethod.apply(this, [req, res, ...args]);
  };
}

class UserController {
  @Authenticated
  getProfile(req: any, res: any) {
    res.json({ user: req.user });
  }
}
```

### Logging Decorator

```typescript
function LogExecution(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.time(propertyKey);
    const result = originalMethod.apply(this, args);
    console.timeEnd(propertyKey);
    return result;
  };
}

class Database {
  @LogExecution
  async query(sql: string) {
    // Database query
  }
}
```

### Rate Limit Decorator

```typescript
function RateLimit(maxCalls: number, windowMs: number) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const calls: { [key: string]: number[] } = {};
    
    descriptor.value = function(userId: string, ...args: any[]) {
      const now = Date.now();
      if (!calls[userId]) calls[userId] = [];
      
      calls[userId] = calls[userId].filter(time => now - time < windowMs);
      if (calls[userId].length >= maxCalls) {
        throw new Error('Rate limit exceeded');
      }
      
      calls[userId].push(now);
      return originalMethod.apply(this, [userId, ...args]);
    };
  };
}

class API {
  @RateLimit(5, 60000)  // 5 calls per minute
  callEndpoint(userId: string) {
    return { success: true };
  }
}
```

---

## Factory Pattern with Decorators

```typescript
function Model(tableName: string) {
  return function(constructor: Function) {
    constructor.prototype.tableName = tableName;
    constructor.prototype.save = function() {
      console.log(`Saving to ${tableName}`);
    };
  };
}

@Model('users')
class User {
  name: string = 'Alice';
}

const user = new User();
user.save();  // Logs: Saving to users
```

---

## Decorator Factories

```typescript
function ValidateType(type: Function) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      if (!(args[0] instanceof type)) {
        throw new Error(`Argument must be instance of ${type.name}`);
      }
      return originalMethod.apply(this, args);
    };
  };
}

class UserService {
  @ValidateType(User)
  save(user: User) {
    // save logic
  }
}
```

---

## Enable Decorators in TypeScript

In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```
