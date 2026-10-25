const express = require('express');
const router = express.Router();
const { MobileAPI, WebAPI, AdminAPI, createUser, updateUser, deleteUser } = require('./controller');
const { detectClientType, validateUserInput, validateUserId } = require('./middleware');

router.use(detectClientType);

// ==================== Mobile API Routes ====================

router.get('/mobile/users', (req, res) => {
  try {
    const data = MobileAPI.getMinimalUsers();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/mobile/users/:id', validateUserId, (req, res) => {
  try {
    const user = MobileAPI.getDetailedUser(parseInt(req.params.id));
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Web API Routes ====================

router.get('/web/users', (req, res) => {
  try {
    const result = WebAPI.getAllUsersWithMeta();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/web/users/paginated/:page', (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const result = WebAPI.getPaginatedUsers(page);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Admin Dashboard Routes ====================

router.get('/admin/dashboard', (req, res) => {
  try {
    const data = AdminAPI.getDashboardData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Shared CRUD Routes ====================

router.post('/users', validateUserInput, (req, res) => {
  try {
    const newUser = createUser(req.body);
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

module.exports = router;

