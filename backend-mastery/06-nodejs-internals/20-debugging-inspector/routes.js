const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/api/debug/info', (req, res) => {
  res.json(controller.getDebugInfo());
});

router.post('/api/debug/breakpoint', (req, res) => {
  res.json(controller.testBreakpoint());
});

router.get('/api/debug/stack', (req, res) => {
  res.json(controller.getStackTrace());
});

router.post('/api/debug/profile', (req, res) => {
  res.json(controller.profileExecution());
});

router.get('/api/debug/memory', (req, res) => {
  res.json(controller.getMemoryUsage());
});

router.post('/api/debug/inspect', (req, res) => {
  res.json(controller.inspectVariables());
});

module.exports = router;
