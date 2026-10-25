# 13.3: Zod - Runtime & Compile-time Validation

## What is Zod?

**Zod** is a TypeScript-first schema validation library. It allows you to:

1. **Define schemas** that validate data at runtime
2. **Extract TypeScript types** from those schemas at compile-time
3. **Guarantee type safety** - if Zod validates it, TypeScript knows its type

Unlike traditional approach where you define types and validation separately:

```typescript
// ❌ OLD APPROACH - Type and validation out of sync
interface User {
  name: string;
  email: string;
  age: number;
}

function validateUser(data: unknown): data is User {
  return typeof data === 'object' && /* ... */;
}

// Possible bugs: Type doesn't match validation!
```

With Zod:

```typescript
// ✅ ZOD APPROACH - Single source of truth
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().min(0)
});

// TypeScript type extracted from schema
type User = z.infer<typeof userSchema>;

// If schema validates, TypeScript knows it's User
const user = userSchema.parse(data);  // Type: User
```

---

## Core Concepts

### 1. Schema Definition

Zod schemas define the shape and validation rules for data:

```typescript
// Primitives
const stringSchema = z.string();      // Any string
const emailSchema = z.string().email(); // Valid email
const numberSchema = z.number().int(); // Integer
const boolSchema = z.boolean();

// Constraints
const nameSchema = z.string().min(1).max(100);
const ageSchema = z.number().int().min(0).max(150);

// Optional/Nullable
const optional = z.string().optional();     // string | undefined
const nullable = z.string().nullable();    // string | null
const withDefault = z.string().default(''); // string (default: '')

// Literals (enum-like)
const roleSchema = z.enum(['admin', 'user', 'moderator']);

// Union of multiple types
const idSchema = z.union([z.string(), z.number()]);

// Intersection (merge schemas)
const personWithRole = z.intersection(
  z.object({ name: z.string() }),
  z.object({ role: z.string() })
);
```

### 2. Object Schemas

Define structure of objects:

```typescript
const userSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()),
  createdAt: z.date(),
  metadata: z.object({
    lastLogin: z.date().optional(),
    loginCount: z.number().default(0)
  })
});

// Type extraction
type User = z.infer<typeof userSchema>;
// Equivalent to:
// {
//   id: number;
//   name: string;
//   email: string;
//   role: 'admin' | 'user';
//   isActive: boolean;
//   tags: string[];
//   createdAt: Date;
//   metadata: {
//     lastLogin?: Date;
//     loginCount: number;
//   };
// }
```

### 3. Type Inference

Extract types from schemas:

```typescript
const schema = z.object({
  name: z.string(),
  age: z.number()
});

type InferredType = z.infer<typeof schema>;
// { name: string; age: number; }

// Works with any schema
const stringType = z.infer<typeof z.string()>; // string
const arrayType = z.infer<typeof z.array(z.number())>; // number[]
```

### 4. Validation Methods

```typescript
// .parse() - throws error if invalid
const user = userSchema.parse(data);  // Type: User
// if data is invalid, throws ZodError

// .safeParse() - returns Result object
const result = userSchema.safeParse(data);
if (result.success) {
  const user = result.data;  // Type: User
} else {
  console.log(result.error);  // ZodError with details
}

// .strict() - disallow extra properties
const strictSchema = userSchema.strict();

// .strip() - remove extra properties
const strippedSchema = userSchema.strip();

// .passthrough() - keep extra properties
const passThroughSchema = userSchema.passthrough();
```

### 5. Refinements & Transforms

Add custom validation logic:

```typescript
// .refine() - custom validation
const passwordSchema = z.string().refine(
  (pwd) => pwd.length >= 8,
  { message: 'Password must be 8+ characters' }
);

// .superRefine() - multiple error messages
const userSchema = z.object({
  password: z.string(),
  confirmPassword: z.string()
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match'
    });
  }
});

// .transform() - modify data during validation
const dateSchema = z.string().transform(str => new Date(str));
const parsed = dateSchema.parse('2024-01-01');  // Type: Date

// .catch() - provide default on validation error
const schema = z.string().catch('default');

// .default() - default value if missing
const schema = z.string().default('anonymous');
```

### 6. Common Validation Patterns

```typescript
// Email with custom message
const emailSchema = z.string()
  .email({ message: 'Invalid email address' });

// URL validation
const urlSchema = z.string().url();

// UUID validation
const uuidSchema = z.string().uuid();

// Date validation
const dateSchema = z.date();
const isoDateSchema = z.string().datetime();

// Array validation
const tagsSchema = z.array(z.string()).min(1).max(5);

// Record (map type)
const configSchema = z.record(z.string(), z.string());

// Discriminated unions (built-in!)
const resultSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('success'), data: z.any() }),
  z.object({ type: z.literal('error'), error: z.string() })
]);
```

### 7. API Response Pattern with Zod

Combine with generics for type-safe responses:

```typescript
// Define result schema generically
function createResultSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    ok: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      message: z.string(),
      code: z.string()
    }).optional(),
    timestamp: z.number()
  }).discriminatedUnion('ok', [
    z.object({ ok: z.literal(true), data: dataSchema }),
    z.object({ ok: z.literal(false), error: z.object({ message: z.string(), code: z.string() }) })
  ]);
}

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
});

const userResultSchema = createResultSchema(userSchema);
type UserResult = z.infer<typeof userResultSchema>;
// {
//   ok: true;
//   data: { id: number; name: string; email: string };
//   timestamp: number;
// } | {
//   ok: false;
//   error: { message: string; code: string };
//   timestamp: number;
// }
```

---

## Real-World Use Cases

### 1. API Request Validation

