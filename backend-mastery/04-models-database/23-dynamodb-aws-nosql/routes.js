const express = require('express');
const Controller = require('./controller');
const router = express.Router();

router.post('/items', (req, res) => Controller.create(req, res));
router.get('/items/:id', (req, res) => Controller.read(req, res));
router.get('/items', (req, res) => Controller.list(req, res));
router.put('/items/:id', (req, res) => Controller.update(req, res));
router.delete('/items/:id', (req, res) => Controller.delete(req, res));

module.exports = router;