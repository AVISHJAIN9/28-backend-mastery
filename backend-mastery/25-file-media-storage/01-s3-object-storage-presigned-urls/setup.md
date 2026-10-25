# Setup Guide - Module 01

## System Requirements

- Node.js: 16.0.0 or higher
- npm: 7.0.0 or higher
- AWS Account with S3 access

## Step 1: Verify Prerequisites

```bash
node --version  # Should be v16.0.0 or higher
npm --version   # Should be 7.0.0 or higher
```

## Step 2: Navigate and Install

```bash
cd 01-s3-object-storage-presigned-urls
npm install
```

## Step 3: Setup AWS Credentials

### Option A: Using .env file (Development)
```bash
cp .env.example .env
```

Edit `.env`:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_unique_bucket_name
JWT_SECRET=your_jwt_secret_key
HTTP_PORT=6601
```

### Option B: Using AWS CLI
```bash
aws configure
# Follow prompts to enter credentials
```

## Step 4: Create S3 Bucket

```bash
# List existing buckets
aws s3 ls

# Create bucket (must be globally unique)
aws s3api create-bucket \
  --bucket my-app-bucket-$(date +%s) \
  --region us-east-1

# Verify access
aws s3 ls s3://your-bucket-name/
```

## Step 5: Verify Setup

```bash
# Check AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls

# Verify bucket
aws s3api head-bucket --bucket your-bucket-name
```

## Step 6: Start Server

```bash
npm run dev
```

Expected output:
```
✓ 01 S3 Object Storage Presigned Urls running on http://localhost:6601
✓ Health check: http://localhost:6601/health
```

## Step 7: Test Endpoints

```bash
# Health check
curl http://localhost:6601/api/health

# Generate upload URL
curl -X POST http://localhost:6601/api/upload/presigned-url \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.txt","fileType":"text/plain","fileSize":1024}'

# List objects
curl http://localhost:6601/api/objects
```

## Troubleshooting

### Credentials not found
```bash
cat .env  # Verify file contents
aws sts get-caller-identity  # Test credentials
```

### Port in use
```bash
killall node  # Kill existing processes
# Or change HTTP_PORT in .env
```

### S3 access denied
```bash
aws s3 ls  # Verify bucket access
# Check IAM permissions
```

## Production Setup

Use IAM roles instead of credentials:
```bash
# Attach S3 permissions to EC2/Lambda role
# SDK automatically uses role credentials
```

##  Deployment Checklist

- [ ] AWS credentials configured
- [ ] S3 bucket created
- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Presigned URLs generate correctly
- [ ] Files upload successfully
- [ ] HTTPS enabled (production)

## Next Steps

1. Read [theory.md](theory.md)
2. Review [README.md](README.md) for API docs
3. Test all endpoints
4. Study controller implementation
5. Move to Module 02
## Dependencies
```bash
npm install 
```
## Environment Variables
## How to run
## How to test
