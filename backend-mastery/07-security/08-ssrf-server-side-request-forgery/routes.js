/**
 * Routes - API Endpoint Definitions
 */

const express = require('express');
const controller = require('./controller');
const { verifyToken, isAdmin } = require('./middleware');

const router = express.Router();

// Health check
router.get('/health', controller.getHealth);

// Demo
router.get('/demo', controller.getDemo);

module.exports = router;
