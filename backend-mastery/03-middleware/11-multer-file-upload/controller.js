const multer = require('multer');
const path = require('path');

class FileUploadController {
  static getConfig(req, res) {
    res.json({
      maxFileSize: '10mb',
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      destination: './uploads',
      features: ['Progress tracking', 'Multiple files', 'Validation']
    });
  }

  static handleUpload(req, res) {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    res.json({
      file: {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      },
      message: 'File uploaded successfully'
    });
  }
}

module.exports = FileUploadController;
