const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { validateRequest } = require('./middleware');
const { eventSchema, userSchema, featureFlagSchema, cohortSchema } = require('./schema');

router.post('/capture', validateRequest(eventSchema), ctrl.captureEvent);
router.post('/identify', validateRequest(userSchema), ctrl.identifyUser);
router.post('/feature-flags', validateRequest(featureFlagSchema), ctrl.getFeatureFlag);
router.post('/cohorts', validateRequest(cohortSchema), ctrl.createCohort);
router.get('/analytics', ctrl.getAnalytics);

module.exports = router;
