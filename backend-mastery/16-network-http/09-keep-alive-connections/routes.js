const express = require('express');
const router = express.Router();
const controller = require('./controller');
router.get('/info', controller.getInfo);
router.get('/test', controller.getTest);
module.exports = router;

