# 04 - Image Processing with Sharp & WebP

## Overview

Learn image processing, resizing, format conversion to WebP, and optimization.

## Quick Start

```bash
npm install
cp .env.example .env
echo 'HTTP_PORT=6604' >> .env
npm run dev
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Resize Image
```
POST /api/resize
Content-Type: application/json
body: { "width": 800, "height": 600, "fit": "cover", "format": "webp" }
```

### Extract Metadata
```
POST /api/metadata
```

### Convert Format
```
POST /api/convert
body: { "newFormat": "webp", "quality": 80 }
```

## Image Optimization

### Formats
- JPEG: Best for photos (10-50KB typical)
- PNG: Best for graphics with transparency
- WebP: Modern format, 25-35% smaller
- AVIF: Next-gen, 20% smaller than WebP

### Resize Modes
- `cover`: Fill area, crop excess
- `contain`: Fit inside, preserve aspect
- `fill`: Stretch to fill

### Quality Settings
- 1-50: Low quality, tiny files
- 50-75: Medium quality, good size
- 75-90: High quality, larger
- 90+: Maximum quality

## Best Practices

✅ Always resize to display size
✅ Convert to WebP for web
✅ Set quality to 75-80 for optimal balance
✅ Cache processed images
✅ Remove EXIF data for privacy

## Learn More

- [theory.md](theory.md) - Image concepts
- [setup.md](setup.md) - Detailed setup
- [Sharp Docs](https://sharp.pixelplumbing.com/)

## Next Module

[05 - Video Transcoding](../05-video-transcoding-ffmpeg-hls-dash/)
