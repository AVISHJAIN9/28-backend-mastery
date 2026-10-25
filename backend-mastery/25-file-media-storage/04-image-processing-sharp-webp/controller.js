/**
 * Controller - Module 04: Image Processing with Sharp & WebP
 */

const sharp = require('sharp');

const resizeImage = async (req, res) => {
  try {
    const { width, height, fit, format } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const resized = await sharp(req.file.buffer)
      .resize(parseInt(width), parseInt(height), { fit: fit || 'cover' })
      .toFormat(format || 'webp', { quality: 80 })
      .toBuffer();

    res.json({
      success: true,
      originalSize: req.file.size,
      resizedSize: resized.length,
      saved: req.file.size - resized.length,
      format: format || 'webp',
      dimensions: { width, height }
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
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const convertFormat = async (req, res) => {
  try {
    const { newFormat, quality } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image provided' });
    const converted = await sharp(req.file.buffer)
      .toFormat(newFormat, { quality: parseInt(quality) || 80 })
      .toBuffer();
    res.json({
      success: true,
      originalFormat: req.file.mimetype,
      newFormat: newFormat,
      originalSize: req.file.size,
      newSize: converted.length,
      compressed: ((1 - converted.length / req.file.size) * 100).toFixed(1) + '%'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const healthCheck = (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: '04 Image Processing Sharp WebP',
    capabilities: ['resize', 'convert', 'metadata']
  });
};

module.exports = { resizeImage, extractMetadata, convertFormat, healthCheck };
