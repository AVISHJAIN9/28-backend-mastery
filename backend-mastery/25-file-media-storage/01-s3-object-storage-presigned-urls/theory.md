# S3 Object Storage with Presigned URLs - Theory

## Table of Contents
1. [What is S3 Object Storage?](#what-is-s3-object-storage)
2. [Presigned URLs](#presigned-urls)
3. [Security Considerations](#security-considerations)
4. [Best Practices](#best-practices)
5. [Common Mistakes](#common-mistakes)
6. [Real-World Applications](#real-world-applications)

## What is S3 Object Storage?

Amazon S3 (Simple Storage Service) is a cloud-based object storage service that stores data as "objects" within "buckets". It's designed for:

- **Scalability**: Handle massive amounts of data
- **Durability**: 99.999999999% (11 nines) of durability
- **Availability**: 99.99% availability
- **Performance**: Millisecond latency

### Key Concepts

#### Buckets
- Container for objects
- Must have globally unique names
- Region-specific (replicated within region)
- Can be versioned, encrypted, and have lifecycle policies

#### Objects
- Any file stored in S3 (images, documents, videos, etc.)
- Key = full pathname within bucket
- Value = actual content
- Metadata = content-type, encryption, access control, etc.

#### Keys (File Paths)
- Unique identifier for each object in a bucket
- Example: `uploads/2024/photo.jpg`
- Can contain forward slashes for folder-like organization

### Storage Classes

| Class | Use Case | Cost |
|-------|----------|------|
| **Standard** | Frequently accessed data | Highest |
| **Intelligent-Tiering** | Unknown access patterns | Auto-optimizes |
| **Standard-IA** | Infrequent access | Lower cost |
| **Glacier** | Long-term archival | Lowest cost |
| **Deep Archive** | Rarely accessed | Cheapest |

## Presigned URLs

Presigned URLs are temporary, signed URLs that allow anyone with the URL to perform specific S3 actions.

### How Presigned URLs Work

```
1. Client requests presigned URL from backend
2. Backend signs the request with AWS credentials
3. Backend returns URL to client
4. Client uses URL directly to upload/download from S3
5. URL expires after set time (1 hour by default)
```

### Benefits

1. **Direct S3 Access**: Client bypasses backend for upload/download
2. **Reduced Bandwidth**: Backend doesn't transfer file data
3. **Temporary Access**: URL expires automatically
4. **Secure**: Signed with AWS credentials
5. **Flexible**: Different permissions for different operations

### Presigned URL for Upload

```javascript
const presignedUrl = s3.getSignedUrl('putObject', {
  Bucket: 'my-bucket',
  Key: 'uploads/file.txt',
  ContentType: 'text/plain',
  Expires: 3600 // 1 hour
});
```

**Client Flow:**
```javascript
// Client receives presignedUrl from backend
const response = await fetch(presignedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'text/plain' },
  body: fileContent
});
```

### Presigned URL for Download

```javascript
const presignedUrl = s3.getSignedUrl('getObject', {
  Bucket: 'my-bucket',
  Key: 'uploads/file.txt',
  Expires: 3600
});
```

**Client Flow:**
```javascript
// Client can directly access the file
window.location.href = presignedUrl;
// Or fetch it
const response = await fetch(presignedUrl);
const blob = await response.blob();
```

## URL Structure

A presigned URL contains:

```
https://bucket-name.s3.amazonaws.com/key?
  X-Amz-Algorithm=AWS4-HMAC-SHA256&
  X-Amz-Credential=AKIAIOSFODNN7EXAMPLE/20240101/us-east-1/s3/aws4_request&
  X-Amz-Date=20240101T120000Z&
  X-Amz-Expires=3600&
  X-Amz-SignedHeaders=host&
  X-Amz-Signature=signature
```

Key components:
- **X-Amz-Algorithm**: AWS signature version
- **X-Amz-Credential**: AWS credentials with date/region/service
- **X-Amz-Date**: Request timestamp
- **X-Amz-Expires**: URL expiration time
- **X-Amz-Signature**: HMAC-SHA256 signature

## Security Considerations

### 1. URL Expiration
- **Always set an expiration time** (recommended: 1 hour for uploads, 1 day for downloads)
- **Never create permanent URLs** - creates security risk
- Use shorter times for sensitive documents

### 2. Access Control

**IAM Policies:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::ACCOUNT:user/app" },
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::bucket/*"
    }
  ]
}
```

### 3. Encryption

**Server-Side Encryption (SSE):**
```javascript
const params = {
  Bucket: 'my-bucket',
  Key: 'file.txt',
  ServerSideEncryption: 'AES256'
};
```

### 4. Credential Management

✅ **DO:**
- Store AWS credentials in environment variables
- Use IAM roles for EC2/Lambda
- Rotate credentials regularly

❌ **DON'T:**
- Hardcode credentials in code
- Commit credentials to git
- Use root AWS accounts

## Best Practices

### 1. Key Naming Strategy

```javascript
// Format: category/timestamp-uuid-filename
const key = `uploads/${Date.now()}-${uuid()}-${originalFileName}`;
```

### 2. Content-Type Validation

```javascript
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'application/pdf'
];

if (!ALLOWED_TYPES.includes(contentType)) {
  throw new Error('Invalid file type');
}
```

### 3. File Size Limits

```javascript
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

if (fileSize > MAX_SIZE) {
  throw new Error('File too large');
}
```

## Common Mistakes

### ❌ Mistake 1: Permanent Presigned URLs
```javascript
// BAD - URL never expires
const url = s3.getSignedUrl('getObject', {
  Expires: 2147483647 // Max value
});

// GOOD - Reasonable expiration
const url = s3.getSignedUrl('getObject', {
  Expires: 3600 // 1 hour
});
```

### ❌ Mistake 2: Missing Content-Type
```javascript
// BAD - No Content-Type
const url = s3.getSignedUrl('putObject', {
  Key: 'file.txt'
});

// GOOD - Specify Content-Type
const url = s3.getSignedUrl('putObject', {
  Key: 'file.txt',
  ContentType: 'text/plain'
});
```

### ❌ Mistake 3: Credentials in Frontend

```javascript
// BAD - Credentials exposed
const s3 = new AWS.S3({
  accessKeyId: 'AKIA...',
  secretAccessKey: 'secret...'
});

// GOOD - Backend generates URL only
```

## Real-World Applications

### 1. User Avatar Upload
- Request presigned URL from backend
- Backend validates permissions
- Frontend uploads directly to S3
- Backend stores URL in user profile

### 2. Document Management
- Documents stored with user ID prefix
- Access controlled via presigned URLs
- Automatic expiration prevents sharing

### 3. Media Gallery
- Presigned URLs with 1 hour expiration
- Direct downloads from S3
- Lifecycle policies archive old files

## Summary

Presigned URLs provide:
- ✅ Direct client-to-S3 transfers
- ✅ Temporary, secure access
- ✅ Reduced backend bandwidth
- ✅ Scalable to millions of files
- ✅ Cost-effective
