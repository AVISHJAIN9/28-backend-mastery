const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { logHttpVersion, addTiming, simulateProtocol } = require('./middleware');
const schemas = require('./schema');

// Apply middleware to all routes
router.use(logHttpVersion);
router.use(addTiming);

// GET /api/protocol-info - Get information about current HTTP version
router.get('/protocol-info', controller.getProtocolInfo);

// GET /api/compare - Compare HTTP versions
router.get('/compare', controller.compareProtocols);

// GET /api/multiplexing - Demonstrate multiplexing
router.get('/multiplexing', simulateProtocol, controller.getMultiplexDemo);

// GET /api/server-push - Demonstrate server push
router.get('/server-push', simulateProtocol, controller.getServerPushDemo);

// GET /api/performance - Get performance comparison
router.get('/performance', controller.getPerformanceData);

// GET /api/resources/:type - Get multiple resources to test parallelization
router.get('/resources/:count', (req, res) => {
  const count = Math.min(parseInt(req.params.count) || 5, 20);
  const resources = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Resource ${i + 1}`,
    url: `/api/resources/${i + 1}`,
    size: Math.floor(Math.random() * 100) + 10
  }));

  res.json({
    protocol: `HTTP/${req.httpVersion}`,
    totalResources: count,
    resources,
    message: 'Open DevTools to see parallelization'
  });
});

module.exports = router;

