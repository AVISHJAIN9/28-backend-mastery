# Module 13.3: Zod - Runtime & Compile-time Validation

Master **Zod** for type-safe schema validation. Define schemas that validate data at runtime while automatically generating TypeScript types.

## What You'll Learn

- **Schema Definition** - Define validation rules in one place
- **Type Inference** - Extract TypeScript types from schemas
- **Validation Methods** - `.parse()` vs `.safeParse()` patterns
- **Refinements** - Custom validation with `.refine()`
- **Discriminated Unions** - Type-safe result patterns
- **Composition** - Reuse and extend schemas
- **Middleware Integration** - Express validation patterns

## Quick Start

### 1. Install Dependencies

```bash
cd 13-typescript-deep/03-zod-runtime-compile-time
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

### 3. Run Backend

```bash
npm start
# Server runs on http://localhost:13003
```

### 4. Test Validation

```bash
# Validate user data
curl -X POST http://localhost:13003/api/validate/user \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@test.com", "role": "user"}'

# Test password rules
curl -X POST http://localhost:13003/api/validate/password \
  -H "Content-Type: application/json" \
  -d '{"password": "WeakPass"}'

# Validate signup form (cross-field)
curl -X POST http://localhost:13003/api/validate/form \
  -H "Content-Type: application/json" \
  -d '{"email": "john@test.com", "password": "SecurePass123!", "confirmPassword": "SecurePass123!"}'
```

## Core Concepts

### 1. Schema Definition

```javascript
const userSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'moderator']),
  isActive: z.boolean()
});
```

### 2. Type Inference

```javascript
// Extract TypeScript type from schema
type User = z.infer<typeof userSchema>;

// Equivalent to:
// {
//   id: number;
//   name: string;
//   email: string;
//   role: 'admin' | 'user' | 'moderator';
//   isActive: boolean;
// }
```

### 3. Validation Patterns

**Parse (throws on error):**
```javascript
try {
  const user = userSchema.parse(data);
  // user is typed as User
} catch (error) {
  console.error(error.message);
}
```

**SafeParse (returns Result):**
```javascript
const result = userSchema.safeParse(data);

if (result.success) {
  const user = result.data;  // Type: User
} else {
  console.error(result.error);  // ZodError
}
```

### 4. Custom Validation with Refinements

```javascript
// Single rule check
const passwordSchema = z.string()
  .min(8)
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    { message: 'Must contain uppercase' }
  )
  .refine(
    (pwd) => /[0-9]/.test(pwd),
    { message: 'Must contain number' }
  );

// Cross-field validation
const signupSchema = z.object({
  password: z.string(),
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']  // Attach error to this field
  }
);
```

### 5. Schema Composition

```javascript
// Extend schema
const adminUserSchema = userSchema.extend({
  permissions: z.array(z.string())
});

// Pick specific fields
const userPublicSchema = userSchema.omit({ role: true });

// Partial (all fields optional)
const updateUserSchema = userSchema.omit({ id: true }).partial();

// Union
const userOrError = z.union([
  z.object({ ok: z.literal(true), user: userSchema }),
  z.object({ ok: z.literal(false), error: z.string() })
]);
```

### 6. Discriminated Unions for Type Narrowing

```javascript
const resultSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    data: userSchema,
    timestamp: z.number()
  }),
  z.object({
    ok: z.literal(false),
    error: z.object({ message: z.string(), code: z.string() }),
    timestamp: z.number()
  })
]);

type Result = z.infer<typeof resultSchema>;

