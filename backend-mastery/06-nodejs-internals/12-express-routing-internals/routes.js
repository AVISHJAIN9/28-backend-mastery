/**
 * Express Routing Internals - Routes
 */

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const middleware = require('./middleware');

// ============================================
// Middleware Setup
// ============================================

router.use(middleware.requestLogger);
router.use(middleware.errorHandler);

// ============================================
// Basic Routes
// ============================================

router.get('/api/basic', controller.basicRoute);
router.get('/api/rules', controller.getRoutingRules);
router.get('/api/priority', controller.routePriority);
router.get('/api/chaining', controller.routeChaining);

// ============================================
// Routes with Parameters
// ============================================

router.get('/api/users/:id', controller.routeWithParams);
router.get('/api/search', controller.routeWithQuery);
router.get('/api/users/:userId/items/:itemId', controller.nestedRoute);
router.get('/api/files/:filename(*)', controller.regexRoute);

// ============================================
// REST API Routes with CRUD
// ============================================

router
  .route('/api/items')
  .get((req, res) => controller.routeWithQuery(req, res))
  .post(controller.createItem);

router
  .route('/api/items/:id')
  .get(controller.getItem)
  .put(controller.updateItem)
  .delete(controller.deleteItem);

// ============================================
// Subrouter Example
// ============================================

router.get('/api/subrouter', controller.subrouterInfo);

// ============================================
// Middleware Order Test
// ============================================

router.get('/api/middleware-order', controller.middlewareOrder);

module.exports = router;
