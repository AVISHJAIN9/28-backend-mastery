const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, createUser, updateUser, deleteUser } = require('./controller');
const { validateUserInput, validateUserId } = require('./middleware');

// ==================== User Routes ====================

// GET all users
router.get('/users', (req, res) => {
  try {
    const users = getAllUsers();
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
    const user = getUserById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE new user
router.post('/users', validateUserInput, (req, res) => {
  try {
    const newUser = createUser(req.body);
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
    const updated = updateUser(parseInt(req.params.id), req.body);
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
    const deleted = deleteUser(parseInt(req.params.id));
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

// ==================== Status Routes ====================

router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    architecture: 'Monolith Well Structured',
    modules: 1,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
