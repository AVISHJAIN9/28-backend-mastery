const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

router.post('/register/start',
  middleware.validateRequest(schema.startRegistrationSchema),
  controller.startRegistration
);

router.post('/register/complete',
  middleware.validateRequest(schema.completeRegistrationSchema),
  controller.completeRegistration
);

router.post('/authenticate/start',
  middleware.validateRequest(schema.startAuthSchema),
  controller.startAuthentication
);

router.post('/authenticate/complete',
  middleware.validateRequest(schema.completeAuthSchema),
  controller.completeAuthentication
);

router.get('/credentials',
  middleware.authenticate,
  controller.getCredentials
);

router.delete('/credentials/:credentialId',
  middleware.authenticate,
  controller.deleteCredential
);

module.exports = router;

