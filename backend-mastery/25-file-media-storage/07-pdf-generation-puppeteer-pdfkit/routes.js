const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.post('/pdf/template', controller.generatePdfFromTemplate);
router.post('/pdf/invoice', controller.generateInvoice);
router.get('/health', controller.healthCheck);

module.exports = router;