```typescript
// Define request schema
const createUserRequestSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).default('user')
});

// Extract type
type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

// Validate in route
app.post('/users', (req, res) => {
  const result = createUserRequestSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      ok: false,
      errors: result.error.flatten()
    });
  }

  // result.data is now typed as CreateUserRequest
  const user = createUser(result.data);
  res.json({ ok: true, data: user });
});
```

### 2. Configuration Validation

```typescript
const configSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string().transform(Number),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

type Config = z.infer<typeof configSchema>;

const config = configSchema.parse(process.env);
// config is typed as Config with all required fields
```

### 3. Database Response Validation

```typescript
// Validate database responses
const userFromDbSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  createdAt: z.date(),  // Converts timestamp to Date
  updatedAt: z.date()
});

const dbResponse = await db.query('SELECT * FROM users WHERE id = ?', [1]);
const user = userFromDbSchema.parse(dbResponse);
// user is guaranteed to match schema
```

### 4. Form Submission Validation

```typescript
const signupFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(v => v === true, {
    message: 'Must accept terms'
  })
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type SignupForm = z.infer<typeof signupFormSchema>;

function handleSignup(formData: unknown) {
  const result = signupFormSchema.safeParse(formData);
  if (result.success) {
    // result.data is SignupForm
    createAccount(result.data);
  } else {
    // Show errors
    displayErrors(result.error);
  }
}
```

---

## Zod vs Alternatives

| Feature | Zod | Joi | Yup | TypeScript Only |
|---------|-----|-----|-----|-----------------|
| Runtime validation | ✅ | ✅ | ✅ | ❌ |
| Type inference | ✅ | ❌ | ❌ | ✅ |
| TypeScript first | ✅ | ❌ | ❌ | ✅ |
| Async validation | ✅ | ✅ | ✅ | ❌ |
| Error customization | ✅ | ✅ | ✅ | N/A |
| Learning curve | Easy | Medium | Easy | Medium |
| Size | Small | Large | Medium | N/A |

---

## Best Practices

### ✅ DO

```typescript
// 1. Reuse schemas across module
const userSchema = z.object({ /* ... */ });

// 2. Use type inference
type User = z.infer<typeof userSchema>;

// 3. Use safeParse for user input
const result = schema.safeParse(untrustedData);
if (result.success) { /* use result.data */ }

// 4. Compose schemas
const baseUser = z.object({ name: z.string() });
const adminUser = baseUser.extend({ permissions: z.array(z.string()) });

// 5. Add helpful error messages
z.string().email({ message: 'Please provide a valid email' })

// 6. Use discriminated unions
z.discriminatedUnion('type', [ /* ... */ ])
```

### ❌ DON'T

```typescript
// 1. Don't duplicate type and schema
interface User { /* ... */ }
const userSchema = z.object({ /* ... */ });
// Use z.infer instead!

// 2. Don't use parse() blindly
const data = schema.parse(untrustedData);  // Can throw!
// Use safeParse for user input

// 3. Don't make overly complex schemas
const schema = z.string().refine(...).refine(...).refine(...);
// Consider computed properties instead

// 4. Don't ignore validation failures
userSchema.parse(data);  // Error silently propagates
// Always handle with try-catch or safeParse

// 5. Don't store unvalidated data in database
db.insert(untrustedData);  // What if it's wrong?
// Always validate first: const validated = schema.parse(data)
```

---

## Common Patterns

### Custom Error Messages

```typescript
const userSchema = z.object({
  email: z.string()
    .email({ message: 'Please enter a valid email' })
    .min(5, { message: 'Email too short' }),
  password: z.string()
    .min(8, { message: 'Must be 8 characters or longer' })
    .refine(pwd => /[A-Z]/.test(pwd), {
      message: 'Must contain uppercase letter'
    })
});
```

### Async Validation

```typescript
const userSchema = z.object({
  email: z.string().email()
    .refine(async (email) => {
      const exists = await checkEmailExists(email);
      return !exists;
    }, { message: 'Email already taken' })
});

// Must use parseAsync or safeParseAsync
const user = await userSchema.parseAsync(data);
```

### Conditional Validation

```typescript
const settingsSchema = z.object({
  enableEmail: z.boolean(),
  email: z.string().email().optional()
}).refine(
  (data) => {
    if (data.enableEmail && !data.email) {
      return false;
    }
    return true;
  },
  {
    message: 'Email required when enableEmail is true',
    path: ['email']
  }
);
```

### Type Narrowing

```typescript
const resultSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('success'), value: z.string() }),
  z.object({ type: z.literal('error'), error: z.string() })
]);

type Result = z.infer<typeof resultSchema>;

function handleResult(result: Result) {
  // Automatically type narrows!
  if (result.type === 'success') {
    console.log(result.value);  // string
  } else {
    console.log(result.error);  // string
  }
}
```

---

## Integration with Express

```typescript
// Validation middleware
const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        errors: result.error.flatten()
      });
    }

    req.body = result.data;  // Now typed and validated
    next();
  };
};

// Usage
app.post('/users', validate(createUserSchema), (req, res) => {
  // req.body is fully typed and validated
  const user = createUser(req.body);
  res.json({ ok: true, data: user });
});
```

---

## Summary

**Zod provides:**
1. **Runtime validation** - Ensure data matches expected shape
2. **Type safety** - Extract TypeScript types from schemas
3. **Error handling** - Rich error information for debugging
4. **Composability** - Build complex schemas from simple ones
5. **Single source of truth** - Schema defines both validation and type

**Key pattern:** `const userSchema = z.object({ /* ... */ }); type User = z.infer<typeof userSchema>;`

This ensures your validation logic and TypeScript types never diverge.
