const express = require('express');
const {
  getSecurityHeaders,
  checkHeader,
  xssDemo,
  clickjackingDemo,
} = require('./controller');

const router = express.Router();

// ==================== Security Headers Routes ====================

// Get all configured security headers
router.get('/headers', getSecurityHeaders);

// Check a specific header
router.get('/headers/check', checkHeader);

// XSS prevention demo
router.get('/xss-demo', xssDemo);

// Clickjacking prevention demo
router.get('/clickjacking-demo', clickjackingDemo);

module.exports = router;
