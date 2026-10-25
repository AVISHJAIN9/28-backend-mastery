# Setup Guide - Module 03: CloudFront CDN

## Prerequisites
- Node.js 16+
- AWS Account with CloudFront access
- Existing S3 bucket

## Setup Steps

### 1. Install Dependencies
```bash
cd 03-cdn-integration-cloudfront
npm install
```

### 2. Configure AWS
```bash
cp .env.example .env
# Edit .env with:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY  
# AWS_CLOUDFRONT_DISTRIBUTION_ID
# AWS_CLOUDFRONT_DOMAIN_NAME
```

### 3. Start Server
```bash
npm run dev
```

### 4. Test
```bash
curl http://localhost:6603/api/health
```

## Configuration

See .env.example for all configuration options.

## Testing

Use React UI or cURL:
```bash
# Invalidate cache
curl -X POST http://localhost:6603/api/invalidate \
  -H "Content-Type: application/json" \
  -d '{"paths":["/", "/images/*"]}'
```

## Troubleshooting

- Check AWS credentials
- Verify CloudFront distribution exists
- Check distribution is enabled
## Dependencies
```bash
npm install 
```
## Environment Variables
## How to run
## How to test
