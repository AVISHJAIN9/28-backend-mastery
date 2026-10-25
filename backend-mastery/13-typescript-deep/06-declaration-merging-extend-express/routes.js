import express from 'express';
import { AuthService, ContextService, ValidationService, ResponseBuilder, MultiTenantContext } from './controller.js';

const router = express.Router();
const authService = new AuthService();
const contextService = new ContextService();
const validationService = new ValidationService();
const responseBuilder = new ResponseBuilder();

/**
 * Module Info
 */

router.get('/info', (req, res) => {
  res.json({
    module: '13.6 - Declaration Merging & Express Augmentation',
    concepts: [
      'Augment Express Request with custom properties',
      'Augment Express Response with helper methods', 
      'Module/namespace merging',
      'Type-safe middleware chains',
      'Multi-tenant context'
    ]
  });
});

/**
 * Authentication & User Context
 */

// POST /api/declare/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = authService.authenticate(email, password);
  
  if (!user) {
    return res.status(401).json({
      ok: false,
      error: 'Invalid credentials'
    });
  }
  
  res.json({
    ok: true,
    data: {
      user: user,
      token: 'Bearer ' + user.id
    }
  });
});

// GET /api/declare/profile
router.get('/profile', (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      error: 'Not authenticated'
    });
  }
  
  res.json({
    ok: true,
    data: {
      user: req.user,
      authenticated: true,
      pattern: 'Request augmentation: req.user'
    }
  });
});

/**
 * Response Helper Methods
 */

// GET /api/declare/users
router.get('/users', (req, res) => {
  const users = [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
    { id: 3, name: 'Charlie', role: 'user' }
  ];
  
  // Using augmented response helpers
  res.sendSuccess(users, 'Users retrieved');
});

// GET /api/declare/error-demo
router.get('/error-demo', (req, res) => {
  // Using augmented sendError helper
  res.sendError('This is a demo error', 'DEMO_ERROR');
});

// GET /api/declare/paginated
router.get('/paginated', (req, res) => {
  const items = [
    { id: 1, title: 'Item 1' },
    { id: 2, title: 'Item 2' },
    { id: 3, title: 'Item 3' }
  ];
  
  // Using augmented sendPaginated helper
  res.sendPaginated(items, 150, 1, 10);
});

/**
 * Context & Request Tracking
 */

// GET /api/declare/context
router.get('/context', (req, res) => {
  res.json({
    ok: true,
    data: {
      context: req.context,
      user: req.user,
      validated: req.validated,
      pattern: 'Request augmentation with context'
    }
  });
});

/**
 * Validation Middleware Example
 */

// POST /api/declare/validate-user
router.post('/validate-user', (req, res) => {
  const { name, email } = req.body;
  
  const isValid = validationService.validateUser({ name, email });
  
  if (!isValid) {
    return res.sendError('Invalid user data');
  }
  
  res.sendSuccess({ name, email }, 'User is valid');
});

/**
 * Multi-tenant Context
 */

// GET /api/declare/tenant/:tenantId
router.get('/tenant/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  
  const tenantContext = contextService.getTenantContext(tenantId);
  
  if (!tenantContext) {
    return res.sendError('Tenant not found');
  }
  
  res.sendSuccess({
    tenantId: tenantId,
    context: tenantContext,
    pattern: 'Multi-tenant request augmentation'
  }, 'Tenant context retrieved');
});

/**
 * Type-safe Response Builder
 */

// GET /api/declare/build-response
router.get('/build-response', (req, res) => {
  const response = responseBuilder
    .withSuccess(true)
    .withData({ message: 'Built response' })
    .withPattern('ResponseBuilder pattern')
    .build();
  
  res.json(response);
});

/**
 * Augmented Request Properties Demonstration
 */

// POST /api/declare/demo/augmented
router.post('/demo/augmented', (req, res) => {
  const demo = {
    requestAugmentations: {
      user: req.user ? 'Added by middleware' : 'Not found',
      validated: req.validated ? 'Added by middleware' : 'Not found',
      context: req.context ? 'Added by middleware' : 'Not found'
    },
    responseAugmentations: ['sendSuccess', 'sendError', 'sendPaginated'],
    pattern: 'Declaration merging extends Express types'
  };
  
  res.sendSuccess(demo, 'Augmentations demonstrated');
});

export default router;
