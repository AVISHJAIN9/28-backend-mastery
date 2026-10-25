const express = require('express');
const UserService = require('./controller');
const router = express.Router();
const service = new UserService();

router.post('/users', (req, res) => {
  try {
    const user = service.createUser(req.body.name, req.body.email);
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/users/:id', (req, res) => {
  try {
    const user = service.getUser(req.params.id);
    res.json(user);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

router.get('/users', (req, res) => res.json(service.getAllUsers()));
router.put('/users/:id', (req, res) => {
  try {
    const user = service.updateUser(req.params.id, req.body.name, req.body.email);
    res.json(user);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});
router.delete('/users/:id', (req, res) => {
  res.json(service.deleteUser(req.params.id));
});

module.exports = router;

