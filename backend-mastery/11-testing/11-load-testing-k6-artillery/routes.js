const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.post('/users', (req, res) => res.status(201).json(controller.createUser(req.body.name, req.body.email)));
router.get('/users/:id', (req, res) => {
  try {
    res.json(controller.getUser(req.params.id));
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});
router.get('/users', (req, res) => res.json(controller.getAllUsers()));
router.put('/users/:id', (req, res) => {
  try {
    res.json(controller.updateUser(req.params.id, req.body));
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});
router.delete('/users/:id', (req, res) => {
  try {
    res.json(controller.deleteUser(req.params.id));
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});
router.get('/stats', (req, res) => res.json({ count: controller.getUserCount() }));

module.exports = router;

