# 09 - Virus Scanning with ClamAV

## Overview

Learn file security through virus scanning integration with ClamAV.

## API Endpoints

### Scan File
```
POST /api/scan
Content-Type: multipart/form-data
File: <binary>
```

### Quick Scan (Signatures only)
```
POST /api/quick-scan
```

## Setup ClamAV

### macOS
```bash
brew install clamav
freshclam  # Update signatures
clamd  # Start daemon
```

### Linux
```bash
sudo apt install clamav clamav-daemon
sudo systemctl start clamav-daemon
```

## Scan Results

```json
{
  "success": true,
  "fileName": "file.zip",
  "fileSize": 1024000,
  "scanStatus": "completed",
  "result": "clean",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Best Practices

✅ Scan all uploads
✅ Quarantine suspicious files
✅ Update signatures regularly
✅ Set scan timeouts
✅ Log all scan results

## Learn More

- [theory.md](theory.md)
- [ClamAV Docs](https://www.clamav.net/)

## Next Module

[10 - EXIF Metadata](../10-exif-metadata-strip/)
