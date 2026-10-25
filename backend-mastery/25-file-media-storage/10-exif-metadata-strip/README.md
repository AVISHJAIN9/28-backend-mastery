# 10 - EXIF Metadata Extraction & Removal

## Overview

Learn EXIF metadata handling for privacy protection and data sanitization.

## API Endpoints

### Remove EXIF Data
```
POST /api/strip-exif
Content-Type: multipart/form-data
File: <image>
```

### Extract Metadata
```
POST /api/extract-metadata
Content-Type: multipart/form-data
File: <image>
```

## EXIF Data

Common metadata:
- GPS coordinates
- Camera make/model
- Lens information
- Exposure settings
- Date/time taken
- Copyright info

## Privacy Risks

⚠️ GPS location exposed
⚠️ Equipment fingerprinting  
⚠️ File creation timestamp
⚠️ Device serial numbers

## Best Practices

✅ Strip EXIF before storage
✅ Warn users about data
✅ Allow opt-in for metadata
✅ Log metadata removal
✅ GDPR compliance

## Learn More

- [theory.md](theory.md)
- [EXIF Standard](https://en.wikipedia.org/wiki/Exif)

## Course Complete!

You've mastered all 10 modules of File & Media Storage.
