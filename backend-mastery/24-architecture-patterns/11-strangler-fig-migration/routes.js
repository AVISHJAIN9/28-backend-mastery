const express = require('express');
const router = express.Router();
const { StranglerFacade } = require('./controller');
const { selectSystem, validateUserInput, validateUserId } = require('./middleware');

router.use(selectSystem);

// ==================== Strangler Routes ====================

router.get('/users', (req, res) => {
  try {
    const users = StranglerFacade.getAllUsers(req.useLegacy);
    res.json({
      success: true,
      data: users,
      count: users.length,
      system: req.useLegacy ? 'legacy' : 'modern'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/users/:id', validateUserId, (req, res) => {
  try {
    const user = StranglerFacade.getUserById(parseInt(req.params.id));
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
    const newUser = StranglerFacade.createUser(req.body, req.useLegacy);
    res.status(201).json({
      success: true,
      message: 'User created via strangler facade',
      data: newUser,
      system: req.useLegacy ? 'legacy' : 'modern'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/users/:id', validateUserId, validateUserInput, (req, res) => {
  try {
    const updated = StranglerFacade.updateUser(parseInt(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User updated via modern system',
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/users/:id', validateUserId, (req, res) => {
  try {
    const deleted = StranglerFacade.deleteUser(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted via modern system' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

