# Setup - HLS Streaming

## Prerequisites

- Node.js 18+
- npm or yarn
- Basic knowledge of HTTP

## Installation

### 1. Install Dependencies
```bash
cd 06-hls-streaming-segments-manifest
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Server
```bash
npm start
```

Server runs on http://localhost:6606

## Testing

### Health Check
```bash
curl http://localhost:6606/api/health
```

### Create Stream
```bash
curl -X POST http://localhost:6606/api/streams \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Stream"}'
```

### Get Playlist
```bash
curl http://localhost:6606/api/streams/<streamId>/playlist.m3u8
```

## Streaming with VLC

1. Open VLC
2. Media > Open Network Stream
3. Enter: http://localhost:6606/api/streams/<streamId>/playlist.m3u8
4. Play

## Next Steps

1. Study theory on HLS
2. Understand segment management
3. Integrate with video source
4. [Module 07 - PDF Generation](../07-pdf-generation-puppeteer-pdfkit/)
