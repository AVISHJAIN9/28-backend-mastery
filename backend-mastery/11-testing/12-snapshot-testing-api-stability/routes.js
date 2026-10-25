const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.get('/users/:id', (req, res) => {
  const user = controller.getUser(req.params.id);
  res.json(user);
});
router.get('/users', (req, res) => res.json(controller.getAllUsers()));
router.get('/users-meta', (req, res) => res.json(controller.getUsersWithMetadata()));
router.post('/users', (req, res) => res.status(201).json(controller.createUser(req.body)));
router.get('/version', (req, res) => res.json(controller.getApiVersion()));

module.exports = router;

