# AWS S3 Setup Guide

## Prerequisites

- AWS account with S3 access
- AWS Access Key ID and Secret Access Key
- Node.js 18.x or higher
- AWS CLI (optional, for testing)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create AWS IAM User

1. Go to AWS IAM > Users
2. Create user with programmatic access
3. Attach policy: `AmazonS3FullAccess`
4. Copy Access Key ID and Secret Key

## Step 3: Create S3 Bucket

1. Go to S3 console
2. Create bucket: `my-app-uploads-{unique-id}`
3. Block Public Access: Enable all
4. Versioning: Enable
5. Server-side Encryption: Enable

## Step 4: Configure CORS

S3 Bucket > Permissions > CORS:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## Step 5: Create .env File

```bash
cp .env.example .env
```

```env
AWS_ACCESS_KEY=your-access-key
AWS_SECRET_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=my-app-uploads
JWT_SECRET=your-super-secret-key
HTTP_PORT=6307
```

## Step 6: Set Lifecycle Policy

S3 Bucket > Management > Lifecycle Rules:

```
- Permanently delete old versions after 30 days
- Archive to Glacier after 90 days
```

## Step 7: Run Development Server

```bash
node server.js
# Server runs on http://localhost:6307
```

## How to test

```bash
# Get presigned upload URL
curl -X POST http://localhost:6307/api/files/presigned-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"fileName":"photo.jpg","contentType":"image/jpeg"}'

# Upload to S3 using presigned URL
curl -X PUT "https://bucket.s3.amazonaws.com/...?Signature=..." \
  -H "Content-Type: image/jpeg" \
  --data-binary @photo.jpg

# Get download URL
curl http://localhost:6307/api/files/file-id \
  -H "Authorization: Bearer token"

# List files
curl http://localhost:6307/api/files \
  -H "Authorization: Bearer token"
```

## Verification Checklist

- [ ] AWS IAM user created with S3 access
- [ ] S3 bucket created
- [ ] Versioning enabled
- [ ] CORS configured
- [ ] Encryption enabled
- [ ] Access keys in .env
- [ ] Server starts without errors
- [ ] Can get presigned URLs
- [ ] Can upload files to S3
- [ ] Can download files
- [ ] Old versions auto-delete
