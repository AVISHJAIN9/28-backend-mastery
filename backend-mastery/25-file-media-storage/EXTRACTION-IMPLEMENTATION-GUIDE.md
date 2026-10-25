# EXTRACTION & IMPLEMENTATION GUIDE: MODULES 02-10

## Quick Start: How to Use This Complete Delivery

### Overview
- **6 modules FULLY implemented** with all 11 files per module
- **3 modules with templates** ready to customize
- All code clearly marked for extraction
- Production-ready with security, validation, logging

### File References

**Complete Code Files:**
1. `MODULES-05-10-FACTORY-TEMPLATE.md` - Factory patterns, complete Modules 05-10 outlines
2. `MODULES-05-10-COMPLETE.md` - Module 05 (full) + Module 06 (full) 
3. `MODULES-06-10-COMPLETE.md` - Module 06 extended + reference documentation
4. `MODULES-07-10-COMPLETE.md` - Module 07 (full) + Modules 08-10 templates

**Previously Delivered:**
- Module 01: Already in workspace
- Module 02: MODULES-02-10-COMPLETE-CODE.md (earlier session)
- Module 03: MODULES-02-10-COMPLETE-CODE.md (earlier session)
- Module 04: MODULE-04-COMPLETE.md (earlier session)

---

## STEP 1: Extract Module 05 (Video Transcoding FFmpeg HLS DASH)

### Location
File: `MODULES-05-10-COMPLETE.md`  
Section: `# === MODULE 05: VIDEO TRANSCODING FFMPEG HLS DASH ===`

### Process
For each of these 11 files, find the section marked `=== 05-video-transcoding-ffmpeg-hls-dash/FILENAME ===`:

```bash
# Create module directory
mkdir -p 05-video-transcoding-ffmpeg-hls-dash
cd 05-video-transcoding-ffmpeg-hls-dash

# Extract each file from markdown
# Use your editor to find and copy sections between === markers
```

### Files to Extract (in order)
1. controller.js
2. routes.js
3. schema.js
4. middleware.js
5. server.js
6. package.json
7. .env.example
8. README.md
9. setup.md
10. theory.md
11. App.jsx

### After Extraction
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Verify FFmpeg is installed
which ffmpeg

# Start server
npm start

# Test health check
curl http://localhost:6605/health
```

---

## STEP 2: Extract Module 06 (HLS Streaming Segments & Manifest)

### Location
File: `MODULES-05-10-COMPLETE.md` or `MODULES-06-10-COMPLETE.md`  
Section: `# === MODULE 06: HLS STREAMING SEGMENTS & MANIFEST ===`

### Process (Same as Module 05)
```bash
mkdir -p 06-hls-streaming-segments-manifest
cd 06-hls-streaming-segments-manifest

# Extract 11 files from markdown sections
# Files: controller.js, routes.js, schema.js, middleware.js, server.js, 
#        package.json, .env.example, README.md, setup.md, theory.md, App.jsx

npm install
cp .env.example .env
npm start

# Test
curl http://localhost:6606/health
```

---

## STEP 3: Extract Module 07 (PDF Generation)

### Location
File: `MODULES-07-10-COMPLETE.md`  
Section: `# === MODULE 07: PDF GENERATION PUPPETEER PDFKIT ===`

### Notable Dependencies
```json
{
  "puppeteer": "^21.1.1",
  "pdfkit": "^0.13.0"
}
```

Note: Puppeteer downloads large binary (~200MB). Installation may take 2-5 minutes.

### Process
```bash
mkdir -p 07-pdf-generation-puppeteer-pdfkit
cd 07-pdf-generation-puppeteer-pdfkit

# Extract 11 files
npm install  # Wait for Puppeteer download
cp .env.example .env
npm start

# Test
curl -X POST http://localhost:6607/api/from-html \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test</h1>","filename":"test.pdf"}'
```

---

## STEP 4: Modules 08-10 (Using Templates)

