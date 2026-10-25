const crypto = require('crypto');

const MAGIC_BYTES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46],
  pdf: [0x25, 0x50, 0x44, 0x46],
  zip: [0x50, 0x4b, 0x03, 0x04],
  mp4: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]
};

const validateFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    
    const buffer = req.file.buffer;
    let detectedType = 'unknown';
    
    for (const [type, magicBytes] of Object.entries(MAGIC_BYTES)) {
      const matches = magicBytes.every((byte, i) => buffer[i] === byte);
      if (matches) {
        detectedType = type;
        break;
      }
    }
    
    res.json({
      success: true,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      detectedType: detectedType,
      size: req.file.size,
      isValid: detectedType !== 'unknown'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const healthCheck = (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: '08 File Validation',
    supportedFormats: Object.keys(MAGIC_BYTES)
  });
};

module.exports = { validateFile, healthCheck };
