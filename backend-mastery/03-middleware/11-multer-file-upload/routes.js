const express = require('express');
const Controller = require('./controller');
const { upload } = require('./middleware');

const router = express.Router();

router.get('/config', (req, res) => Controller.getConfig(req, res));
router.post('/upload', upload.single('file'), (req, res) => Controller.handleUpload(req, res));

module.exports = router;
