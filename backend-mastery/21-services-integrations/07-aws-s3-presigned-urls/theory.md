# AWS S3 & Cloud Storage Security: Theory & Concepts

## 1. S3 Fundamentals

### S3 Storage Classes
Different cost/retrieval time tradeoffs:
- **Standard**: Accessed frequently, expensive but instant access
- **Infrequent Access**: Accessed monthly, cheaper, retrieval charge
- **Glacier**: Archived data, very cheap, 3-5 hour retrieval
- **Deep Archive**: Long-term retention, lowest cost, 12 hour retrieval

**Use case**: Lifecycle policy transitions files:
```
1. New uploads → Standard (fast access)
  ↓ (after 30 days)
2. Archives → Glacier (cheap storage)
  ↓ (after 1 year)
3. Compliance → Deep Archive (lowest cost)
```

### S3 Versioning
Every upload creates new version:
```
File: document.pdf
- Version 1: Uploaded 2024-01-01
- Version 2: Uploaded 2024-01-05 (after edit)
- Version 3: Uploaded 2024-01-10 (after edit)

Delete API returns to Version 2
Hard delete only removes current version
```

**Use case**: Restore accidentally deleted files, audit trail of changes.

## 2. Presigned URLs

### URL Signature
Presigned URL includes cryptographic signature:
```
https://bucket.s3.amazonaws.com/file.pdf?
  X-Amz-Algorithm=AWS4-HMAC-SHA256
  &X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20240101%2Fus-east-1%2Fs3%2Faws4_request
  &X-Amz-Date=20240101T000000Z
  &X-Amz-Expires=900
  &X-Amz-SignedHeaders=host
  &X-Amz-Signature=abc123...
```

**Signature covers**:
- URL path
- HTTP method (GET, PUT, POST)
- Expiration time
- Headers (Content-Type, etc.)

**If tampered**:
- URL modified → Signature invalid
- Expiration changed → Signature mismatch
- Different file requested → Signature fails

### Expiration
```javascript
// 15 minute expiration
const url = s3.getSignedUrl('putObject', {
  Bucket: 'my-bucket',
  Key: 'file.pdf',
  Expires: 900 // seconds
});
```

**After 900 seconds**:
- URL becomes invalid
- S3 rejects requests with "Request has expired"
- Even with correct signature, expiration checked first

## 3. Access Control

### Public vs Private
```
Public bucket: Anyone can read (no auth needed)
  Risks: Data exposure, compliance violations, bandwidth theft
  
Private bucket: Default, no public access
  Download via signed URLs or CloudFront distribution
```

### IAM Policies
Granular permissions:
```json
{
  "Effect": "Allow",
  "Principal": {"AWS": "arn:aws:iam::123456789:user/app-user"},
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::my-bucket/user-123/*"
}
```
This user can:
- GET objects in user-123 folder
- PUT (upload) objects in user-123 folder
- Can't access other users' folders
- Can't DELETE objects (DeleteObject action not included)

## 4. File Upload Security

### Content-Length Limits
Presigned URL includes expected size:
```javascript
const url = s3.getSignedUrl('putObject', {
  Bucket: 'my-bucket',
  Key: 'file.pdf',
  ContentLength: 1024 * 1024 // 1 MB max
});
```

S3 rejects uploads larger than ContentLength.

### MIME Type Validation
```javascript
// Verify Content-Type header matches expected type
const url = s3.getSignedUrl('putObject', {
  Bucket: 'my-bucket',
  Key: 'profile.jpg',
  ContentType: 'image/jpeg'
});
```

**Without this**: User could upload image.jpg that's actually a virus.exe

### Virus Scanning
AWS S3 trigger fires on upload:
```javascript
exports.scanUpload = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  
  // Download file from S3
  const file = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  
  // Scan with ClamAV
  const isSafe = await scanWithClamAV(file.Body);
  
  if (!isSafe) {
    // Delete malicious file
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    // Alert admin
    await sns.publish({ Topic: 'security-alerts', Message: `Virus found: ${key}` });
  }
};
```

## 5. CloudFront CDN

### Origin vs Edge
```
Origin (S3): Source of truth, single location
Edge locations: 400+ global caches

User in Tokyo requests file
  ↓
Tomic edge node checks cache
  ↓
Not cached: Fetch from origin (S3 in Virginia)
  ↓
Cache in Tokyo edge for 1 year
  ↓
Next Tokyo request: Instant delivery from edge (< 50ms)
```

### Cache Invalidation
After uploading new version, invalidate old cache:
```javascript
const cloudfront = new AWS.CloudFront();
await cloudfront.createInvalidation({
  DistributionId: 'ABCDEFG',
  InvalidationBatch: {
    Paths: { Quantity: 1, Items: ['/profile.jpg'] }
  }
}).promise();
```

Next requests fetch fresh version from origin.

## 6. Multipart Upload

### Large File Handling
For files > 100 MB, split into parts:
```
1. Initiate upload
2. Upload part 1 (0-100MB)
3. Upload part 2 (100-200MB)  
4. Upload part 3 (200-300MB) ← Could upload in parallel
5. Complete multipart (merge parts)
```

if part 2 fails, only retry part 2 (not entire file).

### Parallel Uploads
```javascript
const parts = [];
for (let i = 0; i < 3; i++) {
  const partData = file.slice(i * partSize, (i + 1) * partSize);
  const part = await s3.uploadPart({
    Bucket, Key, UploadId,
    PartNumber: i + 1,
    Body: partData
  }).promise();
  parts.push(part);
}
await s3.completeMultipartUpload({
  Bucket, Key, UploadId,
  MultipartUpload: { Parts: parts }
}).promise();
```

## 7. Security Checklist

- [ ] Bucket blocks public access
- [ ] Versioning enabled
- [ ] Server-side encryption enabled
- [ ] Presigned URLs expire (< 1 hour)
- [ ] Content-Length limits enforced
- [ ] Content-Type validated
- [ ] IAM policies least privilege
- [ ] Virus scanning on upload
- [ ] MFA Delete enabled (prevents accidental deletion)
- [ ] Access logs enabled (audit trail)
- [ ] Lifecycle policies transition old files
- [ ] CloudFront distribution signed (not public)
- [ ] Cache invalidation after file update
- [ ] Multipart upload for large files (> 100 MB)
- [ ] Bandwidth limits prevent DoS
- [ ] S3 access points restrict access regions
