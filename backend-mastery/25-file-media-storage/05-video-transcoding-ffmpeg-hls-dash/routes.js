const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.post('/transcode', controller.transcodeVideo);
router.get('/status/:transcodeId', controller.getTranscodeStatus);
router.get('/manifest/:streamId', controller.generateManifest);
router.get('/health', controller.healthCheck);

module.exports = router;
