const express = require('express');
const { getInfo, getTest, testGrep, testAwk, testCurl } = require('./controller');
const router = express.Router();

// Info endpoint
router.get('/info', getInfo);

// Test endpoint
router.get('/test', getTest);

// grep testing endpoint
router.get('/grep', testGrep);

// awk testing endpoint  
router.get('/awk', testAwk);

// curl simulation endpoint
router.get('/curl', testCurl);

module.exports = router;