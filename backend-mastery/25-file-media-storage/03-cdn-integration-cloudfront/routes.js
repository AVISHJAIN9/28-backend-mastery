/**
 * Routes - Module 03: CDN CloudFront
 */

const express = require('express');
const controller = require('./controller');
const { validateContentType } = require('./middleware');

const router = express.Router();

router.get('/health', controller.healthCheck);
router.post('/distribution', validateContentType, controller.createDistribution);
router.get('/distribution/config', controller.getDistributionConfig);
router.post('/invalidate', validateContentType, controller.invalidateCache);
router.get('/invalidation/:invalidationId', controller.getInvalidationStatus);
router.post('/cdn-url', validateContentType, controller.generateCdnUrl);

module.exports = router;
