const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

router.post('/send-link',
  middleware.rateLimit(5),
  middleware.validateRequest(schema.sendLinkSchema),
  controller.sendMagicLink
);

router.post('/verify/:token',
  middleware.validateRequest(schema.verifyTokenSchema),
  controller.verifyMagicLink
);

router.post('/register',
  middleware.validateRequest(schema.registerSchema),
  controller.register
);

router.get('/me',
  middleware.authenticate,
  controller.getCurrentUser
);

router.post('/logout',
  middleware.authenticate,
  controller.logout
);

module.exports = router;

