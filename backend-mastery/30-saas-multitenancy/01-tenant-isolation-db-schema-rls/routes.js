// Routes for tenant isolation module

const express = require('express');

const createRoutes = (controller, middleware) => {
  const router = express.Router();

  // Apply tenant extraction and RLS context to all routes
  router.use(middleware.extractTenantFromToken);
  router.use(middleware.setRLSContext);
  router.use(middleware.validateTenantOwnership);

  // Document routes
  router.get('/api/documents', (req, res) => controller.getDocuments(req, res));
  router.get('/api/documents/:id', (req, res) => controller.getDocument(req, res));
  router.post('/api/documents', (req, res) => controller.createDocument(req, res));
  router.put('/api/documents/:id', (req, res) => controller.updateDocument(req, res));
  router.delete('/api/documents/:id', (req, res) => controller.deleteDocument(req, res));

  // User routes
  router.get('/api/users', (req, res) => controller.getTenantUsers(req, res));

  // Tenant info
  router.get('/api/tenant/info', (req, res) => controller.getTenantInfo(req, res));

  // RLS testing
  router.get('/api/test/rls', (req, res) => controller.testRLS(req, res));

  return router;
};

module.exports = { createRoutes };

