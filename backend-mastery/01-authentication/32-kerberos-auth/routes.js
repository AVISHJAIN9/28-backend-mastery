import express from 'express';
import controller from './controller.js';
import middleware from './middleware.js';
import schema from './schema.js';

const router = express.Router();

// Step 1: Request TGT
router.post('/request-tgt',
  middleware.validateRequest(schema.requestTGTSchema),
  controller.requestTGT
);

// Step 2: Request Service Ticket
router.post('/request-service-ticket',
  middleware.validateRequest(schema.requestServiceTicketSchema),
  controller.requestServiceTicket
);

// Step 3: Authenticate with Service
router.post('/authenticate-service',
  middleware.validateRequest(schema.authenticateServiceSchema),
  controller.authenticateWithService
);

// Get session info
router.get('/session/:sessionId',
  controller.getSessionInfo
);

// Logout
router.post('/logout',
  middleware.validateRequest(schema.logoutSchema),
  controller.logout
);

export default router;
