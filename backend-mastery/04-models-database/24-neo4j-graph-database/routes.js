const express = require('express');
const Controller = require('./controller');
const router = express.Router();

router.post('/nodes', (req, res) => Controller.create(req, res));
router.get('/nodes/:id', (req, res) => Controller.read(req, res));
router.post('/relationships', (req, res) => Controller.createRelationship(req, res));

module.exports = router;