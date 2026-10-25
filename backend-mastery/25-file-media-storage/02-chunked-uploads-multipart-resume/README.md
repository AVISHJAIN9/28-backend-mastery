# Module 02: Chunked Uploads with Multipart Resume

**Backend Mastery | 25 File & Media Storage**

Production-ready implementation of chunked file uploads with multipart resume capability using AWS S3. Supports resumable uploads, progress tracking, and intelligent error recovery.

## What is this?

This module implements enterprise-grade chunked file uploads that break large files into 5MB chunks, upload them to AWS S3, and allow resuming interrupted uploads. It's the foundation for modern file-sharing services like Dropbox, Google Drive, and OneDrive.

## Why does it matter?

**Without chunked uploads:**
- 1GB file upload fails at 99% → Start over
- Large files consume all server memory
- Poor user experience with no progress indication
- Network timeouts on slow connections

**With chunked uploads:**
- Failed upload at 99% → Resume from 99% 
- Constant memory usage regardless of file size
- Real-time progress tracking every chunk
- Resilient to network interruptions

## How it works

### High-Level Flow

```
User selects 1GB file
        ↓
Browser splits into 200 × 5MB chunks
        ↓
Initiate multipart upload (returns uploadId)
        ↓
Upload chunks 1-200 sequentially or in parallel
        ↓
If network fails: Resume from last successful chunk
        ↓
Complete multipart upload (verify eTags)
        ↓
File assembled on S3, get presigned download URL
```

### Key Concepts

| Term | Meaning | Example |
|------|---------|---------|
| **uploadId** | Session identifier | `"ab12cd34ef56gh78"` |
| **Chunk** | Piece of file (5MB) | Byte range 0-5242880 |
| **Part Number** | Sequential chunk ID | 1, 2, 3... up to 10,000 |
| **ETag** | Hash of chunk data | `"a1b2c3d4e5f6g7h8"` |
| **Multipart Upload** | S3 operation combining parts | All chunks → single file |

## API Documentation

### 1. Initiate Upload
**POST** `/api/initiate`

Starts a new multipart upload session.

**Request Body:**
```json
{
  "filename": "large-video.mp4",
  "fileSize": 1073741824,
  "mimeType": "video/mp4",
  "metadata": {
    "userId": "user123",
    "description": "My vacation video"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "uploadId": "abc123def456ghi789",
  "key": "uploads/1705323600000-a1b2c3d4/large-video.mp4",
  "filename": "large-video.mp4",
  "fileSize": 1073741824,
  "chunkSize": 5242880,
  "totalChunks": 205,
  "expiresIn": "24 hours"
}
```

