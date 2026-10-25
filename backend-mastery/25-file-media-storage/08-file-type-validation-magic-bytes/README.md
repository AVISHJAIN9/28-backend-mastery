# 08 - File Type Validation with Magic Bytes

## Overview

Learn file validation using magic byte (file signature) detection to prevent spoofing.

## API Endpoints

### Validate File
```
POST /api/validate
Content-Type: multipart/form-data
File: <binary>
```

### Response
```json
{
  "success": true,
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg",
  "detectedType": "jpeg",
  "size": 2097152,
  "isValid": true
}
```

## Common Magic Bytes

| Format | Signature | Hex |
|--------|-----------|-----|
| JPEG | FFD8FF | ...jpg |
| PNG | 89504E47 | ...png |
| GIF | 474946 | ...gif |
| PDF | 25504446 | %PDF |
| ZIP | 504B0304 | PK.. |
| MP4 | 0000... | ftyp |

## Why Magic Bytes?

✅ Can't trust file extensions
✅ Extensions easily spoofed
✅ Magic bytes in file header
✅ Reliable format detection
✅ Security requirement

## Best Practices

✅ Always validate on server
✅ Don't trust client data
✅ Check extension AND magic bytes
✅ Whitelist allowed types
✅ Log validation failures

## Learn More

- [theory.md](theory.md)
- [File Signatures](https://en.wikipedia.org/wiki/List_of_file_signatures)

## Next Module

[09 - Virus Scanning](../09-virus-scanning-clamav/)