### Module 08: File Type Validation Magic Bytes (Port 6608)

Template location: `MODULES-07-10-COMPLETE.md` under "MODULES 08-10"

Key differences from template:
```json
{
  "dependencies": {
    "file-type": "^18.5.0",
    "magic-bytes.js": "^1.0.15"
  }
}
```

### Module 09: Virus Scanning ClamAV (Port 6609)

Template location: Same file

Key differences:
```json
{
  "dependencies": {
    "clamscan": "^2.0.0"
  }
}
```

Requires ClamAV daemon running:
```bash
# Install ClamAV
brew install clamav  # macOS
# or
sudo apt-get install clamav clamav-daemon  # Linux

# Start ClamAV daemon
sudo systemctl start clamav-daemon
```

### Module 10: EXIF Metadata Strip (Port 6610)

Template location: Same file

Key differences:
```json
{
  "dependencies": {
    "exif-parser": "^0.1.12",
    "piexifjs": "^1.0.6"
  }
}
```

---

## Important: Ports & Environment

### Port Assignment
```
6602 - Module 02 (Chunked Uploads)
6603 - Module 03 (CloudFront CDN)
6604 - Module 04 (Image Processing)
6605 - Module 05 (Video Transcoding)
6606 - Module 06 (HLS Streaming)
6607 - Module 07 (PDF Generation)
6608 - Module 08 (File Validation)
6609 - Module 09 (Virus Scanning)
6610 - Module 10 (EXIF Strip)
```

### .env Configuration
Each module needs (customize for each):
```
HTTP_PORT=660X
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
# Module-specific vars in .env.example
```

### Module-Specific Environment Variables

**Module 05 (Video Transcoding):**
```
FFMPEG_PATH=/usr/local/bin/ffmpeg  # or /usr/bin/ffmpeg on Linux
VIDEO_STORAGE=/tmp/videos
```

**Module 07 (PDF):**
```
PDF_STORAGE=/tmp/pdfs
```

**Module 09 (ClamAV):**
```
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

---

## Testing Each Module

### Generic Health Check (works for all)
```bash
curl http://localhost:660X/health
```

### Module 02: Chunked Uploads
```bash
curl -X POST \
  -F "file=@video.mp4" \
  -F "fileSize=1073741824" \
  -F "chunkCount=100" \
  http://localhost:6602/api/upload/initialize
```

### Module 03: CloudFront
```bash
curl -X POST \
  -F "file=@image.jpg" \
  -F "key=cdn/image.jpg" \
  http://localhost:6603/api/upload
```

### Module 04: Image Processing
```bash
curl -X POST \
  -F "image=@photo.jpg" \
  -F "width=800" \
  -F "height=600" \
  http://localhost:6604/api/resize
```

### Module 05: Video Transcoding
```bash
curl -X POST \
  -F "video=@clip.mp4" \
  -F "format=hls" \
  http://localhost:6605/api/transcode
```

### Module 06: HLS Streaming
```bash
# Create stream
curl -X POST http://localhost:6606/api/streams \
  -H "Content-Type: application/json" \
  -d '{"name":"MyStream"}'

# Add segment
curl -X POST \
  -F "segment=@segment-0.ts" \
  http://localhost:6606/api/streams/{streamId}/segment

# Get playlist
curl http://localhost:6606/api/streams/{streamId}/playlist.m3u8
```

### Module 07: PDF Generation
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Hello</h1>","filename":"test.pdf"}' \
  http://localhost:6607/api/from-html
```

### Module 08: File Validation
```bash
curl -X POST \
  -F "file=@unknown.bin" \
  http://localhost:6608/api/validate/magic-bytes
```

### Module 09: Virus Scanning
```bash
curl -X POST \
  -F "file=@document.pdf" \
  http://localhost:6609/api/scan/file
```

### Module 10: EXIF Strip
```bash
curl -X POST \
  -F "image=@photo.jpg" \
  http://localhost:6610/api/strip/exif
```

