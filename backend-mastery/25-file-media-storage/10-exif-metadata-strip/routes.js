const express = require('express');
const multer = require('multer');
const controller = require('./controller');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/strip-exif', upload.single('file'), controller.removeExifData);
router.post('/extract-metadata', upload.single('file'), controller.extractMetadata);
router.get('/health', controller.healthCheck);

module.exports = router;