**Error (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "fileSize",
      "message": "File size exceeds maximum of 1073741824"
    }
  ]
}
```

---

### 2. Upload Chunk
**PUT** `/api/upload-chunk?uploadId=abc123def456ghi789&chunkNumber=1`

Upload a single 5MB chunk.

**Request Headers:**
```
Content-Type: application/octet-stream
Content-Length: 5242880
```

**Request Body:**
Binary chunk data (raw bytes, NOT JSON)

**Response (200):**
```json
{
  "success": true,
  "uploadId": "abc123def456ghi789",
  "chunkNumber": 1,
  "etag": "a1b2c3d4e5f6g7h8i9j0",
  "uploadedAt": "2024-01-15T10:30:15.000Z"
}
```

**Error (413):**
```json
{
  "error": "Chunk size exceeds maximum of 5242880 bytes",
  "received": 10485760,
  "max": 5242880
}
```

---

### 3. List Chunks
**GET** `/api/list-chunks?uploadId=abc123def456ghi789`

Get status of all uploaded chunks.

**Response (200):**
```json
{
  "success": true,
  "uploadId": "abc123def456ghi789",
  "chunks": [
    {
      "chunkNumber": 1,
      "etag": "a1b2c3d4e5f6g7h8",
      "uploadedAt": "2024-01-15T10:30:15.000Z"
    },
    {
      "chunkNumber": 2,
      "etag": "b2c3d4e5f6g7h8i9",
      "uploadedAt": "2024-01-15T10:30:25.000Z"
    }
  ],
  "totalChunksUploaded": 2,
  "expectedChunks": 205
}
```

---

### 4. Upload Status
**GET** `/api/upload-status/:uploadId`

Get overall progress of an upload.

**Response (200):**
```json
{
  "success": true,
  "uploadId": "abc123def456ghi789",
  "filename": "large-video.mp4",
  "fileSize": 1073741824,
  "status": "active",
  "uploadedChunks": [1, 2, 3, 4, 5],
  "totalChunks": 205,
  "uploadProgress": 2,
  "createdAt": "2024-01-15T10:25:00.000Z",
  "updatedAt": "2024-01-15T10:30:25.000Z"
}
```

---

### 5. Complete Upload
**POST** `/api/complete-upload`

Finalize the multipart upload and assemble all chunks.

**Request Body:**
```json
{
  "uploadId": "abc123def456ghi789",
  "chunks": [
    {"chunkNumber": 1, "etag": "a1b2c3d4e5f6g7h8"},
    {"chunkNumber": 2, "etag": "b2c3d4e5f6g7h8i9"},
    {"chunkNumber": 3, "etag": "c3d4e5f6g7h8i9j0"},
    {"chunkNumber": 4, "etag": "d4e5f6g7h8i9j0k1"},
    {"chunkNumber": 5, "etag": "e5f6g7h8i9j0k1l2"}
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "uploadId": "abc123def456ghi789",
  "filename": "large-video.mp4",
  "fileSize": 1073741824,
  "mimeType": "video/mp4",
  "key": "uploads/1705323600000-a1b2c3d4/large-video.mp4",
  "etag": "xyz789abc456def123-5",
  "location": "https://bucket.s3.amazonaws.com/uploads/.../large-video.mp4",
  "downloadUrl": "https://bucket.s3.amazonaws.com/...?X-Amz-Signature=...",
  "completedAt": "2024-01-15T10:45:30.000Z"
}
```

---

### 6. Abort Upload
**DELETE** `/api/abort-upload`

Cancel an in-progress upload and cleanup resources.

**Request Body:**
```json
{
  "uploadId": "abc123def456ghi789"
}
```

**Response (200):**
```json
{
  "success": true,
  "uploadId": "abc123def456ghi789",
  "message": "Upload canceled successfully"
}
```

---

## Key Concepts

### Resume Workflow

**Session 1: Upload interrupted**
```
Upload chunks 1-50 ✓
Chunk 51 in progress
→ Network disconnects
```

**Session 2: Resume from same browser**
```
Query /api/upload-status/{uploadId}
← Get: "uploadedChunks: [1-50]"
← Get: "expectedChunks: 200"
Start uploading chunk 51
```

### Error Handling

| Status | Error | Solution |
|--------|-------|----------|
| 404 | Upload ID not found | Restart upload (initiate new multipart) |
| 413 | Chunk too large | Split smaller or increase limit |
| 429 | Too many requests | Wait before retrying |
| 500 | Server error | Retry with exponential backoff |

### Validation Rules

```
✓ File size: 1 byte - 1GB
✓ Chunk size: max 5MB
✓ Max chunks: 10,000
✓ Chunk number: 1-10,000 sequentially
✓ Filename: max 255 characters
✓ MIME type: valid format (e.g., "video/mp4")
```

## Configuration

### Environment Variables

```env
# Server
HTTP_PORT=6602
NODE_ENV=development

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket

# Upload Configuration
CHUNK_SIZE_BYTES=5242880        # 5MB default
MAX_FILE_SIZE_BYTES=1073741824  # 1GB default
MAX_CHUNKS=10000
REQUEST_TIMEOUT_MS=300000       # 5 minutes

# Multipart Upload Cleanup
AUTO_ABORT_DAYS=7
AUTO_CLEANUP_ENABLED=true

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:6602
```

## Installation & Setup

See [setup.md](./setup.md) for complete step-by-step instructions.

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with AWS credentials

# 3. Start server
npm run dev

# 4. Test API
curl -X GET http://localhost:6602/health
```

## Testing

### Using React UI

Open browser to `http://localhost:6602` (see App.jsx)

Features:
- File selection with size validation
- Real-time progress bar
- Chunk-by-chunk upload status
- Resume interrupted uploads
- Error recovery
- Download completed file

### Using cURL

**1. Initiate upload:**
```bash
curl -X POST http://localhost:6602/api/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.mp4",
    "fileSize": 10485760,
    "mimeType": "video/mp4"
  }'
```

**2. Upload chunk:**
```bash
curl -X PUT "http://localhost:6602/api/upload-chunk?uploadId=abc123&chunkNumber=1" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @chunk.bin
```

**3. Complete upload:**
```bash
curl -X POST http://localhost:6602/api/complete-upload \
  -H "Content-Type: application/json" \
  -d '{
    "uploadId": "abc123",
    "chunks": [
      {"chunkNumber": 1, "etag": "etag1"},
      {"chunkNumber": 2, "etag": "etag2"}
    ]
  }'
```

## Performance Metrics

### Typical Performance

```
File Size: 1GB (1,073,741,824 bytes)
Chunk Size: 5MB (5,242,880 bytes)
Total Chunks: 205

Network Speed: 50 Mbps
Time per chunk: ~0.8 seconds
Sequential upload: ~165 seconds

With 4 parallel uploads:
Effective time: ~165 seconds (concurrent uploads still bound by network)
Request overhead reduction: 4x (50 vs 200 requests)
```

### Memory Usage

- Server metadata per upload: ~500 bytes
- 10,000 concurrent uploads: ~5MB
- Per-chunk processing: ~5MB (chunk buffer)
- Total: Very scalable

## Security Considerations

### Best Practices Implemented

✓ HTTPS only (enforced in production)
✓ CORS validation
✓ Rate limiting on initiation
✓ Content-type validation
✓ File size limits
✓ MIME type validation
✓ ETag verification
✓ Request timeout handling
✓ SQL injection prevention (using prepared statements)
✓ Proper error messages (no stack traces to client)

### Additional Recommendations

- Implement authentication/authorization
- Scan uploads for malware (ClamAV)
- Encrypt sensitive uploads at rest
- Validate file headers (magic bytes)
- Implement virus scanning
- Add rate limiting per user/IP
- Monitor upload patterns for anomalies

## File Structure

```
02-chunked-uploads-multipart-resume/
├── server.js           # Express server
├── routes.js           # API routes
├── controller.js       # Business logic
├── middleware.js       # Error handling, logging
├── schema.js           # Joi validation schemas
├── logger.js           # Logging utility
├── package.json        # Dependencies
├── .env.example        # Environment template
├── theory.md           # Comprehensive theory (3500+ words)
├── README.md           # This file
├── setup.md            # Step-by-step setup
├── App.jsx             # React testing UI
└── checklist.md        # Learning checklist
```

## Common Issues

### "NoSuchUpload" error
**Problem:** Upload ID expired or invalid
**Solution:** Initiate new upload

### "EntityTooSmall" error
**Problem:** Chunk size < 5MB (except last chunk)
**Solution:** Use standard 5MB chunks

### "The ETag does not match" error
**Problem:** Chunk data corrupted in transit
**Solution:** Retry chunk upload

### Connection timeout
**Problem:** Chunk upload takes >300 seconds
**Solution:** Use smaller chunks or increase timeout

## Learning Objectives

After completing this module, you should understand:

- ✓ How multipart uploads work at AWS S3 level
- ✓ Chunking strategies and optimal sizes
- ✓ Resume capability implementation
- ✓ Error handling and recovery
- ✓ Progress tracking and UX
- ✓ Performance optimization
- ✓ Security best practices
- ✓ Real-world production patterns

## Related Modules

- **Module 01:** S3 Object Storage & Presigned URLs
- **Module 03:** CDN Integration with CloudFront
- **Module 04:** Image Processing with Sharp
- **Module 05:** Video Transcoding with FFmpeg

## References

- [AWS S3 Multipart Upload API](https://docs.aws.amazon.com/AmazonS3/latest/dev/mpuoverview.html)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v2/)
- [RFC 7233 - HTTP Range Requests](https://tools.ietf.org/html/rfc7233)
- [MDN - Resumable Uploads](https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy)

---

**Backend Mastery | 25 File Media Storage | Module 02**

*Production-ready code. Enterprise patterns. Real-world solutions.*

