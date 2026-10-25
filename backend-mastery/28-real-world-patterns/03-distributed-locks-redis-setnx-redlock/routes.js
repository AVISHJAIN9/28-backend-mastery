const express = require('express');
const router = express.Router();
const {
  validateProcessTransaction,
  validateBatchPayment,
  validateAllocateResource,
  validateQuery,
  validateId
} = require('./middleware');

const {
  processTransactionVulnerable,
  processTransactionSecure,
  batchPaymentRedlock,
  allocateResourceSecure,
  getTransactionsVulnerable,
  getTransactionsSecure,
  clearAllData
} = require('./controller');

// ==================== VULNERABLE ==================== //

/**
 * POST /api/vulnerable/process-transaction
 * Demonstrates race condition without locking
 * Multiple concurrent requests can process the same transaction multiple times
 */
router.post('/vulnerable/process-transaction', validateProcessTransaction, processTransactionVulnerable);

/**
 * GET /api/vulnerable/transactions
 * List all transactions (no lock visibility)
 */
router.get('/vulnerable/transactions', validateQuery, getTransactionsVulnerable);

// ==================== SECURE ==================== //

/**
 * POST /api/secure/process-transaction
 * Uses Redis SETNX for atomic single-instance lock
 * Only one process can enter critical section at a time
 * Returns 409 if transaction already processing
 */
router.post('/secure/process-transaction', validateProcessTransaction, processTransactionSecure);

/**
 * GET /api/secure/transactions
 * List all transactions with active lock information
 * Shows which transactions are currently locked
 */
router.get('/secure/transactions', validateQuery, getTransactionsSecure);

// ==================== ADVANCED ==================== //

/**
 * POST /api/advanced/batch-payment
 * Uses Redlock for multi-instance distributed locking (fault-tolerant)
 * Automatically handles retries and lock extensions
 * Safe for distributed systems with multiple server instances
 * Returns 409 if another instance is already processing
 */
router.post('/advanced/batch-payment', validateBatchPayment, batchPaymentRedlock);

/**
 * POST /api/advanced/allocate-resource
 * Demonstrates lock extension for long-running operations
 * Periodically refreshes lock TTL to keep operation atomic
 * Prevents resource over-allocation in concurrent scenarios
 */
router.post('/advanced/allocate-resource', validateAllocateResource, allocateResourceSecure);

// ==================== UTILS ==================== //

/**
 * POST /api/clear
 * Clear all in-memory data and flush Redis
 * For testing purposes only
 */
router.post('/clear', clearAllData);

module.exports = router;

