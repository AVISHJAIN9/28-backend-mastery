# 01 - S3 Object Storage with Presigned URLs

## Overview

Learn how to implement secure, scalable file uploads and downloads using AWS S3 presigned URLs.

**Key Learning:**
- Generate presigned URLs for uploads and downloads
- Direct file transfer from client to S3
- S3 object management (list, metadata, delete)
- Security best practices

## Prerequisites

- AWS Account with S3 access
- Node.js 16+
- Basic Express.js knowledge

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your AWS credentials
```

### 3. Start Server
```bash
npm run dev
```

### 4. Test Health
```bash
curl http://localhost:6601/api/health
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Generate Upload URL
```
POST /api/upload/presigned-url
Body: { fileName: "photo.jpg", fileType: "image/jpeg", fileSize: 2097152 }
```

### Generate Download URL
```
GET /api/download/presigned-url/:key
```

### List Objects
```
GET /api/objects
```

### Get Metadata
```
GET /api/objects/:key/metadata
```

### Delete Object
```
DELETE /api/objects/:key
```

## Upload Workflow

```
1. Client selects file
2. Client requests presigned URL
3. Backend validates and generates URL
4. Client uploads directly to S3
5. Client notifies backend of success
```

## Testing

```bash
# Generate upload URL
curl -X POST http://localhost:6601/api/upload/presigned-url \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.txt","fileType":"text/plain","fileSize":1024}'

# List objects
curl http://localhost:6601/api/objects
```

## Security Checklist

- [x] AWS credentials in environment variables
- [x] S3 bucket versioning enabled
- [x] Presigned URLs have expiration (1 hour)
- [x] File size validation (100MB max)
- [x] Content-Type validation
- [x] Error handling implemented
- [x] CORS configured

## Learn More

- [theory.md](theory.md) - Detailed concepts
- [setup.md](setup.md) - Setup instructions
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

## Next Module

[02 - Chunked Uploads with Multipart Resume](../02-chunked-uploads-multipart-resume/)
