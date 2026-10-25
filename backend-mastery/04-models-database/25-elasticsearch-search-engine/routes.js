const express = require('express');
const Controller = require('./controller');
const router = express.Router();

router.post('/search', (req, res) => Controller.search(req, res));
router.post('/index', (req, res) => Controller.indexDocument(req, res));
router.get('/aggregations', (req, res) => Controller.getAggregations(req, res));

module.exports = router;