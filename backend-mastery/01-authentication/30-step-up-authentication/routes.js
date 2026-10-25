const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

/**
 * POST /stepup/initiate - Initiate step-up
 */
router.post('/initiate',
  middleware.validateRequest(schema.initiateSchema),
  controller.initiateStepUp
);

/**
 * POST /stepup/verify - Verify step-up credentials
 */
router.post('/verify',
  middleware.validateRequest(schema.verifySchema),
  controller.verifyStepUp
);

/**
 * GET /stepup/requires - Check if operation requires step-up
 */
router.get('/requires',
  controller.requiresStepUp
);

/**
 * POST /stepup/perform - Perform sensitive operation
 */
router.post('/perform',
  middleware.verifyStepUpToken,
  middleware.validateRequest(schema.performSchema),
  controller.performSensitiveOperation
);

/**
 * GET /stepup/recent - Get recent operations
 */
router.get('/recent',
  controller.getRecentOperations
);

module.exports = router;