function handleResult(result: Result) {
  if (result.ok) {
    console.log(result.data);  // TypeScript knows this exists
  } else {
    console.log(result.error);  // TypeScript knows this exists
  }
}
```

## API Endpoints

| Endpoint | Method | Purpose | Pattern |
|----------|--------|---------|----------|
| `/api/validate/user` | POST | Validate user object | Basic schema validation |
| `/api/validate/password` | POST | Validate password rules | Refinements (.refine()) |
| `/api/validate/form` | POST | Validate signup form | Cross-field validation |
| `/api/validate/config` | POST | Validate environment config | Transform + validation |
| `/api/users` | POST | Create user | Schema in routes |
| `/api/users` | GET | List users | Pagination validation |
| `/api/users/:id` | GET | Get user | ID validation |
| `/api/users/:id` | PUT | Update user | Partial schema |
| `/api/users/:id` | DELETE | Delete user | Resource deletion |
| `/api/search` | POST | Search users | Optional fields + transforms |
| `/api/batch-create` | POST | Create multiple | Array schema validation |
| `/api/stats` | GET | Get statistics | Aggregated data |

## Architecture

```
server.js           # Express with Zod validation
│
├─ controller.js     # Schema definitions
│  ├─ userSchema
│  ├─ createUserSchema
│  ├─ passwordSchema (with .refine())
│  ├─ signupSchema (cross-field)
│  ├─ searchQuerySchema
│  ├─ ValidationService (validate/parse helpers)
│  └─ createResultSchema() (factory)
│
├─ routes.js         # Endpoints using ValidationService
│  └─ All use schema.safeParse()
│
├─ middleware.js     # Validation middleware
│  ├─ validateSchema(schema, source)
│  ├─ errorHandler (converts ZodError)
│  └─ requestLogger
│
└─ App.jsx           # React UI
   ├─ User validation test
   ├─ Password validation test
   ├─ Signup form test (cross-field)
   ├─ Search test (transforms)
   └─ Users list
```

## Code Examples

### Example 1: Basic Schema Validation

```javascript
const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user'])
});

// Extract type
type User = z.infer<typeof userSchema>;

// Use in function
function createUser(data: unknown): User {
  return userSchema.parse(data);  // Throws if invalid
}

