# AWS S3 & Presigned URLs

## What is this?

AWS S3 (Simple Storage Service) provides scalable cloud storage with:
- **Presigned URLs**: Temporary access without AWS credentials
- **Multipart Upload**: Handle large files efficiently
- **Access Control**: Public/private object permissions
- **Server-Side Encryption**: Data encryption at rest
- **Versioning**: Track object history and recover deleted files
- **Lifecycle Policies**: Auto-delete or archive old files

## Why does it matter?

Presigned URLs allow clients to upload directly to S3 without storing AWS credentials client-side. Enables secure file uploads with size limits, file type validation, and temporary access. Global CDN via CloudFront delivers files with sub-100ms latency.

## How it works (step by step)

1. **Client Requests Upload**: POST `/api/files/presigned-url`
2. **Server Validates**: Check file type, size, user permissions
3. **Generate URL**: Create presigned URL valid for 15 minutes
4. **Client Uploads**: PUT request directly to S3 with presigned URL
5. **S3 Validates Signature**: Rejects requests with invalid signatures
6. **URL Expires**: After 15 minutes, URL becomes invalid
7. **Download via CloudFront**: GET `/api/files/:id` returns CDN URL

## Key concepts

- **Presigned URLs**: AWS AccessKey + SecretKey signs request, temporary validity
- **Signature v4**: Most secure signature method, prevents tampering
- **Multipart Upload**: Split large files into parts, upload parallel, merge
- **CORS**: Browser uploads need CORS headers allowing cross-origin requests
- **Metadata**: Store custom metadata (userId, uploadedAt) with object
- **Versioning**: Every upload creates new version, old versions remain recoverable
- **Lifecycle Rules**: Auto-delete old versions or transition to Glacier storage

## Common mistakes

1. **Presigned URLs never expire** → Unlimited access window → Set expiresIn < 1 hour
2. **Client-side AWS credentials** → Exposed in browser network tab → Use server-side signing only
3. **No file size limit in presigned URL** → Attackers upload multi-GB files → Set ContentLength header
4. **No Content-Type validation** → Attackers upload executables → Restrict allowed types
5. **Public bucket ACL** → All objects publicly readable → Use private with CloudFront
6. **No versioning enabled** → Deleted files unrecoverable → Enable versioning on bucket

## Real world usage

**Profile Picture Upload**: User selects image → gets presigned URL → uploads directly to S3 → served via CloudFront
**Large File Backup**: Application generates 500MB database export → uses multipart upload → stored in Glacier
**Document Management**: Compliance system stores documents → versioning enabled → audit trail preserved
**API Response**: User requests file → server returns CloudFront URL with 1-hour expiration

## API Endpoints

### Upload
- `POST /api/files/presigned-url` - Get presigned URL for upload
- `POST /api/files/multipart/init` - Initiate multipart upload
- `POST /api/files/multipart/complete` - Complete multipart upload

### Download
- `GET /api/files/:id` - Get download URL
- `GET /api/files` - List user's files

### Management
- `DELETE /api/files/:id` - Delete file from S3
- `PUT /api/files/:id/metadata` - Update file metadata

## Quick Start

```bash
npm install
node server.js
# Running on http://localhost:6307
```

## Testing

```bash
# Get presigned URL
curl -X POST http://localhost:6307/api/files/presigned-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "fileName":"document.pdf",
    "contentType":"application/pdf",
    "contentLength":1048576
  }'

# Upload to S3 using presigned URL
curl -X PUT "https://bucket.s3.amazonaws.com/...?Signature=..." \
  -H "Content-Type: application/pdf" \
  --data-binary @document.pdf

# Get download URL
curl http://localhost:6307/api/files/file-id \
  -H "Authorization: Bearer {token}"
```
