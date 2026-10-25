const { logger } = require('./middleware');

// In-memory database
const users = {
  1: { id: 1, name: 'Alice Johnson', email: 'alice@test.com', role: 'admin', deleted_at: null, created_at: new Date('2024-01-15') },
  2: { id: 2, name: 'Bob Smith', email: 'bob@test.com', role: 'user', deleted_at: null, created_at: new Date('2024-01-20') },
  3: { id: 3, name: 'Carol White', email: 'carol@test.com', role: 'user', deleted_at: new Date('2024-02-10'), created_at: new Date('2024-01-25') }
};

let nextId = 4;

// ============= SECURE ENDPOINTS (with soft delete) =============

// Get all active users (excludes soft-deleted)
const listActiveUsers = (req, res) => {
  try {
    const activeUsers = Object.values(users).filter(u => !u.deleted_at);
    logger.info('Listed active users', { count: activeUsers.length });
    res.json({
      success: true,
      data: activeUsers,
      message: `Retrieved ${activeUsers.length} active users`
    });
  } catch (err) {
    logger.error('Error listing users', { error: err.message });
    res.status(500).json({ error: 'Failed to list users' });
  }
};

// Get single active user by ID
const getUserSecure = (req, res) => {
  try {
    const user = users[req.params.id];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.deleted_at) {
      return res.status(404).json({ error: 'User has been deleted' });
    }
    logger.info('Retrieved user', { userId: req.params.id });
    res.json({ success: true, data: user });
  } catch (err) {
    logger.error('Error retrieving user', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
};

// Create new user
const createUser = (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Check if email already exists (including soft-deleted)
    const emailExists = Object.values(users).some(u => u.email === email);
    if (emailExists) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const newUser = {
      id: nextId++,
      name,
      email,
      role,
      deleted_at: null,
      created_at: new Date()
    };
    users[newUser.id] = newUser;
    
    logger.info('User created', { userId: newUser.id, email });
    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (err) {
    logger.error('Error creating user', { error: err.message });
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user (only if not deleted)
const updateUser = (req, res) => {
  try {
    const user = users[req.params.id];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.deleted_at) {
      return res.status(404).json({ error: 'Cannot update deleted user' });
    }
    
    // Update allowed fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.role) user.role = req.body.role;
    user.updated_at = new Date();
    
    logger.info('User updated', { userId: req.params.id });
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (err) {
    logger.error('Error updating user', { error: err.message });
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Soft delete user (set deleted_at timestamp)
const softDeleteUser = (req, res) => {
  try {
    const user = users[req.params.id];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.deleted_at) {
      return res.status(400).json({ error: 'User is already deleted' });
    }
    
    user.deleted_at = new Date();
    logger.warn('User soft-deleted', { userId: req.params.id, deletedAt: user.deleted_at });
    
    res.json({
      success: true,
      data: user,
      message: 'User soft-deleted successfully. Can be restored with restore endpoint.'
    });
  } catch (err) {
    logger.error('Error soft-deleting user', { error: err.message });
    res.status(500).json({ error: 'Failed to soft-delete user' });
  }
};

// Restore soft-deleted user
const restoreUser = (req, res) => {
  try {
    const user = users[req.params.id];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.deleted_at) {
      return res.status(400).json({ error: 'User is not deleted, nothing to restore' });
    }
    
    user.deleted_at = null;
    user.restored_at = new Date();
    logger.info('User restored', { userId: req.params.id });
    
    res.json({
      success: true,
      data: user,
      message: 'User restored successfully'
    });
  } catch (err) {
    logger.error('Error restoring user', { error: err.message });
    res.status(500).json({ error: 'Failed to restore user' });
  }
};

// ============= VULNERABLE ENDPOINTS (for comparison) =============

// Get all users including soft-deleted (vulnerability: doesn't filter)
const listAllUsersVulnerable = (req, res) => {
  try {
    const allUsers = Object.values(users);
    logger.warn('Vulnerability: Listed all users including deleted ones');
    res.json({
      success: true,
      data: allUsers,
      warning: 'This endpoint exposes deleted users (VULNERABILITY)'
    });
  } catch (err) {
    logger.error('Error listing all users', { error: err.message });
    res.status(500).json({ error: 'Failed to list users' });
  }
};

// Get user by ID without checking if deleted (vulnerability)
const getUserVulnerable = (req, res) => {
  try {
    const user = users[req.params.id];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // VULNERABILITY: No check for deleted_at
    logger.warn('Vulnerability: Retrieved deleted user data', { userId: req.params.id, deletedAt: user.deleted_at });
    res.json({
      success: true,
      data: user,
      warning: user.deleted_at ? 'Retrieved DELETED user data (VULNERABILITY)' : null
    });
  } catch (err) {
    logger.error('Error retrieving user', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
};

// Hard delete (permanent removal - NOT RECOMMENDED)
const hardDeleteUser = (req, res) => {
  try {
    if (!users[req.params.id]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const deletedUser = users[req.params.id];
    delete users[req.params.id];
    logger.warn('User hard-deleted (permanent removal)', { userId: req.params.id });
    
    res.json({
      success: true,
      data: deletedUser,
      warning: 'User permanently deleted - CANNOT BE RESTORED'
    });
  } catch (err) {
    logger.error('Error hard-deleting user', { error: err.message });
    res.status(500).json({ error: 'Failed to hard-delete user' });
  }
};

// Get deleted users only
const listDeletedUsers = (req, res) => {
  try {
    const deletedUsers = Object.values(users).filter(u => u.deleted_at);
    logger.info('Listed deleted users', { count: deletedUsers.length });
    res.json({
      success: true,
      data: deletedUsers,
      message: `Retrieved ${deletedUsers.length} deleted users`
    });
  } catch (err) {
    logger.error('Error listing deleted users', { error: err.message });
    res.status(500).json({ error: 'Failed to list deleted users' });
  }
};

// Get user audit trail (including delete history)
const getUserAuditTrail = (req, res) => {
  try {
    const user = users[req.params.id];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const trail = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at || null,
      deleted_at: user.deleted_at || null,
      restored_at: user.restored_at || null,
      is_active: !user.deleted_at,
      status: user.deleted_at ? 'DELETED' : 'ACTIVE'
    };
    
    logger.info('Retrieved audit trail', { userId: req.params.id });
    res.json({ success: true, data: trail });
  } catch (err) {
    logger.error('Error retrieving audit trail', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve audit trail' });
  }
};

module.exports = {
  // Secure endpoints
  listActiveUsers,
  getUserSecure,
  createUser,
  updateUser,
  softDeleteUser,
  restoreUser,
  // Vulnerable endpoints (for demo)
  listAllUsersVulnerable,
  getUserVulnerable,
  hardDeleteUser,
  listDeletedUsers,
  getUserAuditTrail
};

