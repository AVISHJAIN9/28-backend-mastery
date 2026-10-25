const express = require('express');
const router = express.Router();
const {
  validateQuery,
  validateId,
  validateCreateProduct,
  validateUpdateProduct
} = require('./middleware');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProductSecure,
  updateProductVulnerable,
  simulateConcurrentUpdate,
  getVersionHistory,
  retryUpdate,
  resetVersion,
  getMostEditedProducts
} = require('./controller');

// ============= SECURE ENDPOINTS (with optimistic locking) =============

// Get all products
router.get('/secure/products', validateQuery, listProducts);

// Get single product
router.get('/secure/products/:id', validateId, getProduct);

// Create new product
router.post('/secure/products', validateCreateProduct, createProduct);

// Update with version check (SECURE)
router.patch('/secure/products/:id', validateId, validateUpdateProduct, updateProductSecure);

// Get version history
router.get('/secure/products/:id/history', validateId, getVersionHistory);

// Retry update with backoff
router.post('/secure/products/:id/retry-update', validateId, retryUpdate);

// ============= VULNERABLE ENDPOINT (for comparison) =============

// Update without version check (VULNERABLE)
router.patch('/vulnerable/products/:id', validateId, validateUpdateProduct, updateProductVulnerable);

// ============= TESTING & SIMULATION ENDPOINTS =============

// Simulate concurrent update conflict
router.post('/test/products/:id/concurrent-update', validateId, validateUpdateProduct, simulateConcurrentUpdate);

// Reset version (for testing)
router.post('/test/products/:id/reset-version', validateId, resetVersion);

// Get most edited products
router.get('/test/most-edited-products', getMostEditedProducts);

module.exports = router;

