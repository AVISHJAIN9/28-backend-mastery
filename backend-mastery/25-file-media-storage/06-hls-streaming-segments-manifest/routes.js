const express = require('express');
const controller = require('./controller');
const router = express.Router();

router.post('/streams', controller.createStream);
router.get('/streams/:streamId/playlist.m3u8', controller.getPlaylist);
router.post('/streams/:streamId/segment', controller.addSegment);
router.get('/health', controller.healthCheck);

module.exports = router;
