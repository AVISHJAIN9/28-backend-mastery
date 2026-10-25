# 05 - Video Transcoding with FFmpeg

## Overview

Learn video transcoding, encoding H.264/VP9, and generating HLS/DASH manifests.

## API Endpoints

### Transcode Video
```
POST /api/transcode
body: { "format": "h264", "bitrate": "5000k", "resolution": "1920x1080" }
```

### Get Status
```
GET /api/status/:transcodeId
```

### Generate Manifest
```
 GET /api/manifest/:streamId
```

## Video Formats

- **H.264**: Universal, high compression-quality ratio
- **VP9**: Open source, better compression
- **AV1**: Next-gen, highest compression

## Bitrate Guidelines

- **480p**: 1-2 Mbps
- **720p**: 2.5-5 Mbps
- **1080p**: 5-10 Mbps
- **4K**: 20-60 Mbps

## Best Practices

✅ Multi-bitrate encoding (adaptive)
✅ Hardware acceleration when available
✅ Async processing (queue jobs)
✅ Monitor CPU usage

## Learn More

- [theory.md](theory.md)
- [FFmpeg Docs](https://ffmpeg.org/)

## Next Module

[06 - HLS Streaming](../06-hls-streaming-segments-manifest/)
