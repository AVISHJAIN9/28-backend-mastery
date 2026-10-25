const express = require('express');
const router = express.Router();
const c = require('./controller');
router.get('/info', c.getInfo);
router.get('/health', (req,res) => { res.json({ status: 'ok' }); });
module.exports = router;
