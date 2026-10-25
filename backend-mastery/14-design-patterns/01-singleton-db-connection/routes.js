const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validateUserInput } = require('./middleware');

// ==================== Connection Management ====================

// Get connection status
router.get('/connection/status', (req, res) => {
  try {
    const status = controller.getConnectionStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to database
router.post('/connection/connect', (req, res) => {
  try {
    const result = controller.connectDatabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect from database
router.post('/connection/disconnect', (req, res) => {
  try {
    const result = controller.disconnectDatabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get connection info
router.get('/connection/info', (req, res) => {
  try {
    const info = controller.getConnectionInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== User CRUD Operations ====================

// Get all users
router.get('/users', (req, res) => {
  try {
    const users = controller.getAllUsers();
    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user
router.post('/users', validateUserInput, (req, res) => {
  try {
    const user = controller.createUser(req.body);
    res.status(201).json({ success: true, data: user, message: 'User created' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user by ID
router.get('/users/:id', (req, res) => {
  try {
    const user = controller.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/users/:id', (req, res) => {
  try {
    const user = controller.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, data: user, message: 'User updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', (req, res) => {
  try {
    const success = controller.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Instance Info ====================

// Get singleton instance info
router.get('/instance/info', (req, res) => {
  try {
    const info = controller.getInstanceInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
