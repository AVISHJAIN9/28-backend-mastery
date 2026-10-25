const express = require('express');
const { getInfo, getTest, hashBcrypt, verifyBcrypt, hashSHA256, hashMD5, compare } = require('./controller');
const router = express.Router();

// Info endpoint
router.get('/info', getInfo);

// Test endpoint
router.get('/test', getTest);

// Bcrypt endpoints
router.get('/hash/bcrypt', hashBcrypt);
router.get('/verify/bcrypt', verifyBcrypt);

// Other hash endpoints
router.get('/hash/sha256', hashSHA256);
router.get('/hash/md5', hashMD5);

// Comparison endpoint
router.get('/compare', compare);

module.exports = router;