const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/api/stream/info', (req, res) => {
  res.json(controller.getStreamInfo());
});

router.post('/api/stream/readable', (req, res) => {
  res.json(controller.testReadable());
});

router.post('/api/stream/writable', (req, res) => {
  res.json(controller.testWritable());
});

router.get('/api/stream/transform', (req, res) => {
  res.json(controller.testTransform());
});

router.post('/api/stream/backpressure', (req, res) => {
  res.json(controller.demonstrateBackpressure());
});

router.get('/api/stream/pipe', (req, res) => {
  res.json(controller.testPipe());
});

module.exports = router;
