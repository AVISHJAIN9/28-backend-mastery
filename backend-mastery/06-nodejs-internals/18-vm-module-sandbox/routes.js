const express = require('express');
const router = express.Router();
const controller = require('./controller');
const middleware = require('./middleware');

// GET endpoints
router.get('/api/vm/sandbox-info', (req, res) => {
  res.json(controller.getSandboxInfo());
});

router.get('/api/vm/security-test', (req, res) => {
  res.json(controller.testSecurity());
});

router.get('/api/vm/context-data', (req, res) => {
  res.json(controller.getContextData());
});

// POST endpoints
router.post('/api/vm/execute', middleware.validateCode, (req, res) => {
  const result = controller.executeCode(req.body.code, req.body.vars);
  res.json(result);
});

router.post('/api/vm/performance', middleware.validateCode, (req, res) => {
  const result = controller.testPerformance(req.body.code);
  res.json(result);
});

router.post('/api/vm/multi-context', middleware.validateCode, (req, res) => {
  const result = controller.multiContext(req.body.code);
  res.json(result);
});

module.exports = router;
