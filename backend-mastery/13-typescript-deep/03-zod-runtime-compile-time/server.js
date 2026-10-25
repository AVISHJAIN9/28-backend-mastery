/**
 * Module 13.3: Zod - Runtime & Compile-time Validation
 * Demonstrates Zod schema validation with type inference
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

// 1. Basic User Schema
const userSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  email: z.string().email({ message: 'Invalid email format' }),
  role: z.enum(['admin', 'user', 'moderator']).default('user'),
  isActive: z.boolean().default(true)
});

// Extract TypeScript type from schema
// type User = z.infer<typeof userSchema>;

// 2. Create User Request Schema (no id)
const createUserSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'user', 'moderator']).default('user')
});

// 3. Update User Schema (all fields optional)
const updateUserSchema = userSchema.omit({ id: true }).partial();

// 4. Password Schema with Custom Validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine(pwd => /[A-Z]/.test(pwd), {
    message: 'Password must contain uppercase letter'
  })
  .refine(pwd => /[0-9]/.test(pwd), {
    message: 'Password must contain number'
  });

// 5. Search Query Schema
const searchSchema = z.object({
  query: z.string().optional(),
  role: z.enum(['admin', 'user', 'moderator']).optional(),
  isActive: z.boolean().optional(),
  page: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('10')
});

// 6. Pagination Schema
const paginationSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean()
});

// 7. Generic Result Schema with Zod
function createResultSchema(dataSchema) {
  return z.union([
    z.object({
      ok: z.literal(true),
      data: dataSchema,
      timestamp: z.number(),
      duration: z.number()
    }),
    z.object({
      ok: z.literal(false),
      error: z.object({
        message: z.string(),
        code: z.string()
      }),
      timestamp: z.number()
    })
  ]);
}

// 8. Discriminated Union for Form Submission
const formSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// 9. Config Schema for Environment Validation
const configSchema = z.object({
  HTTP_PORT: z.string().transform(Number).default('13003'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

// ============================================================================
// MOCK DATABASE
// ============================================================================

const users = [
  { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin', isActive: true },
  { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user', isActive: true },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', role: 'moderator', isActive: true },
  { id: 4, name: 'Diana', email: 'diana@test.com', role: 'user', isActive: false },
  { id: 5, name: 'Eve', email: 'eve@test.com', role: 'user', isActive: true }
];

let nextId = 6;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createSuccessResponse(data, startTime = Date.now()) {
  return {
    ok: true,
    data,
    timestamp: Date.now(),
    duration: Date.now() - startTime
  };
}

function createErrorResponse(message, code, errors = null) {
  return {
    ok: false,
    error: {
      message,
      code,
      ...(errors && { details: errors })
    },
    timestamp: Date.now()
  };
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/validate/user
 * Validate user data with Zod
 * Demonstrates: .safeParse(), type inference
 */
app.post('/api/validate/user', (req, res) => {
  const startTime = Date.now();
  
  // Using safeParse to avoid throwing
  const result = createUserSchema.safeParse(req.body);

  if (!result.success) {
    // Flatten errors for better UI display
    const errors = result.error.flatten();
    return res.status(400).json({
      ...createErrorResponse('Validation failed', 'VALIDATION_ERROR'),
      errors
    });
  }

  // result.data is now typed and validated
  res.json(createSuccessResponse(result.data, startTime));
});

/**
 * POST /api/validate/password
 * Validate password with custom rules
 * Demonstrates: .refine(), custom validation messages
 */
app.post('/api/validate/password', (req, res) => {
  const startTime = Date.now();
  const { password } = req.body;

  const result = passwordSchema.safeParse(password);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return res.status(400).json({
      ...createErrorResponse(firstError.message, 'PASSWORD_INVALID'),
      issues: result.error.issues
    });
  }

  res.json(createSuccessResponse({ valid: true }, startTime));
});

/**
 * POST /api/validate/form
 * Validate signup form with password matching
 * Demonstrates: .refine() for cross-field validation, discriminated unions
 */
app.post('/api/validate/form', (req, res) => {
  const startTime = Date.now();

  const result = formSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.flatten();
    return res.status(400).json({
      ...createErrorResponse('Form validation failed', 'FORM_INVALID'),
      errors
    });
  }

  res.json(createSuccessResponse({ 
    email: result.data.email,
    message: 'Form valid' 
  }, startTime));
});

/**
 * POST /api/users
 * Create user with Zod schema validation
 * Demonstrates: type inference, parse patterns
 */
app.post('/api/users', (req, res) => {
  const startTime = Date.now();

  const result = createUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(createErrorResponse(
      'Invalid user data',
      'VALIDATION_ERROR'
    ));
  }

  // Create new user
  const newUser = {
    id: nextId++,
    ...result.data
  };

  users.push(newUser);

  res.status(201).json(createSuccessResponse(newUser, startTime));
});

/**
 * GET /api/users
 * List all users (paginated)
 * Demonstrates: schema composition, pagination
 */
app.get('/api/users', (req, res) => {
  const startTime = Date.now();

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, parseInt(req.query.pageSize) || 10);

  const total = users.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = users.slice(start, end);

  const paginatedData = {
    items,
    total,
    page,
    pageSize,
    hasMore: end < total
  };

  res.json(createSuccessResponse(paginatedData, startTime));
});

/**
 * GET /api/users/:id
 * Get user by ID
 * Demonstrates: optional schema validation
 */
