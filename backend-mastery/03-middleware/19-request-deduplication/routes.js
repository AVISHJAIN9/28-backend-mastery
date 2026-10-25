const express = require('express');
const DeduplicationController = require('./controller');
const { deduplicationMiddleware } = require('./middleware');

const router = express.Router();

router.post('/process', deduplicationMiddleware, (req, res) => DeduplicationController.handleRequest(req, res));

module.exports = router;
