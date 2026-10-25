const express = require('express');
const Controller = require('./controller');
const { asyncHandler } = require('./middleware');

const router = express.Router();

router.get('/data', asyncHandler((req, res) => Controller.fetchData(req, res)));
router.get('/error', asyncHandler((req, res) => Controller.simulateError(req, res)));

module.exports = router;
