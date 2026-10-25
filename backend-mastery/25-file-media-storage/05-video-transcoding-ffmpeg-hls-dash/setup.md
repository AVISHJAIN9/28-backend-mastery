# Setup - Video Transcoding with FFmpeg

## Prerequisites

- Node.js 18+
- FFmpeg installed
- 2GB disk space for transcoding

## Installation

### 1. Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
which ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
ffmpeg -version
```

### 2. Install Node Dependencies
```bash
cd 05-video-transcoding-ffmpeg-hls-dash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your FFmpeg path
export FFMPEG_PATH=/usr/local/bin/ffmpeg
```

### 4. Start Server
```bash
npm start
```

Server runs on http://localhost:6605

## Verify Installation

```bash
curl http://localhost:6605/api/health
```

Expected: HTTP 200 with module status

## Testing Server

```bash
# Start transcoding
curl -X POST http://localhost:6605/api/transcode \\
  -H "Content-Type: application/json" \\
  -d '{
    "format": "h264",
    "bitrate": "5000k",
    "resolution": "1920x1080"
  }'
```

## Troubleshooting

### FFmpeg Not Found
```bash
# Update .env with full path
FFMPEG_PATH=/usr/bin/ffmpeg
```

### Out of Memory
```bash
# Reduce worker threads
WORKER_THREADS=2
```

### Transcoding Timeout
```bash
# Increase timeout
SCAN_TIMEOUT=60000
```

## Next Steps

1. [Module 06 - HLS Streaming](../06-hls-streaming-segments-manifest/)
