/**
 * Module 03: Routes - Test Doubles patterns
 */

const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.post('/users', async (req, res) => {
  try {
    const user = await controller.createUserWithEmail(req.body);
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/api/external/:id', async (req, res) => {
  try {
    const user = await controller.fetchUserFromAPI(req.params.id);
    res.json(user);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const valid = await controller.validateWithExternalService(req.body);
    res.json({ valid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/notify/:id', async (req, res) => {
  try {
    const result = await controller.sendNotificationWithRetry(
      req.params.id,
      req.body.message
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/user/:id', (req, res) => {
  const data = controller.getUserData(req.params.id);
  res.json(data);
});

router.get('/payment/:orderId', (req, res) => {
  const status = controller.getPaymentStatus(req.params.orderId);
  res.json(status);
});

module.exports = router;

