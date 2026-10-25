const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, getTenantStats } = require('./controller');
const { extractTenantId, validateUserInput, validateUserId, tenantIsolation } = require('./middleware');

router.use(extractTenantId);
router.use(tenantIsolation);

// ==================== Tenant Routes ====================

// Get tenant statistics
router.get('/tenants/:tenantId/stats', (req, res) => {
  try {
    const stats = getTenantStats(req.tenantId);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users in tenant
router.get('/tenants/:tenantId/users', (req, res) => {
  try {
    const users = getAllUsers(req.tenantId);
    res.json({
      success: true,
      data: users,
      count: users.length,
      tenantId: req.tenantId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific user in tenant
router.get('/tenants/:tenantId/users/:id', validateUserId, (req, res) => {
  try {
    const user = getUserById(req.tenantId, parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found in this tenant' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create user in tenant
router.post('/tenants/:tenantId/users', validateUserInput, (req, res) => {
  try {
    const newUser = createUser(req.tenantId, req.body);
    res.status(201).json({
      success: true,
      message: 'User created in tenant',
      data: newUser
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update user in tenant
router.put('/tenants/:tenantId/users/:id', validateUserId, validateUserInput, (req, res) => {
  try {
    const updated = updateUser(req.tenantId, parseInt(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found in this tenant' });
    }
    res.json({
      success: true,
      message: 'User updated in tenant',
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete user from tenant
router.delete('/tenants/:tenantId/users/:id', validateUserId, (req, res) => {
  try {
    const deleted = deleteUser(req.tenantId, parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found in this tenant' });
    }
    res.json({ success: true, message: 'User deleted from tenant' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

