/**
 * Routes for Generics & API Response Patterns
 * Uses generic Repository pattern from controller
 */

const express = require('express');
const { UserRepository, Service } = require('./controller');
const { validateUserCreation, validatePageParams, errorHandler } = require('./middleware');

const router = express.Router();

// Initialize repository
const users = [
  { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin', isActive: true },
  { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user', isActive: true },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', role: 'user', isActive: true },
  { id: 4, name: 'Diana', email: 'diana@test.com', role: 'moderator', isActive: true },
  { id: 5, name: 'Eve', email: 'eve@test.com', role: 'user', isActive: false }
];

const userRepository = new UserRepository(users);
const userService = new Service(userRepository);

// Helper: Format response with Request/Response generic pair
const formatResponse = (result, statusCode = 200) => {
  return {
    statusCode,
    result
  };
};

/**
 * POST /api/users
 * Create user
 * Generic: Result<User>
 */
router.post('/api/users', validateUserCreation, async (req, res, next) => {
  try {
    const startTime = Date.now();
    const newUser = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role || 'user',
      isActive: true
    };

    const result = await userRepository.create(newUser);
    const statusCode = result.ok ? 201 : 400;

    res.status(statusCode).json({
      ...result,
      timestamp: Date.now(),
      duration: result.ok ? Date.now() - startTime : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users
 * List all users (paginated)
 * Generic: PaginatedResponse<User>
 */
router.get('/api/users', validatePageParams, async (req, res, next) => {
  try {
    const startTime = Date.now();
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const paginatedResult = await userRepository.paginate(page, pageSize);

    if (!paginatedResult.ok) {
      return res.status(400).json(paginatedResult);
    }

    res.json({
      ok: true,
      data: paginatedResult.data,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:id
 * Get single user
 * Generic: Result<User>
 */
router.get('/api/users/:id', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const result = await userRepository.getById(parseInt(req.params.id));
    const statusCode = result.ok ? 200 : 404;

    res.status(statusCode).json({
      ...result,
      timestamp: Date.now(),
      duration: result.ok ? Date.now() - startTime : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/:id
 * Update user
 * Generic: Result<User>
 */
router.put('/api/users/:id', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const updates = {};

    // Only allow certain fields to be updated
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.role) updates.role = req.body.role;
    if (typeof req.body.isActive === 'boolean') updates.isActive = req.body.isActive;

    const result = await userRepository.update(parseInt(req.params.id), updates);
    const statusCode = result.ok ? 200 : 404;

    res.status(statusCode).json({
      ...result,
      timestamp: Date.now(),
      duration: result.ok ? Date.now() - startTime : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/:id
 * Delete user
 * Generic: Result<boolean> with metadata
 */
router.delete('/api/users/:id', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const result = await userRepository.delete(parseInt(req.params.id));
    const statusCode = result.ok ? 200 : 404;

    res.status(statusCode).json({
      ...result,
      message: result.ok ? 'User deleted successfully' : 'User not found',
      timestamp: Date.now(),
      duration: result.ok ? Date.now() - startTime : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users-by-role/:role
 * Get users by role
 * Generic: Result<User[]> parameterized by role
 */
router.get('/api/users-by-role/:role', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const result = await userRepository.getByRole(req.params.role);

    if (!result.ok) {
      return res.status(400).json(result);
    }

    res.json({
      ok: true,
      data: result.data,
      count: result.data.length,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users-batch
 * Create multiple users
 * Generic: Result<{ total, successful, results }>
 */
router.post('/api/users-batch', async (req, res, next) => {
  try {
    const startTime = Date.now();

    if (!Array.isArray(req.body.users)) {
      return res.status(400).json({
        ok: false,
        error: { message: 'users must be an array', code: 'INVALID_INPUT' }
      });
    }

    const result = await userRepository.bulkCreate(req.body.users);
    const statusCode = result.ok ? 201 : 400;

    res.status(statusCode).json({
      ...result,
      timestamp: Date.now(),
      duration: result.ok ? Date.now() - startTime : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/search
 * Search users
 * Demonstrates conditional generic: Result<User[]> depending on filter
 */
router.post('/api/users/search', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const { query, role, isActive } = req.body;

    let result;

    if (query) {
      result = await userRepository.searchByName(query);
    } else if (role) {
      result = await userRepository.getByRole(role);
    } else if (typeof isActive === 'boolean') {
      result = await userRepository.search(user => user.isActive === isActive);
    } else {
      // Return all
      result = await userRepository.getAll();
    }

    if (!result.ok) {
      return res.status(400).json(result);
    }

    res.json({
      ok: true,
      data: result.data,
      filters: { query, role, isActive },
      count: result.data.length,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/:id/promote
 * Promote user to admin
 * Generic: Result<User> with action metadata
 */
router.post('/api/users/:id/promote', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const result = await userRepository.promoteToAdmin(parseInt(req.params.id));
    const statusCode = result.ok ? 200 : 404;

    res.status(statusCode).json({
      ...result,
      action: 'promote',
      timestamp: Date.now(),
      duration: result.ok ? Date.now() - startTime : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/:id/deactivate
 * Deactivate user
 * Generic: Result<User>
 */
router.post('/api/users/:id/deactivate', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const result = await userRepository.deactivate(parseInt(req.params.id));
    const statusCode = result.ok ? 200 : 404;

    res.status(statusCode).json({
      ...result,
      action: 'deactivate',
      timestamp: Date.now(),
      duration: result.ok ? Date.now() - startTime : undefined
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats
 * Get repository statistics
 * Generic: Result<Stats>
 */
router.get('/api/stats', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const result = await userRepository.stats();

    res.json({
      ...result,
      timestamp: Date.now(),
      duration: Date.now() - startTime
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

