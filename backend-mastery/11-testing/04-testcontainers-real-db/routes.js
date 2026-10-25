/**
 * Module 04: Routes - Database operations
 */

const express = require('express');
const controller = require('./controller');
const router = express.Router();

// Middleware to attach pool (set by server.js)
router.use((req, res, next) => {
  controller.setPool(req.pool);
  next();
});

// ============ USER CRUD ============

router.post('/users', async (req, res) => {
  try {
    const user = await controller.createUser(req.body.name, req.body.email);
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await controller.getUserById(req.params.id);
    res.json(user);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await controller.getAllUsers();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const user = await controller.updateUser(req.params.id, req.body.name, req.body.email);
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await controller.deleteUser(req.params.id);
    res.json({ deleted: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ============ STATS ============

router.get('/stats/count', async (req, res) => {
  try {
    const count = await controller.userCount();
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/transfer', async (req, res) => {
  try {
    const result = await controller.transferData(req.body.fromId, req.body.toId);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;

