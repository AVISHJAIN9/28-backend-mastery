const express = require('express');
const Controller = require('./controller');

const router = express.Router();

router.get('/trace', (req, res) => Controller.getTraceId(req, res));

module.exports = router;
