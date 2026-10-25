const { v4: uuidv4 } = require('uuid');

const transcriptions = new Map();

exports.transcribeAudio = (req, res) => {
  const { audioUrl, language } = req.validatedBody;
  const opId = uuidv4();
  
  // Mock transcription
  const mockText = 'This is a transcribed audio sample from Google Speech-to-Text API';
  
  transcriptions.set(opId, {
    id: opId,
    audioUrl,
    language,
    text: mockText,
    confidence: 0.95,
    duration: 5.2,
    createdAt: new Date(),
  });
  
  res.json({
    success: true,
    operationId: opId,
    text: mockText,
    language,
    confidence: 0.95,
  });
};

exports.synthesizeSpeech = (req, res) => {
  const { text, language, voice, audioFormat } = req.validatedBody;
  const opId = uuidv4();
  
  res.json({
    success: true,
    operationId: opId,
    audioUrl: `https://storage.googleapis.com/cloud-samples-data/speech/brooklyn_bridge.mp3?id=${opId}`,
    text,
    language,
    voice,
    format: audioFormat,
    size: Math.floor(text.length * 50),
  });
};

exports.listVoices = (req, res) => {
  const voices = [
    { id: 'en-US-Neural2-A', name: 'en-US-Neural2-A', language: 'en-US', gender: 'female' },
    { id: 'en-US-Neural2-C', name: 'en-US-Neural2-C', language: 'en-US', gender: 'female' },
    { id: 'en-US-Neural2-E', name: 'en-US-Neural2-E', language: 'en-US', gender: 'male' },
    { id: 'en-US-Neural2-F', name: 'en-US-Neural2-F', language: 'en-US', gender: 'female' },
  ];
  
  res.json({
    success: true,
    voices: voices.filter(v => !req.query.language || v.language === req.query.language),
    total: voices.length,
  });
};

module.exports = {
  transcribeAudio,
  synthesizeSpeech,
  listVoices,
};
