# Setup - File Type Validation

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

### 1. Install Dependencies
```bash
cd 08-file-type-validation-magic-bytes
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

Server runs on http://localhost:6608

## Testing

### Health Check
```bash
curl http://localhost:6608/api/health
```

### Validate Image File
```bash
curl -X POST http://localhost:6608/api/validate \\
  -F "file=@/path/to/image.jpg"
```

Expected response:
```json
{
  "success": true,
  "fileName": "image.jpg",
  "detectedType": "jpeg",
  "isValid": true
}
```

### Test with Wrong Extension
```bash
# Rename .jpg to .txt and test
cp image.jpg fake.txt
curl -X POST http://localhost:6608/api/validate \\
  -F "file=@fake.txt"
```

Expected: Detects as JPEG despite .txt extension

## Common Magic Bytes

- JPEG: `FF D8 FF`
- PNG: `89 50 4E 47`
- GIF: `47 49 46`
- PDF: `25 50 44 46`
- ZIP: `50 4B 03 04`

## Troubleshooting

### File Upload Fails
```
Check multipart form-data
Verify file exists
Check file permissions
```

### Always Returns Unknown
```
Verify file is actual binary
Check magic byte database
Add more signatures
```

## Next Steps

1. Test various file types
2. Study magic bytes
3. [Module 09 - Virus Scanning](../09-virus-scanning-clamav/)
