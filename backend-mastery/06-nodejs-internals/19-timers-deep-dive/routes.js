const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/api/timers/order', (req, res) => {
  res.json(controller.getTimerOrder());
});

router.post('/api/timers/precision', (req, res) => {
  res.json(controller.measurePrecision());
});

router.get('/api/timers/ref-unref', (req, res) => {
  res.json(controller.testRefUnref());
});

router.post('/api/timers/interval', (req, res) => {
  res.json(controller.testInterval());
});

router.get('/api/timers/performance', (req, res) => {
  res.json(controller.testPerformance());
});

router.post('/api/timers/cleanup', (req, res) => {
  res.json(controller.testCleanup());
});

module.exports = router;
