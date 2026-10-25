const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { validateRequest } = require('./middleware');
const { transcribeSchema, synthesizeSpeechSchema } = require('./schema');

router.post('/transcribe', validateRequest(transcribeSchema), ctrl.transcribeAudio);
router.post('/synthesize', validateRequest(synthesizeSpeechSchema), ctrl.synthesizeSpeech);
router.get('/voices', ctrl.listVoices);

module.exports = router;
