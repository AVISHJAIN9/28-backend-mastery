const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');
const schema = require('./schema');

const router = express.Router();

/**
 * Public routes (certificate verification only, no session token needed)
 */

/**
 * POST /mtls/register - Register a client certificate
 * Requires: mTLS connection with valid client certificate
 */
router.post('/register',
  middleware.mtlsAuth,
  middleware.validateCertificateExpiration,
  middleware.validateRequest(schema.registerCertificateSchema),
  middleware.logCertificateAccess,
  controller.registerClientCertificate
);

/**
 * POST /mtls/authenticate - Authenticate with certificate and get session token
 * Requires: mTLS connection with registered client certificate
 */
router.post('/authenticate',
  middleware.mtlsAuth,
  middleware.validateCertificateExpiration,
  middleware.logCertificateAccess,
  controller.authenticateCertificate
);

/**
 * POST /mtls/validate-chain - Validate certificate chain
 * Requires: mTLS connection
 */
router.post('/validate-chain',
  middleware.mtlsAuth,
  controller.validateCertificateChain
);

/**
 * Protected routes (session token required)
 */

/**
 * POST /mtls/verify-token - Verify session token validity
 * Requires: x-session-token header
 */
router.post('/verify-token',
  middleware.validateRequest(schema.verifyTokenSchema),
  controller.verifySessionToken
);

/**
 * GET /mtls/client-info - Get current authenticated client info
 * Requires: mTLS connection with registered certificate
 */
router.get('/client-info',
  middleware.mtlsAuth,
  controller.getClientInfo
);

/**
 * GET /mtls/list - List all registered certificates
 * Requires: mTLS connection
 */
router.get('/list',
  middleware.mtlsAuth,
  controller.listCertificates
);

/**
 * POST /mtls/revoke - Revoke a certificate
 * Requires: mTLS connection and thumbprint in body
 */
router.post('/revoke',
  middleware.mtlsAuth,
  middleware.validateRequest(schema.revokeCertificateSchema),
  controller.revokeCertificate
);

module.exports = router;
