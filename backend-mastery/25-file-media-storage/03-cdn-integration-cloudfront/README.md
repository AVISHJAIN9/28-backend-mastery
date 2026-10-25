# 03 - CDN Integration CloudFront

## Overview

Learn CloudFront CDN integration for distributing content globally with caching and invalidation.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with AWS credentials
npm run dev
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Create Distribution
```
POST /api/distribution
```

### Get Distribution Config  
```
GET /api/distribution/config
```

### Invalidate Cache
```
POST /api/invalidate
Body: { "paths": ["/", "/images/*"] }
```

### Get Invalidation Status
```
GET /api/invalidation/:invalidationId
```

### Generate CDN URL
```
POST /api/cdn-url
Body: { "path": "/images/photo.jpg" }
```

## Learn More

- [theory.md](theory.md) - CDN concepts
- [setup.md](setup.md) - Setup guide
- [AWS CloudFront Docs](https://docs.aws.amazon.com/cloudfront/)

## Next Module

[04 - Image Processing](../04-image-processing-sharp-webp/)
