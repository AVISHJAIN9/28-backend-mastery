/**
 * Schema-first Controller with Zod
 * All validation happens through schemas
 */

import { z } from 'zod';

/**
 * Zod Schemas - Single source of truth
 */

// Base user schema
export const userSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'moderator']),
  isActive: z.boolean()
});

// Create user request (no id)
export const createUserSchema = userSchema.omit({ id: true });

// Update user request (all optional)
export const updateUserSchema = userSchema.omit({ id: true }).partial();

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Must be 8+ characters')
  .refine(pwd => /[A-Z]/.test(pwd), 'Must contain uppercase')
  .refine(pwd => /[0-9]/.test(pwd), 'Must contain number')
  .refine(pwd => /[!@#$%^&*]/.test(pwd), 'Must contain special char');

// Signup form
export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Search query
export const searchQuerySchema = z.object({
  query: z.string().optional(),
  role: z.enum(['admin', 'user', 'moderator']).optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10)
});

// Batch operations
export const batchCreateSchema = z.object({
  users: z.array(createUserSchema).min(1).max(100)
});

export const batchUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.number().int().positive(),
      data: updateUserSchema
    })
  ).min(1).max(100)
});

/**
 * Type Extraction from Schemas
 * These types are automatically derived from schemas
 */

// export type User = z.infer<typeof userSchema>;
// export type CreateUserRequest = z.infer<typeof createUserSchema>;
// export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
// export type SignupRequest = z.infer<typeof signupSchema>;
// export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * Schema Composition Patterns
 */

// Extend schema
export const adminUserSchema = userSchema.extend({
  permissions: z.array(z.string()).default([])
});

// Pick specific fields
export const userPublicSchema = userSchema.omit({ role: true });

// Union of alternatives
export const userOrErrorSchema = z.union([
  z.object({ ok: z.literal(true), user: userSchema }),
  z.object({ ok: z.literal(false), error: z.string() })
]);

/**
 * Discriminated Union (type narrowing)
 */
export const resultSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    data: z.unknown(),
    timestamp: z.number()
  }),
  z.object({
    ok: z.literal(false),
    error: z.object({ message: z.string(), code: z.string() }),
    timestamp: z.number()
  })
]);

/**
 * Higher-order schema factory
 */
export function createResultSchema(dataSchema) {
  return z.discriminatedUnion('ok', [
    z.object({
      ok: z.literal(true),
      data: dataSchema,
      timestamp: z.number(),
      duration: z.number()
    }),
    z.object({
      ok: z.literal(false),
      error: z.object({ message: z.string(), code: z.string() }),
      timestamp: z.number()
    })
  ]);
}

/**
 * Validation service
 */
export class ValidationService {
  /**
   * Validate and transform data
   */
  static validate(schema, data) {
    return schema.safeParse(data);
  }

  /**
   * Parse or throw
   */
  static parse(schema, data) {
    try {
      return schema.parse(data);
    } catch (error) {
      throw { code: 'VALIDATION_ERROR', details: error.flatten() };
    }
  }

  /**
   * Validate async (for async refinements)
   */
  static async validateAsync(schema, data) {
    return schema.safeParseAsync(data);
  }

  /**
   * Extract TypeScript-compatible error format
   */
  static flattenErrors(zodError) {
    return zodError.flatten((issue) => ({
      message: issue.message,
      code: issue.code,
      path: issue.path
    }));
  }

  /**
   * Get human-friendly error message
   */
  static getFirstError(zodError) {
    const issue = zodError.issues[0];
    return {
      message: issue.message,
      path: issue.path.join('.')
    };
  }
}

/**
 * Schema Introspection
 */
export function getSchemaInfo(schema) {
  return {
    description: schema.describe(),
    example: generateExample(schema)
  };
}

/**
 * Generate example data from schema
 */
function generateExample(schema) {
  const description = schema.describe();
  return descriptionToExample(description);
}

function descriptionToExample(desc) {
  if (desc.type === 'string') return 'example';
  if (desc.type === 'number') return 42;
  if (desc.type === 'boolean') return true;
  if (desc.type === 'array') return [];
  if (desc.type === 'object' && desc.properties) {
    return Object.fromEntries(
      Object.entries(desc.properties || {}).map(([k, v]) => [
        k,
        descriptionToExample(v)
      ])
    );
  }
  return null;
}

