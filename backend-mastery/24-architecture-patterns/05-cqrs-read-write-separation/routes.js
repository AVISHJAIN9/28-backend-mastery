const express = require('express');
const router = express.Router();
const {
  commandCreateUser,
  commandUpdateUser,
  commandDeleteUser,
  queryGetAllUsers,
  queryGetUserById,
  queryUsersByRole,
  queryUsersByStatus,
  queryUserStats
} = require('./controller');
const { validateUserInput, validateUserId, trackRequest } = require('./middleware');

// Apply tracking middleware
router.use(trackRequest);

// ==================== Commands (Write Operations) ====================

// CREATE user
router.post('/users', validateUserInput, (req, res) => {
  try {
    const newUser = commandCreateUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// UPDATE user
router.put('/users/:id', validateUserId, validateUserInput, (req, res) => {
  try {
    const updated = commandUpdateUser(parseInt(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE user
router.delete('/users/:id', validateUserId, (req, res) => {
  try {
    const deleted = commandDeleteUser(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Queries (Read Operations) ====================

// GET all users
router.get('/users', (req, res) => {
  try {
    const users = queryGetAllUsers();
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET user by ID
router.get('/users/:id', validateUserId, (req, res) => {
  try {
    const user = queryGetUserById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET users by role
router.get('/users/by/role/:role', (req, res) => {
  try {
    const users = queryUsersByRole(req.params.role);
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET users by status
router.get('/users/by/status/:status', (req, res) => {
  try {
    const users = queryUsersByStatus(req.params.status);
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET user statistics
router.get('/statistics/users', (req, res) => {
  try {
    const stats = queryUserStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

