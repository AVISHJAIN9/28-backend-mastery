/**
 * Module 05: Routes - Async operations
 */

const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.get('/user/:id', async (req, res) => {
  try {
    const user = await controller.fetchUser(req.params.id);
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/retry', async (req, res) => {
  try {
    const result = await controller.retryWithBackoff(
      () => Promise.resolve(req.body),
      3
    );
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/sleep/:ms', async (req, res) => {
  try {
    await controller.sleep(parseInt(req.params.ms));
    res.json({ slept: parseInt(req.params.ms) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const ids = req.body.ids || [1, 2, 3];
    const users = await controller.fetchMultiple(ids);
    res.json(users);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/race', async (req, res) => {
  try {
    const urls = req.body.urls || [];
    if (urls.length === 0) return res.json({ error: 'No URLs' });
    const winner = await controller.raceRequests(urls);
    res.json(winner);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;

