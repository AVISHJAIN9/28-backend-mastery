import express from 'express';
import UserController from './controller.js';

const router = express.Router();
const userController = new UserController();

/**
 * POST /api/users
 * Create a new user
 */
router.post('/users', async (req, res) => {
  try {
    const result = await userController.createUser(req.body);
    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * GET /api/users
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const result = await userController.getAllUsers();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * GET /api/users/:id
 * Get single user
 */
router.get('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const result = await userController.getUser(userId);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const result = await userController.updateUser(userId, req.body);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const result = await userController.deleteUser(userId);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * GET /api/users/role/:role
 * Get users by role
 */
router.get('/users-by-role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const result = await userController.getUsersByRole(role);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * POST /api/users/:id/promote
 * Promote user to admin
 */
router.post('/users/:id/promote', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { permissions, department } = req.body;
    const result = await userController.promoteToAdmin(userId, permissions, department);
    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * POST /api/users/batch
 * Create multiple users
 */
router.post('/users-batch', async (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Expected users array', code: 'INVALID_INPUT' }
      });
    }
    const result = await userController.batchCreateUsers(users);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

/**
 * GET /api/validation-schema
 * Get validation schema documentation
 */
router.get('/validation-schema', (req, res) => {
  try {
    const schema = userController.getValidationSchema();
    res.json({ success: true, data: schema });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export default router;

