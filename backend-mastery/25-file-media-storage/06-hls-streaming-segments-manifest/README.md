# 06 - HLS Streaming Segments & Manifest

## Overview

Learn HLS streaming, segment management, and M3U8 playlist generation.

## API Endpoints

### Create Stream
```
POST /api/streams
body: { "name": "Live Stream" }
```

### Get Playlist
```
GET /api/streams/:streamId/playlist.m3u8
```

### Add Segment
```
POST /api/streams/:streamId/segment
```

## HLS Format

### M3U8 Playlist
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
segment-0.ts
#EXTINF:10.0,
segment-1.ts
```

## Segment Management

- **Duration**: Typically 10 seconds
- **Window**: Keep last N segments (sliding window)
- **Playlist**:  Updated with new segments
- **Playback**: Client matches pace

## Best Practices

✅ Consistent segment duration
✅ Keep 3-5 segments in window
✅ Update playlist every 1-2 segments
✅ Monitor buffer health

## Learn More

- [theory.md](theory.md)
- [HLS RFC](https://tools.ietf.org/html/rfc8216)

## Next Module

[07 - PDF Generation](../07-pdf-generation-puppeteer-pdfkit/)
