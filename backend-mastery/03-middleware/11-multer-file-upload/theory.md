# Theory & Concepts
## Multer File Upload Overview
Multer parses multipart/form-data (used for file uploads), extracts files, validates them, and saves to storage.

## Multipart Encoding
- Standard forms use: application/x-www-form-urlencoded
- File forms use: multipart/form-data with boundaries
- Boundaries separate different parts (files and fields)
- Each part has headers and content

## Upload Flow
1. Form submitted with file
2. Browser encodes as multipart/form-data
3. Multer receives request
4. Parses boundaries to separate parts
5. Validates: file type, size, count
6. Saves to storage (disk/cloud)
7. Metadata attached to req.file
8. Route handler uses req.file

## req.file Object
```
fieldname: 'avatar'          // Form field name
originalname: 'photo.jpg'    // Original filename
mimetype: 'image/jpeg'       // MIME type
size: 12345                  // Bytes
destination: './uploads/'    // Where saved
filename: '1629876543.jpg'   // Saved filename
path: './uploads/1629876543.jpg'  // Full path
```

## Validation
- **File Type**: Whitelist allowed MIME types
- **File Size**: Max 10MB, 100MB, etc
- **File Count**: Max 5 files per request

## Filename Collision Prevention
- Rename using timestamp or UUID
- Include hash in filename
- Store in user-specific directories

## Storage Options
- **Disk**: Local file system
- **Memory**: RAM (for small files)
- **Cloud**: AWS S3, Google Cloud Storage, Azure

## Error Handling
- File too large: 413 Payload Too Large
- Invalid type: 400 Bad Request
- Disk full: 507 Insufficient Storage