app.get('/api/users/:id', (req, res) => {
  const startTime = Date.now();
  const id = parseInt(req.params.id);

  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json(createErrorResponse(
      'User not found',
      'NOT_FOUND'
    ));
  }

  res.json(createSuccessResponse(user, startTime));
});

/**
 * PUT /api/users/:id
 * Update user with Zod validation
 * Demonstrates: partial schemas, .omit()
 */
app.put('/api/users/:id', (req, res) => {
  const startTime = Date.now();
  const id = parseInt(req.params.id);

  const result = updateUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(createErrorResponse(
      'Invalid update data',
      'VALIDATION_ERROR'
    ));
  }

  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json(createErrorResponse(
      'User not found',
      'NOT_FOUND'
    ));
  }

  users[userIndex] = { ...users[userIndex], ...result.data };

  res.json(createSuccessResponse(users[userIndex], startTime));
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
app.delete('/api/users/:id', (req, res) => {
  const startTime = Date.now();
  const id = parseInt(req.params.id);

  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json(createErrorResponse(
      'User not found',
      'NOT_FOUND'
    ));
  }

  const deleted = users.splice(userIndex, 1)[0];

  res.json(createSuccessResponse(deleted, startTime));
});

/**
 * POST /api/search
 * Search users with complex query
 * Demonstrates: transform(), enum validation, optional fields
 */
app.post('/api/search', (req, res) => {
  const startTime = Date.now();

  // Validate search parameters
  const result = searchSchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json(createErrorResponse(
      'Invalid search parameters',
      'INVALID_SEARCH'
    ));
  }

  const { query, role, isActive, page, pageSize } = result.data;

  // Filter users based on validated parameters
  let filtered = users;

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  if (role) {
    filtered = filtered.filter(u => u.role === role);
  }

  if (typeof isActive === 'boolean') {
    filtered = filtered.filter(u => u.isActive === isActive);
  }

  // Paginate
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = filtered.slice(start, end);

  const paginatedData = {
    items,
    total,
    page,
    pageSize,
    hasMore: end < total,
    filters: { query, role, isActive }
  };

  res.json(createSuccessResponse(paginatedData, startTime));
});

/**
 * POST /api/batch-create
 * Create multiple users with validation
 * Demonstrates: array schemas, complex validation
 */
app.post('/api/batch-create', (req, res) => {
  const startTime = Date.now();

  // Validate array of users
  const usersArraySchema = z.array(createUserSchema);
  const result = usersArraySchema.safeParse(req.body.users);

  if (!result.success) {
    return res.status(400).json(createErrorResponse(
      'Invalid users array',
      'VALIDATION_ERROR'
    ));
  }

  const created = result.data.map(userData => {
    const newUser = {
      id: nextId++,
      ...userData
    };
    users.push(newUser);
    return newUser;
  });

  res.status(201).json(createSuccessResponse({
    created: created.length,
    users: created
  }, startTime));
});

/**
 * GET /api/schemas
 * Return available schemas info
 * Demonstrates: schema introspection
 */
app.get('/api/schemas', (req, res) => {
  const startTime = Date.now();

  const schemas = {
    user: userSchema.describe(),
    createUser: createUserSchema.describe(),
    updateUser: updateUserSchema.describe(),
    password: passwordSchema.describe(),
    search: searchSchema.describe(),
    form: formSchema.describe()
  };

  res.json(createSuccessResponse(schemas, startTime));
});

/**
 * POST /api/validate-config
 * Validate environment config
 * Demonstrates: environment validation, transform
 */
app.post('/api/validate-config', (req, res) => {
  const startTime = Date.now();

  const result = configSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json(createErrorResponse(
      'Invalid config',
      'CONFIG_ERROR'
    ));
  }

  res.json(createSuccessResponse({
    config: result.data,
    message: 'Configuration is valid'
  }, startTime));
});

/**
 * GET /api/stats
 * Get repository stats
 */
app.get('/api/stats', (req, res) => {
  const startTime = Date.now();

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    usersByRole: {
      admin: users.filter(u => u.role === 'admin').length,
      user: users.filter(u => u.role === 'user').length,
      moderator: users.filter(u => u.role === 'moderator').length
    }
  };

  res.json(createSuccessResponse(stats, startTime));
});

// ============================================================================
// ERROR HANDLERS
// ============================================================================

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);

  res.status(500).json(createErrorResponse(
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    'INTERNAL_ERROR'
  ));
});

app.use((req, res) => {
  res.status(404).json(createErrorResponse(
    `Route ${req.method} ${req.path} not found`,
    'NOT_FOUND'
  ));
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.HTTP_PORT || 13003;

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ POST   /api/validate/user       - Validate user with Zod`);
  console.log(`✓ POST   /api/validate/password   - Validate password`);
  console.log(`✓ POST   /api/validate/form       - Validate signup form`);
  console.log(`✓ POST   /api/users               - Create user`);
  console.log(`✓ GET    /api/users               - List users (paginated)`);
  console.log(`✓ GET    /api/users/:id           - Get user by ID`);
  console.log(`✓ PUT    /api/users/:id           - Update user`);
  console.log(`✓ DELETE /api/users/:id           - Delete user`);
  console.log(`✓ POST   /api/search              - Search users`);
  console.log(`✓ POST   /api/batch-create        - Create multiple users`);
  console.log(`✓ GET    /api/schemas             - Get schemas info`);
  console.log(`✓ POST   /api/validate-config    - Validate config`);
  console.log(`✓ GET    /api/stats               - Get stats`);
});