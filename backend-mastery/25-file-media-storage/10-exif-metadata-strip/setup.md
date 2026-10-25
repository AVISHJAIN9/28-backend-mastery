# Setup - EXIF Metadata Strip

## Prerequisites

- Node.js 18+
- npm or yarn
- Image files for testing

## Installation

### 1. Install Dependencies
```bash
cd 10-exif-metadata-strip
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

Server runs on http://localhost:6610

## Testing

### Extract Metadata
```bash
curl -X POST http://localhost:6610/api/extract-metadata \\
  -F "file=@photo.jpg"
```

Response shows all metadata (GPS, camera info, etc)

### Remove Metadata
```bash
curl -X POST http://localhost:6610/api/strip-exif \\
  -F "file=@photo.jpg" \\
  --output cleaned.jpg
```

Cleaned.jpg has no EXIF data

### Verify Removal
```bash
# Use exiftool to verify
exiftool cleaned.jpg
# Should show minimal or no EXIF data
```

## Privacy Check

Before:
```
GPS Latitude: 40.7128
GPS Longitude: -74.0060
Camera: Canon EOS 5D
Date: 2024-01-15T14:30:00
```

After Stripping:
```
(No EXIF data)
```

## Troubleshooting

### Sharp Installation
```bash
npm rebuild sharp
```

### EXIF Still Present
```bash
Verify Sharp version
Check withMetadata(false)
```

## Next Steps

1. Test with your photos
2. Understand privacy implications
3. Course complete! 🎉

You've mastered all 10 modules of File & Media Storage!
