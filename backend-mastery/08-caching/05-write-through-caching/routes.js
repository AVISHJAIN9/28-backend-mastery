// Routes for 05 Write Through Caching
const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');

const router = express.Router();

// ==================== Middleware ====================

router.use(middleware.validateRequest);

// ==================== Routes ====================

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: '05 Write Through Caching' });
});

// Main routes
router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// ==================== Error Handler ====================

router.use((err, req, res, next) => {
  console.error('Route error:', err.message);
  res.status(err.status || 500).json({'error': err.message});
});

module.exports = router;
