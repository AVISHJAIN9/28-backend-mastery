const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

router.post('/auth',
  middleware.validateRequest(schema.authSchema),
  controller.authenticate
);

router.get('/me',
  middleware.verifyToken,
  controller.getCurrentUser
);

router.post('/logout',
  middleware.verifyToken,
  controller.logout
);

module.exports = router;