// Or safely
function createUserSafe(data: unknown) {
  const result = userSchema.safeParse(data);
  if (result.success) {
    return { ok: true, user: result.data };
  }
  return { ok: false, error: result.error.flatten() };
}
```

### Example 2: Password with Refinements

```javascript
const passwordSchema = z.string()
  .min(8, 'At least 8 characters')
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    { message: 'Must include uppercase letter' }
  )
  .refine(
    (pwd) => /[0-9]/.test(pwd),
    { message: 'Must include number' }
  )
  .refine(
    (pwd) => /[!@#$%^&*]/.test(pwd),
    { message: 'Must include special character' }
  );

const result = passwordSchema.safeParse('WeakPass');
// {
//   success: false,
//   error: ZodError [
//     { message: 'Must include number' },
//     { message: 'Must include special character' }
//   ]
// }
```

### Example 3: Cross-field Validation

```javascript
const signupSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(
  ({ password, confirmPassword }) => password === confirmPassword,
  {
    message: 'Passwords must match',
    path: ['confirmPassword']  // Error appears on this field
  }
);

// Usage with error handling
const result = signupSchema.safeParse(formData);
if (!result.success) {
  const errors = result.error.flatten();
  // errors.fieldErrors.confirmPassword = ['Passwords must match']
}
```

### Example 4: Schema Composition

```javascript
// Base schema
const userBase = z.object({
  name: z.string(),
  email: z.string().email()
});

// Admin variant
const adminUser = userBase.extend({
  permissions: z.array(z.string()),
  lastLogin: z.date().optional()
});

// Update variant (partial)
const userUpdate = userBase.partial();

// Type extraction
type User = z.infer<typeof userBase>;
type AdminUser = z.infer<typeof adminUser>;
type UserUpdate = z.infer<typeof userUpdate>;
```

### Example 5: API Response Pattern

```javascript
// Factory function for type-safe responses
function createResultSchema(dataSchema) {
  return z.discriminatedUnion('ok', [
    z.object({
      ok: z.literal(true),
      data: dataSchema,
      timestamp: z.number()
    }),
    z.object({
      ok: z.literal(false),
      error: z.object({ message: z.string() }),
      timestamp: z.number()
    })
  ]);
}

const userResultSchema = createResultSchema(userSchema);
type UserResult = z.infer<typeof userResultSchema>;

// Discriminated union enables type narrowing
function handleResult(result: UserResult) {
  if (result.ok) {
    console.log(result.data.name);  // Result.data exists
  } else {
    console.log(result.error.message);  // Result.error exists
  }
}
```

## Learning Exercises

### Exercise 1: Add Custom Format Validation

Extend password schema to require:
- No dictionary words (simulate with list)
- Not a common password
- Add custom error messages

```javascript
const advancedPasswordSchema = passwordSchema
  .refine(
    (pwd) => !COMMON_PASSWORDS.includes(pwd),
    { message: 'Password is too common' }
  );
```

### Exercise 2: Async Validation

Add email uniqueness check:

```javascript
const userSchema = z.object({
  email: z.string().email()
    .refine(
      async (email) => !(await emailExists(email)),
      { message: 'Email already taken' }
    )
});

// Must use parseAsync or safeParseAsync
const result = await userSchema.safeParseAsync(data);
```

### Exercise 3: Conditional Schema

Create schema where certain fields are required based on role:

```javascript
const userSchema = z.object({
  name: z.string(),
  role: z.enum(['admin', 'user']),
  permissions: z.array(z.string()).optional()
}).refine(
  (data) => {
    if (data.role === 'admin' && !data.permissions?.length) {
      return false;
    }
    return true;
  },
  { message: 'Admins must have permissions', path: ['permissions'] }
);
```

### Exercise 4: Transform During Validation

Automatic type conversion:

```javascript
const configSchema = z.object({
  port: z.string().transform(Number),
  timeout: z.string().transform(Number),
  debug: z.string().transform(s => s === 'true')
});

const config = configSchema.parse(process.env);
// config.port is number, not string!
```

### Exercise 5: Error Customization

Format validation errors for UI:

```javascript
function formatZodErrors(error) {
  return error.flatten((issue) => ({
    message: issue.message,
    type: issue.code,
    severity: issue.code === 'too_small' ? 'warning' : 'error'
  }));
}

const result = schema.safeParse(data);
if (!result.success) {
  const errors = formatZodErrors(result.error);
  // Structure ready for UI display
}
```

## Best Practices

### ✅ DO

```javascript
// 1. Define schemas centrally
const userSchema = z.object({ /* ... */ });

// 2. Extract types from schemas
type User = z.infer<typeof userSchema>;

// 3. Use safeParse for user input
const result = schema.safeParse(untrustedData);
if (result.success) { /* use result.data */ }

// 4. Compose schemas for reuse
const adminSchema = userSchema.extend({ permissions: z.array(...) });

// 5. Use meaningful error messages
z.string().email({ message: 'Please enter valid email' })

// 6. Leverage discriminated unions
z.discriminatedUnion('type', [/* ... */])
```

### ❌ DON'T

```javascript
// 1. Don't duplicate types and schemas
interface User { /* ... */ }
const userSchema = z.object({ /* ... */ });
// Use z.infer instead!

// 2. Don't use parse() blindly
const data = schema.parse(untrustedInput);  // Can crash!
// Use safeParse for user input

// 3. Don't ignore validation errors
schema.parse(data);  // Error disappears
// Always handle with try-catch or safeParse

// 4. Don't forget error messages
z.string().email()  // Generic error
// Add context: z.string().email({ message: '...' })

// 5. Don't make overly complex schemas
const schema = z.string().refine(...).refine(...).refine(...);
// Consider breaking into multiple validations
```

## Common Patterns

| Pattern | Use Case | Example |
|---------|----------|----------|
| `.email()` | Email validation | `z.string().email()` |
| `.url()` | URL validation | `z.string().url()` |
| `.uuid()` | UUID validation | `z.string().uuid()` |
| `.refine()` | Custom validation | `z.string().refine(fn)` |
| `.superRefine()` | Multiple errors | `schema.superRefine(ctx => {...})` |
| `.transform()` | Transform on parse | `z.string().transform(Number)` |
| `.default()` | Default value | `z.string().default('anon')` |
| `.optional()` | Optional field | `z.string().optional()` |
| `.nullable()` | Nullable value | `z.string().nullable()` |
| `.discriminatedUnion()` | Type narrowing | See example above |

## Key Takeaways

1. **Single Source of Truth** - Schema defines both validation AND type
2. **Type Safety** - `z.infer<>` eliminates type/validation divergence
3. **Two Patterns** - `.parse()` throws, `.safeParse()` returns Result
4. **Refinements** - Custom logic via `.refine()` and `.superRefine()`
5. **Composition** - Extend, pick, omit, partial for schema reuse
6. **Type Narrowing** - Discriminated unions enable perfect type narrowing
7. **Express Integration** - Middleware can validate all input sources

## References

- Module 13.1: Types vs Interfaces (foundation)
- Module 13.2: Generics & API Response (patterns)
- [Zod Documentation](https://zod.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Status:** ✅ Complete  
**Port:** 13003  
**Key Tech:** Zod v3.22+, Express, TypeScript patterns  
**Time to Complete:** 40-50 minutes

