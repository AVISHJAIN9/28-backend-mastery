const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, createUserWithSaga, updateUser, deleteUser, getTransactionLog } = require('./controller');
const { validateUserInput, validateUserId, sagaTracker } = require('./middleware');

router.use(sagaTracker);

// ==================== User Routes ====================

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

router.post('/users', validateUserInput, async (req, res) => {
  try {
    const newUser = await createUserWithSaga(req.body);
    res.status(201).json({
      success: true,
      message: 'User created via saga transaction',
      data: newUser,
      sagaId: req.sagaId
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/users/:id', validateUserId, validateUserInput, (req, res) => {
  try {
    const updated = updateUser(parseInt(req.params.id), req.body);
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
    const deleted = deleteUser(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/transactions/log', (req, res) => {
  try {
    const log = getTransactionLog();
    res.json({
      success: true,
      data: log,
      count: log.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

