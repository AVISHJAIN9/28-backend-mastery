const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { validateRequest, verifyDomain } = require('./middleware');
const { domainSchema, dnsCheckSchema } = require('./schema');

router.post('/domain/register', validateRequest(domainSchema), ctrl.registerDomain);
router.get('/spf/:domain', verifyDomain, ctrl.getSPFRecord);
router.get('/dkim/:domain/:selector', ctrl.getDKIMRecord);
router.get('/dmarc/:domain', ctrl.getDMARCRecord);
router.post('/verify', validateRequest(dnsCheckSchema), ctrl.verifyDNS);
router.get('/status/:domain', ctrl.getStatus);

module.exports = router;
