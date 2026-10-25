# Chunked Uploads with Multipart Resume: Theory & Concepts

## Table of Contents
1. [Introduction](#introduction)
2. [Why Chunked Uploads?](#why-chunked-uploads)
3. [Multipart Upload Architecture](#multipart-upload-architecture)
4. [Chunking Strategy](#chunking-strategy)
5. [Resume Capability](#resume-capability)
6. [Error Handling & Recovery](#error-handling--recovery)
7. [Performance Considerations](#performance-considerations)
8. [Real-World Examples](#real-world-examples)
9. [Security & Best Practices](#security--best-practices)

---

## Introduction

Chunked uploads, also known as multipart uploads, represent a sophisticated approach to handling large file transfers over the internet. Instead of uploading an entire file as a single request, the file is divided into smaller chunks that are uploaded sequentially or in parallel. This technique is fundamental to modern file-sharing platforms, cloud storage services, and media platforms.

**Key Benefits:**
- **Resume capability**: If a connection fails, only the failed chunk needs to be re-uploaded
- **Better resource management**: Smaller chunks consume less memory
- **Progress tracking**: Real-time feedback on upload progress
- **Parallel uploads**: Multiple chunks can be uploaded simultaneously
- **Reliability**: Automatic retries for individual chunks

---

## Why Chunked Uploads?

### Problem: Single-Request Uploads

Traditional file uploads send the entire file in a single HTTP request:

```
Client → [Large File] → Server
         (One Request)
```

**Limitations:**
1. **Memory constraints**: Loading entire files into memory is impractical for large files
2. **Network reliability**: Long requests are prone to timeouts and failures
3. **Poor UX**: No progress indication for large uploads
4. **Retry inefficiency**: If upload fails at 99%, entire file must restart

### Example: Uploading a 1GB File

Without chunking:
```
Request begins at 0:00
Upload 500MB      → Success
Upload 999MB      → Network failure!
ENTIRE upload fails → Start over from 0%
```

With chunking (5MB chunks):
```
Chunk 1-199 success → 995MB uploaded ✓
Chunk 200   fails   → Network error
Resume from chunk 200 → Re-upload only 5MB
Total successful ✓
```

---

## Multipart Upload Architecture

### AWS S3 Multipart Upload Flow

AWS S3 provides a robust multipart upload API that's the industry standard:

```
┌─────────────────────────────────────────────────────────────┐
│                    MULTIPART UPLOAD FLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CLIENT initiates upload                                 │
│     ↓                                                        │
│     POST /api/initiate                                      │
│     Response: uploadId = "abc123xyz"                        │
│     ↓                                                        │
│  2. CLIENT uploads chunks in sequence or parallel           │
│     ↓                                                        │
│     PUT /api/upload-chunk?uploadId=abc123xyz&chunkN=1      │
│     Body: Binary chunk data (5MB)                           │
│     Response: etag = "e1a2b3c4d5e6f7g8h9i0"                │
│     ↓                                                        │
│     PUT /api/upload-chunk?uploadId=abc123xyz&chunkN=2      │
│     [Repeat for all chunks]                                 │
│     ↓                                                        │
│  3. CLIENT completes upload with all eTags                  │
│     ↓                                                        │
│     POST /api/complete-upload                              │
│     Body: {                                                 │
│       uploadId: "abc123xyz",                               │
│       chunks: [                                             │
│         {chunkNumber: 1, etag: "e1a2b3c4..."},            │
│         {chunkNumber: 2, etag: "f5g6h7i8..."}             │
│       ]                                                     │
│     }                                                       │
│     ↓                                                        │
│     Response: location = "s3://bucket/file.pdf"            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Concepts

#### uploadId
- Unique identifier for a multipart upload session
- Returned when initiating upload
- Required for all subsequent operations
- Expires after 7 days (configurable)

#### ETag (Entity Tag)
- Cryptographic hash of chunk data
- Provided by S3 when chunk is uploaded
- Used to verify chunk integrity
- Required when completing upload

#### Part Number
- Sequential number assigned to each chunk (1-10,000)
- Must be in order when completing upload
- S3 reassembles file using part numbers

---

## Chunking Strategy

### Chunk Size Selection

**Standard: 5MB per chunk**

```
File Size          | Recommended Chunk Size | Total Chunks
────────────────────────────────────────────────────────────
1MB                | 1MB                    | 1
10MB               | 1MB                    | 10
100MB              | 5MB                    | 20
1GB                | 5MB                    | 200
10GB               | 5MB                    | 2,000
100GB              | 100MB                  | 1,000
```

**Why 5MB?**
- AWS S3 minimum: 5MB per part (except last)
- Optimal for most networks (1-100 Mbps)
- Reasonable memory footprint
- Balance between overhead and resilience

### Client-Side Chunking Example

```javascript
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

function* generateChunks(file) {
  let offset = 0;
  
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    yield chunk;
    offset += CHUNK_SIZE;
  }
}

const chunks = Array.from(generateChunks(file));
console.log(`File will be split into ${chunks.length} chunks`);
```

### Sequential vs Parallel Upload

**Sequential (Safer)**
```javascript
for (let i = 0; i < chunks.length; i++) {
  const etag = await uploadChunk(uploadId, i, chunks[i]);
  uploadedChunks[i] = etag;
  updateProgressBar((i + 1) / chunks.length);
}
```

**Parallel (Faster, 3-4 concurrent)**
```javascript
const MAX_CONCURRENT = 3;
const chunks = [...];
const etags = new Map();

async function uploadParallel() {
  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT) {
    const batch = chunks.slice(i, i + MAX_CONCURRENT);
    const promises = batch.map((chunk, idx) => 
      uploadChunk(uploadId, i + idx, chunk)
        .then(etag => etags.set(i + idx, etag))
    );
    await Promise.all(promises);
  }
}
```

---

## Resume Capability

### The Core Idea

If upload is interrupted, query server for which chunks were already uploaded, then continue from there:

```
Session 1: Upload chunks 1-150
  ↓
CONNECTION LOST
  ↓
Session 2: Query server for chunk status
  Response: "Chunks 1-150 are uploaded"
  ↓
Resume from chunk 151
  ↓
Success!
```

### Implementation Steps

**1. Client initiates upload**
```javascript
const response = await fetch('/api/initiate', {
  method: 'POST',
  body: JSON.stringify({
    filename: 'large-file.mp4',
    fileSize: 1073741824,
    mimeType: 'video/mp4'
  })
});

const { uploadId, totalChunks } = await response.json();
localStorage.setItem('currentUploadId', uploadId);
```

**2. Upload chunks with persistence**
```javascript
async function uploadWithResume(file, uploadId) {
  const chunks = splitIntoChunks(file);
  
  for (let i = 0; i < chunks.length; i++) {
    try {
      await uploadChunk(uploadId, i, chunks[i]);
      localStorage.setItem('lastUploadedChunk', i);
      updateProgress(i + 1, chunks.length);
    } catch (error) {
      // Save state for resume
      localStorage.setItem('uploadFailed', 'true');
      throw error;
    }
  }
}
```

**3. On reconnection, query status and resume**
```javascript
async function handleReconnect() {
  const uploadId = localStorage.getItem('currentUploadId');
  const lastChunk = parseInt(localStorage.getItem('lastUploadedChunk') || 0);
  
  // Query server for current status
  const response = await fetch(`/api/upload-status/${uploadId}`);
  const { uploadedChunks, totalChunks } = await response.json();
  
  // Resume from next chunk
  const nextChunk = Math.max(uploadedChunks) + 1;
  console.log(`Resuming from chunk ${nextChunk} of ${totalChunks}`);
  
  // Continue upload...
}
```

### Server-Side Resume Support

Store metadata for each upload:

```javascript
const uploadMetadata = {
  uploadId: "abc123",
  filename: "video.mp4",
  fileSize: 1073741824,
  uploadedChunks: {
    1: { etag: "e1a2b3...", uploadedAt: "2024-01-15T10:30:00Z" },
    2: { etag: "f5g6h7...", uploadedAt: "2024-01-15T10:31:00Z" },
    // ...
  },
  createdAt: "2024-01-15T10:25:00Z",
  status: "in-progress"
};
```

When client queries `/api/list-chunks?uploadId=abc123`:
```json
{
  "uploadId": "abc123",
  "chunks": [
    {"chunkNumber": 1, "etag": "e1a2b3..."},
    {"chunkNumber": 2, "etag": "f5g6h7..."}
  ],
  "uploadProgress": 50,
  "expectedChunks": 200
}
```

Client can then start uploading from chunk 3 onward.

---

## Error Handling & Recovery

### Common Failure Scenarios

#### 1. Network Timeout
```
Chunk 45 upload in progress...
30 seconds pass → TCP timeout
Connection closed
Client response: "Timeout"
Server action: Keep upload session alive (expires in 7 days)
Client action: Retry chunk 45 after 5s
```

**Recovery Strategy:**
```javascript
async function uploadChunkWithRetry(uploadId, chunkNum, data, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadChunk(uploadId, chunkNum, data);
    } catch (error) {
      lastError = error;
      const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      console.log(`Retry ${attempt}/${maxRetries} after ${backoff}ms`);
      await delay(backoff);
    }
  }
  
  throw lastError;
}
```

#### 2. Invalid ETag
```
S3 response: "The ETag provided does not match the object ETag"
Cause: Data corrupted during transmission
Solution: Re-upload chunk
```

#### 3. Part Too Small
```
S3 response: "EntityTooSmall: Your proposed upload is smaller than the minimum allowed"
Cause: Chunk is < 5MB (except last chunk)
Solution: Adjust chunking logic or combine with previous chunk
```

#### 4. NoSuchUpload
```
S3 response: "The specified upload does not exist"
Cause: Upload session expired or invalid uploadId
Solution: Restart upload (initiate new multipart session)
```

### Validation at Each Stage

```javascript
// 1. Validate before upload
validateUploadInitiation({
  filename: (max 255 chars),
  fileSize: (1 byte to 1GB),
  mimeType: (valid MIME type)
})

// 2. Validate chunk upload
validateChunkUpload({
  uploadId: (exists and active),
  chunkNumber: (1-10,000 valid range),
  contentLength: (≤ 5MB),
  contentType: (binary/octet-stream)
})

// 3. Validate completion
validateCompletion({
  uploadId: (exists),
  chunks: (sequential, all eTags present)
})
```

---

## Performance Considerations

### Bandwidth Optimization

**Current bottleneck: Unlikely**
```
Typical scenario:
- File size: 1GB
- Chunk size: 5MB
- Total chunks: 200
- Network speed: 50 Mbps
- Time per chunk: (5MB * 8) / 50Mbps = 0.8 seconds
- Total time: 200 * 0.8 = 160 seconds (2.67 minutes)
```

**Optimization: Parallel uploads**
```
With 4 concurrent uploads:
- Effective bandwidth usage: 4x
- Time per batch: 4 * 0.8 = 3.2 seconds
- Total batches: 200 / 4 = 50
- Total time: 50 * 3.2 = 160 seconds (same!)
- But only 50 requests instead of 200 ✓
```

### Memory Management

**Avoid loading entire file into memory:**
```javascript
// ✗ Bad
const fileBuffer = fs.readFileSync(filePath);
const chunks = splitBuffer(fileBuffer);

// ✓ Good
const fileStream = fs.createReadStream(filePath, {
  highWaterMark: CHUNK_SIZE
});

for await (const chunk of fileStream) {
  await uploadChunk(uploadId, chunkNum, chunk);
}
```

### Server-Side Considerations

**Memory for metadata storage:**
```
Each upload metadata: ~500 bytes
20,000 concurrent uploads: 10MB
Acceptable for production
```

**Database query optimization:**
```
Index on uploadId for O(1) lookup
Index on createdAt for auto-cleanup of old uploads
Index on userId for per-user upload history
```

---

## Real-World Examples

### Example 1: Dropbox File Upload

When user uploads large file to Dropbox:
1. Client splits file into 4MB chunks
2. Uploads 4 chunks in parallel
3. If connection drops, shows "Paused"
4. User can resume later from same browser/device
5. Metadata stored in localStorage
6. On reconnect, Dropbox queries server for status
7. Resumes from last successful chunk

### Example 2: YouTube Video Upload

1. User selects 2GB video
2. Browser automatically chunks into 1GB chunks
3. Uploads first chunk, polls for resumability
4. If interrupted, upload is paused
5. Server stores partial upload for 30 days
6. User can resume from different device
7. Meanwhile, server processes uploaded chunks
8. Video available at 360p while upload completes

### Example 3: Google Drive Sync

1. Syncing large folder to drive
2. Each file chunked into 5MB pieces
3. Smart sync detects network type
4. On mobile (4G): smaller chunks, lower concurrency
5. On WiFi: larger chunks, higher concurrency
6. Pauses on metered networks
7. Resumes when WiFi available
8. All metadata encrypted and stored locally

### Example 4: AWS S3 Direct Upload

Browser directly uploads to S3 using presigned URLs:
```
1. Backend signs request for specific upload
2. Browser makes PUT request directly to S3
3. S3 initiates multipart upload
4. Browser uploads chunks
5. Browser completes upload
6. Backend verifies upload and updates database
```

Benefits: Backend not in upload path, saves bandwidth

---

## Security & Best Practices

### Validation & Verification

```javascript
// 1. Validate file size before upload
if (fileSize > MAX_FILE_SIZE) {
  throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE}`);
}

// 2. Verify MIME type
if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
  throw new Error(`File type not allowed: ${mimeType}`);
}

// 3. Verify chunk data integrity
const actualHash = crypto.createHash('md5').update(chunkData).digest();
const expectedHash = req.headers['x-chunk-hash'];
if (actualHash !== expectedHash) {
  throw new Error('Chunk data corrupted');
}

// 4. Verify all chunks before completion
const expectedChunks = Math.ceil(fileSize / CHUNK_SIZE);
if (uploadedChunks.length !== expectedChunks) {
  throw new Error('Missing chunks');
}
```

### Rate Limiting

```javascript
// Limit upload initiations per IP
const MAX_UPLOADS_PER_MINUTE = 10;

// Limit concurrent chunks per upload
const MAX_CONCURRENT_CHUNKS = 4;

// Limit total upload size per user per day
const MAX_UPLOAD_SIZE_PER_DAY = 100 * 1024 * 1024 * 1024; // 100GB
```

### Security Best Practices

1. **Always use HTTPS** for uploads
2. **Validate every chunk** isn't oversized
3. **Rate limit** upload initiation
4. **Track upload sessions** by user
5. **Auto-expire** uploads after 7 days
6. **Scan uploaded files** for malware
7. **Sanitize filenames** to prevent injection
8. **Use presigned URLs** to limit access
9. **Encrypt sensitive uploads** in transit and at rest
10. **Log all uploads** for audit trail

### Cleanup & Maintenance

```javascript
// Auto-abort stale multipart uploads (>7 days)
setInterval(async () => {
  const uploads = await s3.listMultipartUploads({
    Bucket: BUCKET_NAME
  }).promise();

  const now = Date.now();
  const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  for (const upload of uploads.Uploads) {
    const uploadTime = new Date(upload.Initiated).getTime();
    if (now - uploadTime > MAX_AGE) {
      await s3.abortMultipartUpload({
        Bucket: BUCKET_NAME,
        Key: upload.Key,
        UploadId: upload.UploadId
      }).promise();
    }
  }
}, 24 * 60 * 60 * 1000); // Run daily
```

---

## Conclusion

Chunked uploads with multipart resume represent a mature, production-ready pattern for handling large file transfers. By understanding the architecture, implementing proper error handling, and following security best practices, you can build reliable file upload systems that provide excellent user experience even with unreliable networks.

**Key Takeaways:**
- Always use chunked uploads for files > 100MB
- Implement resume capability for user experience
- Validate at every stage (initiation, chunk, completion)
- Monitor and clean up stale uploads
- Use AWS S3 or similar managed services
- Implement proper error handling and retries
- Log everything for debugging and security

