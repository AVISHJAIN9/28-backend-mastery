# Setup Guide - File Upload Controller

## Installation

```bash
npm install express multer aws-sdk uuid joi dotenv
```

### Dependencies
- **multer**: Parse multipart form data
- **aws-sdk**: S3 cloud storage
- **uuid**: Generate unique filenames
- **joi**: File validation schemas

## Environment Variables

```env
HTTP_PORT=5004
NODE_ENV=development

# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_TYPES=jpg,jpeg,png,pdf,doc,docx

# Optional: S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=your-bucket-name
```

## Running

```bash
# Create upload directory
mkdir -p uploads
chmod 755 uploads

# Start server
npm start

# Server on http://localhost:5004
```

## Testing

**Upload Single File**:
```bash
curl -F "file=@image.jpg" http://localhost:5004/api/upload
```

**Upload Multiple Files**:
```bash
curl -F "files=@image1.jpg" -F "files=@image2.jpg" \
  http://localhost:5004/api/uploads
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|----------|
| POST | `/api/upload` | Upload single file |
| POST | `/api/uploads` | Upload multiple files |
| GET | `/api/files/:id` | Download file |
| DELETE | `/api/files/:id` | Delete file |

## Security Best Practices

1. **Validate file type**: Check MIME type AND magic bytes
2. **Limit file size**: Set reasonable max size
3. **Use unique names**: Prevent overwriting, path traversal
4. **Scan for malware**: Use ClamAV or similar
5. **Restrict access**: Store outside web root
6. **Set permissions**: 644 for files, 755 for directories
7. **Use HTTPS**: Encrypt in transit
8. **Rate limit**: Prevent upload abuse
