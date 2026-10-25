const express = require('express');
const Controller = require('./controller');
const router = express.Router();

router.post('/users', (req, res) => Controller.createUser(req, res));
router.get('/users', (req, res) => Controller.listUsers(req, res));
router.get('/users/:id', (req, res) => Controller.getUser(req, res));
router.put('/users/:id', (req, res) => Controller.updateUser(req, res));
router.delete('/users/:id', (req, res) => Controller.deleteUser(req, res));

module.exports = router;