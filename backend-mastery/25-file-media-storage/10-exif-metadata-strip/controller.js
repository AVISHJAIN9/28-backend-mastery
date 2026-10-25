const sharp = require('sharp');

const removeExifData = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });
    
    // Remove EXIF data using sharp
    const cleaned = await sharp(req.file.buffer)
      .withMetadata(false) // Remove all metadata
      .toBuffer();
    
    res.json({
      success: true,
      fileName: req.file.originalname,
      originalSize: req.file.size,
      cleanedSize: cleaned.length,
      removed: req.file.size - cleaned.length,
      message: 'EXIF data removed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const extractMetadata = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });
    
    const metadata = await sharp(req.file.buffer).metadata();
    
    res.json({
      success: true,
      fileName: req.file.originalname,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        density: metadata.density,
        chromaSubsampling: metadata.chromaSubsampling,
        isProgressive: metadata.isProgressive,
        exif: metadata.exif || 'No EXIF data'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const healthCheck = (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: '10 EXIF Metadata Strip',
    capabilities: ['extract', 'remove']
  });
};

module.exports = { removeExifData, extractMetadata, healthCheck };
