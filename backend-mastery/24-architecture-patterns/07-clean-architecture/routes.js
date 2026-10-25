const express = require('express');
const router = express.Router();
const {
  CreateUserUseCase,
  GetUserUseCase,
  GetAllUsersUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase
} = require('./controller');
const { validateUserInput, validateUserId, trackUseCase } = require('./middleware');

router.use(trackUseCase);

// ==================== User Routes (Interface Adapters) ====================

router.get('/users', (req, res) => {
  try {
    const users = GetAllUsersUseCase.execute();
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
    const user = GetUserUseCase.execute(parseInt(req.params.id));
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/users', validateUserInput, (req, res) => {
  try {
    const newUser = CreateUserUseCase.execute(req.body);
    res.status(201).json({
      success: true,
      message: 'User created',
      data: newUser
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/users/:id', validateUserId, validateUserInput, (req, res) => {
  try {
    const updated = UpdateUserUseCase.execute(parseInt(req.params.id), req.body);
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
    DeleteUserUseCase.execute(parseInt(req.params.id));
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;

