const express = require('express');
const router = express.Router();
const { userService } = require('./controller');
const { validateUserInput, validateUserId, injectAdapter } = require('./middleware');

router.use(injectAdapter);

// ==================== User Routes ====================

router.get('/users', (req, res) => {
  try {
    const users = userService.getAllUsers();
    res.json({
      success: true,
      data: users,
      count: users.length,
      adapter: req.adapter
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/users/:id', validateUserId, (req, res) => {
  try {
    const user = userService.getUser(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/users', validateUserInput, (req, res) => {
  try {
    const newUser = userService.createUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User created via hexagonal port',
      data: newUser
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/users/:id', validateUserId, validateUserInput, (req, res) => {
  try {
    const updated = userService.updateUser(parseInt(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User updated',
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/users/:id', validateUserId, (req, res) => {
  try {
    userService.deleteUser(parseInt(req.params.id));
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

