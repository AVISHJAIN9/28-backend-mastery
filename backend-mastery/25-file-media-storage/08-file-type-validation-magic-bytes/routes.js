const express = require('express');
const multer = require('multer');
const controller = require('./controller');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/validate', upload.single('file'), controller.validateFile);
router.get('/health', controller.healthCheck);

module.exports = router;
