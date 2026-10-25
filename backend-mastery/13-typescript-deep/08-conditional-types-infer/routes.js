import express from 'express';
import {
  TypeInferencer,
  ConditionalResponseHandler,
  Repository,
  UnwrapperService,
  TypeGuardService,
  ValidationService
} from './controller.js';

const router = express.Router();
const repository = new Repository();

/**
 * Module Info
 */

router.get('/info', (req, res) => {
  res.json({
    module: '13.8 - Conditional Types & Infer',
    concepts: [
      'Conditional types: T extends U ? X : Y',
      'Infer keyword: infer T',
      'Type guards and narrowing',
      'Response format switching'
    ]
  });
});

/**
 * Type Inference Endpoints
 */

// POST /api/conditional-types/infer-type
router.post('/infer-type', (req, res) => {
  const { value } = req.body;
  
  if (Array.isArray(value)) {
    const elementType = TypeInferencer.inferArrayElement(value);
    return res.json({
      ok: true,
      data: {
        input: value,
        inferredType: 'Array<' + elementType + '>',
        pattern: 'Conditional type inference'
      }
    });
  }
  
  res.json({
    ok: true,
    data: {
      input: value,
      inferredType: typeof value,
      pattern: 'Type narrowing'
    }
  });
});

/**
 * Conditional Response Handling
 */

// GET /api/conditional-types/users?format=compact
// GET /api/conditional-types/users?format=public
// GET /api/conditional-types/users?format=detailed
router.get('/users', (req, res) => {
  const users = repository.getEntity('users');
  const format = req.query.format || 'detailed';
  
  const options = {
    compact: format === 'compact',
    detailed: format === 'detailed',
    publicOnly: format === 'public'
  };
  
  const result = ConditionalResponseHandler.handleResponse(users, options);
  
  res.json({
    ok: true,
    data: result,
    format: format,
    pattern: 'Conditional response formatting: T extends Array ? X : Y'
  });
});

// GET /api/conditional-types/users/:id?format=..
router.get('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = repository.getEntity('users', id);
  const format = req.query.format || 'detailed';
  
  if (!user) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }
  
  const options = {
    compact: format === 'compact',
    detailed: format === 'detailed',
    publicOnly: format === 'public'
  };
  
  const result = ConditionalResponseHandler.handleResponse(user, options);
  
  res.json({
    ok: true,
    data: result,
    format: format
  });
});

/**
 * Type Guarding
 */

// POST /api/conditional-types/validate-type
router.post('/validate-type', (req, res) => {
  const { value, expectedType } = req.body;
  
  let isValid = false;
  let actualType = 'unknown';
  let guard = null;
  
  if (expectedType === 'user') {
    isValid = TypeGuardService.isUser(value);
    actualType = isValid ? 'User' : typeof value;
    guard = 'TypeGuardService.isUser';
  }
  
  if (expectedType === 'users') {
    isValid = TypeGuardService.isUserArray(value);
    actualType = isValid ? 'User[]' : typeof value;
    guard = 'TypeGuardService.isUserArray';
  }
  
  if (expectedType === 'array') {
    isValid = TypeGuardService.isArrayType(value);
    actualType = isValid ? 'Array' : typeof value;
    guard = 'TypeGuardService.isArrayType';
  }
  
  if (expectedType === 'promise') {
    isValid = TypeGuardService.isPromiseType(value);
    actualType = isValid ? 'Promise' : typeof value;
    guard = 'TypeGuardService.isPromiseType';
  }
  
  res.json({
    ok: true,
    data: {
      expected: expectedType,
      actual: actualType,
      valid: isValid,
      guard: guard,
      value: value
    },
    pattern: 'Type narrowing with guards'
  });
});

/**
 * Unwrapping Nested Types
 */

// POST /api/conditional-types/determine-type
router.post('/determine-type', (req, res) => {
  const { value } = req.body;
  
  const responseType = repository.determineResponseType(value);
  
  res.json({
    ok: true,
    data: {
      input: value,
      determinedType: responseType,
      pattern: 'Conditional type: Unwrap T extends Array ? T[0] : T'
    }
  });
});

/**
 * Schema Validation
 */

// POST /api/conditional-types/validate-schema
router.post('/validate-schema', (req, res) => {
  const { data, schema } = req.body;
  
  const validation = ValidationService.validate(data, schema);
  
  if (!validation.valid) {
    return res.status(400).json({
      ok: false,
      errors: validation.errors,
      pattern: 'Conditional validation based on schema'
    });
  }
  
  res.json({
    ok: true,
    data: data,
    message: 'Validation passed',
    pattern: 'Conditional validation logic'
  });
});

/**
 * Example: User schema
 */
const userSchema = {
  name: { type: 'string', required: true },
  email: { type: 'string', required: true, validate: (v) => v.includes('@') },
  age: { type: 'number', required: false, validate: (v) => v >= 0 }
};

// POST /api/conditional-types/validate-user
router.post('/validate-user', (req, res) => {
  const validation = ValidationService.validate(req.body, userSchema);
  
  if (!validation.valid) {
    return res.status(400).json({
      ok: false,
      errors: validation.errors
    });
  }
  
  res.json({
    ok: true,
    data: req.body,
    message: 'User validated'
  });
});

/**
 * Conditional routing based on entity type
 */

// GET /api/conditional-types/entity/:type/:id?
router.get('/entity/:type/:id?', (req, res) => {
  const { type, id } = req.params;
  
  const result = repository.getEntity(type, id ? parseInt(id) : null);
  
  if (!result) {
    return res.status(404).json({
      ok: false,
      error: 'Entity not found or invalid type'
    });
  }
  
  const responseType = repository.determineResponseType(result);
  
  res.json({
    ok: true,
    data: result,
    responseType: responseType,
    pattern: 'Conditional routing: type extends "users" ? User : type extends "posts" ? Post : never'
  });
});

/**
 * Advanced: Generic response builder
 */

// POST /api/conditional-types/generic-response
router.post('/generic-response', (req, res) => {
  const { data, format } = req.body;
  
  // Determine response format based on data type
  let formatted;
  
  if (Array.isArray(data)) {
    formatted = format === 'compact'
      ? data.map(item => ({ id: item.id }))
      : data;
  } else if (typeof data === 'object' && data !== null) {
    formatted = format === 'compact'
      ? { id: data.id, name: data.name }
      : data;
  } else {
    formatted = data;
  }
  
  res.json({
    ok: true,
    data: formatted,
    originalFormat: Array.isArray(data) ? 'array' : typeof data,
    requestedFormat: format,
    pattern: 'Generic conditional type transformation'
  });
});

export default router;
