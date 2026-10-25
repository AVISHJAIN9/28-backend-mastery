const express = require('express');
const Controller = require('./controller');
const { versionMiddleware } = require('./middleware');

const router = express.Router();

router.get('/:version', versionMiddleware, (req, res) => Controller.getVersion(req, res));

module.exports = router;
