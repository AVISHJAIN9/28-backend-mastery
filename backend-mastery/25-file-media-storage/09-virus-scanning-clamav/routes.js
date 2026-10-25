const express = require('express');
const multer = require('multer');
const controller = require('./controller');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/scan', upload.single('file'), controller.scanFile);
router.post('/quick-scan', upload.single('file'), controller.quickScan);
router.get('/health', controller.healthCheck);

module.exports = router;
