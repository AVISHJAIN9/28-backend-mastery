const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/api/test/assertions', (req, res) => {
  res.json(controller.runAssertions());
});

router.post('/api/test/equality', (req, res) => {
  res.json(controller.testEquality());
});

router.get('/api/test/deep', (req, res) => {
  res.json(controller.testDeepEqual());
});

router.post('/api/test/throws', (req, res) => {
  res.json(controller.testThrows());
});

router.get('/api/test/types', (req, res) => {
  res.json(controller.testTypes());
});

router.post('/api/test/custom', (req, res) => {
  res.json(controller.testCustomAssertions());
});

module.exports = router;
