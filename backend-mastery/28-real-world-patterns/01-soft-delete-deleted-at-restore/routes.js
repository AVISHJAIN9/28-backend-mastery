const express = require('express');
const router = express.Router();
const {
  validateQuery,
  validateId,
  validateCreateUser,
  validateUpdateUser
} = require('./middleware');
const {
  listActiveUsers,
  getUserSecure,
  createUser,
  updateUser,
  softDeleteUser,
  restoreUser,
  listAllUsersVulnerable,
  getUserVulnerable,
  hardDeleteUser,
  listDeletedUsers,
  getUserAuditTrail
} = require('./controller');

// ============= SECURE ENDPOINTS (Recommended) =============

// Get all active users (filters out deleted)
router.get('/secure/users', validateQuery, listActiveUsers);

// Get single active user
router.get('/secure/users/:id', validateId, getUserSecure);

// Create new user
router.post('/secure/users', validateCreateUser, createUser);

// Update user
router.patch('/secure/users/:id', validateId, validateUpdateUser, updateUser);

// Soft delete user (set deleted_at)
router.delete('/secure/users/:id', validateId, softDeleteUser);

// Restore soft-deleted user
router.post('/secure/users/:id/restore', validateId, restoreUser);

// Get user audit trail
router.get('/secure/users/:id/audit-trail', validateId, getUserAuditTrail);

// ============= VULNERABLE ENDPOINTS (For Comparison) =============

// Get all users INCLUDING deleted (VULNERABILITY)
router.get('/vulnerable/users', validateQuery, listAllUsersVulnerable);

// Get user without checking if deleted (VULNERABILITY)
router.get('/vulnerable/users/:id', validateId, getUserVulnerable);

// Permanently delete user (NOT RECOMMENDED)
router.delete('/vulnerable/users/:id/hard-delete', validateId, hardDeleteUser);

// Get only deleted users (can be useful for admin)
router.get('/admin/deleted-users', validateQuery, listDeletedUsers);

module.exports = router;

