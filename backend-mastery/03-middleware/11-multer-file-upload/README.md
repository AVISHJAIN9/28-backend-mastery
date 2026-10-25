# Multer File Upload Middleware

## What is this?
Multer is multipart/form-data parsing middleware for handling file uploads with validation, size limits, and storage configuration.

## Why does it matter?
- **File Handling**: Parse file uploads correctly
- **Validation**: Check file type and size before processing
- **Security**: Prevent malicious file uploads
- **Storage Control**: Choose where files are saved
- **Progress Tracking**: Monitor upload progress
- **Error Handling**: Handle upload errors gracefully

## How it works (step by step)
1. Client sends multipart/form-data request with file
2. Multer middleware intercepts request
3. File size checked against limit
4. MIME type validated
5. File written to storage
6. File metadata attached to req.file
7. Route handler receives file info
8. Handler processes uploaded file

## Key concepts
- **Multipart/form-data**: Format for file uploads
- **Destination**: Where uploaded files are stored
- **Filename**: How uploaded files are named
- **File Filter**: Function to validate file types
- **Limits**: Max file size, max number of files
- **Fields vs Files**: Text fields vs binary files

## Common mistakes
- Not validating file types (accept any file)
- Setting limit too high (DOS risk)
- Saving files with original names (collision)
- Not creating upload directory
- Storing files on non-persistent storage
- Not handling upload failures

## Real world usage
```javascript
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');  // Save to uploads folder
  },
  filename: (req, file, cb) => {
    // Rename file to avoid collisions
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File filter (validate types)
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

// Create upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB
  fileFilter: fileFilter
});

// Use on route
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ file: req.file });  // Contains filename, size, path
});
```