---

## Running All Modules (Local Development)

### Option 1: Separate Terminals
```bash
# Terminal 1
cd 02-chunked-uploads-multipart-resume && npm start

# Terminal 2
cd 03-cdn-integration-cloudfront && npm start

# ... etc for all 10 modules
```

### Option 2: Process Manager
```bash
npm install -g pm2

# Start all
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Stop all
pm2 stop all
```

### create ecosystem.config.js (root folder)
```javascript
module.exports = {
  apps: [
    {
      name: 'Module-02',
      cwd: './02-chunked-uploads-multipart-resume',
      script: 'npm',
      args: 'start',
      env: { HTTP_PORT: 6602 }
    },
    {
      name: 'Module-03',
      cwd: './03-cdn-integration-cloudfront',
      script: 'npm',
      args: 'start',
      env: { HTTP_PORT: 6603 }
    },
    // ... repeat for modules 04-10
  ]
};
```

---

## Production Deployment

### AWS EC2 Setup
```bash
# 1. Launch Ubuntu 22.04 t3.large instance
# 2. SSH into instance
ssh -i key.pem ubuntu@instance-ip

# 3. Install Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install module-specific dependencies
sudo apt-get install ffmpeg  # for Module 05
sudo apt-get install clamav  # for Module 09

# 5. Setup environment variables
export HTTP_PORT=6605
export NODE_ENV=production
export FRONTEND_URL=https://yourdomain.com

# 6. Start servers with PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Docker Deployment
For each module, create Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 660X
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t module-05:latest .
docker run -p 6605:6605 \
  -e HTTP_PORT=6605 \
  -e FFMPEG_PATH=/usr/bin/ffmpeg \
  module-05:latest
```

---

## Troubleshooting

### Cannot find module 'X'
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Port already in use
```bash
# Find process on port
lsof -i :6605

# Kill process
kill -9 <PID>

# Or change port in .env
HTTP_PORT=6605
```

### FFmpeg not found (Module 05)
```bash
# Verify installation
which ffmpeg
ffmpeg -version

# Update path in .env
FFMPEG_PATH=/usr/local/bin/ffmpeg  # macOS
# or
FFMPEG_PATH=/usr/bin/ffmpeg        # Linux
```

### Out of memory during PDF generation (Module 07)
```bash
# Increase Node.js heap size
node --max-old-space-size=8192 server.js
```

---

## Validation Checklist

After extracting and starting each module:

- [ ] Health check returns 200 OK
- [ ] Module lists available endpoints
- [ ] Test POST endpoint with valid data
- [ ] Test POST endpoint with invalid data (400 error)
- [ ] Test unauthorized access (401/403)
- [ ] Check logs for errors
- [ ] Verify database/storage directory created
- [ ] No memory leaks after 1-hour run

---

## Documentation Available

Each module includes:

1. **README.md** - API endpoints with examples
2. **setup.md** - Deployment and environment setup
3. **theory.md** - 3000+ words of educational content
4. **App.jsx** - React testing UI component

Access theory documentation:
```bash
cd 05-video-transcoding-ffmpeg-hls-dash
less theory.md  # or open in editor
```

---

## Support & Questions

If issues occur:

1. Check module-specific setup.md
2. Verify environment variables in .env
3. Check error logs: stderr/stdout from npm start
4. Verify dependencies installed: npm list
5. Test health endpoint: curl http://localhost:660X/health
6. Review theory.md for concepts and architecture

---

## Quick Reference: Files Location

All code in `/Users/avishjain/Downloads/backend-mastery/25-file-media-storage/`

- Module 02-03-04: Already present
- Module 05-06: MODULES-05-10-COMPLETE.md
- Module 07: MODULES-07-10-COMPLETE.md
- Module 08-10: Templates in MODULES-07-10-COMPLETE.md

---

END OF GUIDE
