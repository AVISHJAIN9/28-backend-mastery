const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/api/event/info', (req, res) => {
  res.json(controller.getEventInfo());
});

router.post('/api/event/basic', (req, res) => {
  res.json(controller.basicEmitter());
});

router.get('/api/event/once', (req, res) => {
  res.json(controller.testOnce());
});

router.post('/api/event/multiple', (req, res) => {
  res.json(controller.multipleListeners());
});

router.get('/api/event/priority', (req, res) => {
  res.json(controller.testPriority());
});

router.post('/api/event/error', (req, res) => {
  res.json(controller.testErrorHandling());
});

module.exports = router;
