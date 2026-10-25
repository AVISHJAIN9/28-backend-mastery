const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.get('/users', (req, res) => res.json(controller.getAllUsers()));
router.get('/users/:id', (req, res) => {
  const user = controller.getUser(req.params.id);
  res.json(user || { error: 'Not found' });
});
router.post('/users', (req, res) => res.json(controller.createUser(req.body)));
router.delete('/users/:id', (req, res) => res.json(controller.deleteUser(req.params.id)));

module.exports = router;

