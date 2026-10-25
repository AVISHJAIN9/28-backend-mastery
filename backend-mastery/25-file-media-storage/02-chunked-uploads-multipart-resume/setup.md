# Setup Guide: Chunked Uploads with Multipart Resume

Complete step-by-step instructions to set up and run this module.

## Prerequisites

- **Node.js** >= 14.0.0 ([download](https://nodejs.org/))
- **npm** >= 6.0.0 (comes with Node.js)
- **AWS Account** with S3 access ([create account](https://aws.amazon.com/))
- **Git** (optional, for version control)
- **Postman** or **cURL** (for API testing)

## Verify Prerequisites

### Check Node.js and npm

```bash
node --version
# Should output: v14.x or higher

npm --version
# Should output: 6.x or higher
```

If versions are too old, update from nodejs.org.

### Check AWS Access

```bash
# You should have:
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - S3 bucket created
# - Appropriate IAM permissions
```

If not, see "AWS Configuration" section below.

---

## Step 1: AWS Configuration

### 1.1 Create S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com)
2. Click **Create bucket**
3. Enter bucket name: `backend-mastery-uploads-dev`
4. Choose region: `us-east-1`
5. Uncheck "Block all public access" (for testing only)
6. Click **Create bucket**

### 1.2 Create IAM User with S3 Access

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam)
2. Click **Users** → **Create user**
3. User name: `backend-mastery-dev`
4. Click **Next**
5. Attach policies: `AmazonS3FullAccess`
6. Click **Create user**
7. Click **Security credentials** tab
8. Create **Access Key**
9. Copy and save:
   - Access Key ID
   - Secret Access Key

### 1.3 Verify S3 Permissions

```bash
# Using AWS CLI
aws s3 ls s3://backend-mastery-uploads-dev \
  --region us-east-1 \
  --profile backend-mastery-dev

# Should output: (empty list, no errors)
```

---

## Step 2: Clone/Setup Project

### 2.1 Navigate to Module Directory

```bash
cd /Users/avishjain/Downloads/backend-mastery/25-file-media-storage/02-chunked-uploads-multipart-resume
```

### 2.2 Initialize Node Project (if needed)

```bash
# Check if package.json exists
ls package.json

# If it doesn't exist, initialize:
npm init -y
```

---

## Step 3: Install Dependencies

### 3.1 Install npm Packages

```bash
npm install
```

This installs:
- **express** - Web framework
- **cors** - Cross-origin requests
- **helmet** - Security headers
- **dotenv** - Environment variables
- **joi** - Input validation
- **aws-sdk** - AWS integration
- **nodemon** (dev) - Auto-restart on changes

### 3.2 Verify Installation

```bash
# Check if node_modules created
ls -la node_modules | head

# Should show many modules installed
```

---

## Step 4: Environment Configuration

### 4.1 Create .env File

```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env
# or use your preferred editor
```

### 4.2 Configure .env Values

Edit `.env` and fill in:

```env
# Server
HTTP_PORT=6602
NODE_ENV=development

# AWS S3 - YOUR CREDENTIALS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_actual_access_key_id
AWS_SECRET_ACCESS_KEY=your_actual_secret_access_key
AWS_S3_BUCKET=backend-mastery-uploads-dev

# Upload Configuration
CHUNK_SIZE_BYTES=5242880
MAX_FILE_SIZE_BYTES=1073741824
MAX_CHUNKS=10000
REQUEST_TIMEOUT_MS=300000

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:6602
```

### 4.3 Verify .env Syntax

```bash
# View .env file
cat .env

# Should show all variables with actual values
# NO quotes needed around values
```

---

## Step 5: Start Development Server

### 5.1 Start with npm

```bash
# Development mode (with auto-restart)
npm run dev
```

### 5.2 Expected Output

```
[timestamp] [info] Server initialization {...}
═══════════════════════════════════════════════════════════════
✓ Module 02: Chunked Uploads Multipart Resume
✓ Server running on http://localhost:6602
═══════════════════════════════════════════════════════════════

Endpoints:
  • Health:    http://localhost:6602/health
  • API Root:  http://localhost:6602/api
  • Home:      http://localhost:6602/

API Routes:
  POST   /api/initiate              - Initiate upload
  PUT    /api/upload-chunk          - Upload chunk
  GET    /api/list-chunks           - List uploaded chunks
  GET    /api/upload-status/:id     - Get upload status
  POST   /api/complete-upload       - Complete upload
  DELETE /api/abort-upload          - Abort upload
```

### 5.3 Troubleshoot Server Issues

**Error: Port 6602 already in use**
```bash
# Kill process on port 6602
lsof -ti :6602 | xargs kill -9

# Or use different port
HTTP_PORT=6603 npm run dev
```

**Error: Cannot read property 'promise' of undefined**
```bash
# AWS SDK not configured correctly
# Check .env: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
```

**Error: NoSuchBucket**
```bash
# Bucket name doesn't exist
# Verify AWS_S3_BUCKET in .env
# Create bucket if needed (see Step 1.1)
```

---

## Step 6: Test API Endpoints

### 6.1 Health Check

```bash
curl http://localhost:6602/health

# Expected response:
# {"status":"healthy","module":"02-chunked-uploads-multipart-resume",...}
```

### 6.2 Initiate Upload

```bash
curl -X POST http://localhost:6602/api/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test-file.bin",
    "fileSize": 10485760,
    "mimeType": "application/octet-stream"
  }'

# Expected response:
# {
#   "success": true,
#   "uploadId": "abc123...",
#   "key": "uploads/...",
#   "totalChunks": 2,
#   "chunkSize": 5242880
# }
```

Save the `uploadId` for next steps.

### 6.3 Create Test Chunk File

```bash
# Create 5MB test file
dd if=/dev/zero of=chunk1.bin bs=1M count=5

# Verify size
ls -lh chunk1.bin
# Should show: -rw-r--r-- 1 user staff 5.0M ... chunk1.bin
```

### 6.4 Upload Chunk

```bash
# Replace UPLOAD_ID with actual uploadId from step 6.2
curl -X PUT "http://localhost:6602/api/upload-chunk?uploadId=UPLOAD_ID&chunkNumber=1" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @chunk1.bin

# Expected response:
# {
#   "success": true,
#   "uploadId": "...",
#   "chunkNumber": 1,
#   "etag": "a1b2c3d4..."
# }
```

Save the `etag` for completion step.

### 6.5 List Chunks

```bash
curl "http://localhost:6602/api/list-chunks?uploadId=UPLOAD_ID"

# Expected response:
# {
#   "success": true,
#   "uploadId": "UPLOAD_ID",
#   "chunks": [{"chunkNumber": 1, "etag": "..."}],
#   "totalChunksUploaded": 1,
#   "expectedChunks": 2
# }
```

### 6.6 Complete Upload

```bash
curl -X POST http://localhost:6602/api/complete-upload \
  -H "Content-Type: application/json" \
  -d '{
    "uploadId": "UPLOAD_ID",
    "chunks": [
      {"chunkNumber": 1, "etag": "ETAG_FROM_STEP_6_4"}
    ]
  }'

# Expected response:
# {
#   "success": true,
#   "uploadId": "...",
#   "filename": "test-file.bin",
#   "fileSize": 5242880,
#   "location": "https://...",
#   "downloadUrl": "https://...?X-Amz-Signature=..."
# }
```

---

## Step 7: Test with React UI

### 7.1 Access React Testing UI

1. Ensure server is running: `npm run dev`
2. Open browser: `http://localhost:6602`
3. File input box should be available

### 7.2 Test Full Upload

1. Select a test file (< 1GB)
2. Click "Upload"
3. Monitor progress:
   - Chunks uploaded in real-time
   - Progress bar updates
   - Status messages
4. On completion:
   - Download button appears
   - File checksum shown

### 7.3 Test Resume

1. Select a large file
2. Start upload
3. After 2-3 chunks uploaded, close browser tab
4. Reopen same browser (same computer)
5. Navigate to same URL
6. Should see "Resume upload" option
7. Click resume - continues from where it left off

---

## Step 8: Monitor Logs

### 8.1 View Logs in Development

```bash
# Already visible in terminal where `npm run dev` runs
# Or redirect to file:
npm run dev > server.log 2>&1

# Read logs:
tail -f server.log
```

### 8.2 Log Levels

Control verbosity with `LOG_LEVEL`:

```env
LOG_LEVEL=debug     # Most verbose (development)
LOG_LEVEL=info      # Normal (default)
LOG_LEVEL=warn      # Only warnings and errors
LOG_LEVEL=error     # Only errors
```

---

## Step 9: Production Deployment Checklist

### 9.1 Security

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (SSL/TLS certificate)
- [ ] Set `NODE_ENV=production`
- [ ] Implement authentication/authorization
- [ ] Enable rate limiting in middleware
- [ ] Validate and sanitize all inputs
- [ ] Enable CORS only for trusted origins

### 9.2 Performance

- [ ] Enable parallel chunk uploads (client-side)
- [ ] Implement database for metadata (not in-memory)
- [ ] Use Redis for session management
- [ ] Monitor memory usage and cleanup stale uploads
- [ ] Set up auto-cleanup of uploads older than 7 days

### 9.3 Reliability

- [ ] Implement error monitoring (Sentry, DataDog)
- [ ] Add health check endpoint monitoring
- [ ] Set up database backups
- [ ] Implement graceful shutdown
- [ ] Use process manager (PM2, systemd)

### 9.4 Deployment Steps

```bash
# 1. Install production dependencies
npm install --production

# 2. Build/bundle if needed
npm run build

# 3. Start with process manager
pm2 start server.js --name "chunked-uploads"

# 4. Set up auto-restart
pm2 startup
pm2 save
```

---

## Step 10: Troubleshooting

### Issue: "Cannot read property 's3' of undefined"

**Cause:** AWS SDK not initialized
**Solution:**
- Check AWS credentials in .env
- Restart server after .env changes

### Issue: "ECONNREFUSED: Connection refused"

**Cause:** AWS credentials wrong or network issue
**Solution:**
- Verify credentials in AWS console
- Check AWS_REGION matches bucket region
- Test AWS CLI separately

### Issue: "The access key does not have permissions"

**Cause:** IAM user doesn't have S3 permissions
**Solution:**
- Go to IAM console
- Attach policy: `AmazonS3FullAccess`
- Wait a few minutes for propagation

### Issue: Large file uploads extremely slow

**Cause:** Chunk size too large or serial upload
**Solution:**
- Reduce CHUNK_SIZE_BYTES
- Implement parallel uploads (on client-side)
- Check network speed

### Issue: "uploadedChunks is not a Map"

**Cause:** Type mismatch in javascript
**Solution:**
- Ensure storage uses correct data structures
- Check controller.js implementation

---

## Quick Reference Commands

```bash
# Start development
npm run dev

# Install dependencies
npm install

# Run production
npm start

# Clean up (remove node_modules)
npm clean install

# Create test file
dd if=/dev/zero of=test.bin bs=1M count=5

# Test endpoint
curl http://localhost:6602/health

# Kill port
lsof -ti :6602 | xargs kill -9

# View logs
tail -f server.log

# Monitor uploads
watch curl http://localhost:6602/health
```

---

## Next Steps

1. ✓ Complete basic setup and testing
2. ✓ Add authentication/authorization
3. ✓ Implement database storage for metadata
4. ✓ Add malware scanning (ClamAV)
5. ✓ Implement download endpoints
6. ✓ Add file type validation (magic bytes)
7. ✓ Deploy to production

---

## Support & Resources

- **Theory:** See `theory.md` for comprehensive explanation
- **API Docs:** See `README.md` for detailed API documentation
- **Code:** See `controller.js`, `routes.js` for implementation
- **Tests:** See `App.jsx` for React testing UI

---

**Need help?** Check the troubleshooting section or review error messages carefully. Most issues stem from AWS configuration.

