# File Upload Controller - Theory

## Multipart Form Data Format

```
POST /api/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="image.jpg"
Content-Type: image/jpeg

[Binary image data...]
------WebKitFormBoundary
Content-Disposition: form-data; name="description"

My profile picture
------WebKitFormBoundary--
```

## File Validation Pipeline

```javascript
const validateFile = (file) => {
  // 1. Check file exists
  if (!file) throw new Error('No file provided');
  
  // 2. Validate file type
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }
  
  // 3. Validate file size
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    throw new Error('File too large');
  }
  
  // 4. Scan for malware (optional)
  await scanForVirus(file);
  
  // 5. Check file signature (magic bytes)
  const signature = await checkFileSignature(file);
  if (!isValidSignature(signature)) {
    throw new Error('File corrupted or invalid');
  }
  
  return true;
};
```

## Secure Storage Strategies

### 1. Local Disk (Simple)
```javascript
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    // Use UUID to prevent path traversal
    const filename = `${uuid()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});
```

### 2. Cloud Storage (S3)
```javascript
const uploadToS3 = async (file) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: `uploads/${uuid()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private' // Restrict access
  };
  
  await s3.upload(params).promise();
  return params.Key; // Return for database storage
};
```

## Progress Tracking

```javascript
app.post('/api/upload', (req, res) => {
  const upload = multer().single('file');
  
  req.on('data', (chunk) => {
    const percent = (req.socket.bytesRead / req.headers['content-length']) * 100;
    res.write(`data: ${JSON.stringify({ progress: percent })}\n\n`);
  });
  
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    // Process file
  });
});
```

## Error Handling

| Error | Status | Cause |
|-------|--------|-------|
| No file uploaded | 400 | Missing multipart field |
| File too large | 413 | Exceeds size limit |
| Invalid type | 415 | Unsupported MIME type |
| Disk full | 507 | Storage exhausted |
| Malware detected | 451 | Blocked by security scan |
