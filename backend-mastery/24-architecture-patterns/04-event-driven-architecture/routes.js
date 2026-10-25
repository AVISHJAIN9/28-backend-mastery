const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, changeUserStatus, getEventLog } = require('./controller');
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

// CREATE new user (fires event)
router.post('/users', validateUserInput, (req, res) => {
  try {
    const newUser = createUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User created successfully (event fired)',
      data: newUser
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// UPDATE user (fires event)
router.put('/users/:id', validateUserId, validateUserInput, (req, res) => {
  try {
    const updated = updateUser(parseInt(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User updated successfully (event fired)',
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE user (fires event)
router.delete('/users/:id', validateUserId, (req, res) => {
  try {
    const deleted = deleteUser(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User deleted successfully (event fired)'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CHANGE user status (fires event)
router.patch('/users/:id/status', validateUserId, (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    const changed = changeUserStatus(parseInt(req.params.id), status);
    if (!changed) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User status changed (event fired)'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET event log
router.get('/events/log', (req, res) => {
  try {
    const events = getEventLog();
    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

