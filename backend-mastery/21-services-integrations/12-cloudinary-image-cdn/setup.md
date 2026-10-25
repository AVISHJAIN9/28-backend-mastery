# Cloudinary Image CDN Setup Guide

## Prerequisites

- Cloudinary account (https://cloudinary.com)
- Node.js 18.x or higher
- Images for testing

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Cloudinary Account

1. Sign up at https://cloudinary.com
2. Copy credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret
3. (Optional) Upgrade to paid plan for higher limits

## Step 3: Create .env File

```bash
cp .env.example .env
```

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=your-preset
JWT_SECRET=your-super-secret-key
HTTP_PORT=6312
```

## Step 4: Create Upload Preset

1. Go to Settings > Upload > Upload presets
2. Create preset named in .env
3. Set:
   - Mode: Unsigned (for public uploads) or Signed
   - Folder: `/my-app/uploads`
   - Auto tagging: 0.5
   - Resource type: Image and Video

## Step 5: Configure Transformations

Create transformation presets:
```javascript
const thumbnailUrl = cloudinary.url('image.jpg', {
  width: 100,
  height: 100,
  crop: 'fill',
  src: 'fetch'
});

const responsiveUrl = cloudinary.url('image.jpg', {
  responsive: true,
  crop: 'fill'
});
```

## Step 6: Setup Signed URLs (Optional)

For private images with temporary access:
```javascript
const signedUrl = cloudinary.url('private-image.jpg', {
  sign_url: true,
  type: 'authenticated',
  expires_at: Math.floor(Date.now() / 1000) + 3600
});
```

## Step 7: Run Development Server

```bash
node server.js
# Server runs on http://localhost:6312
```

## How to test

```bash
# Upload image
curl -X POST http://localhost:6312/api/images/upload \
  -H "Authorization: Bearer token" \
  -F "file=@photo.jpg" \
  -F "public_id=my-photo"

# Get thumbnail
curl "http://localhost:6312/api/images/photo-123/thumbnail?width=100&height=100"

# Get responsive image sizes
curl http://localhost:6312/api/images/photo-123/responsive

# Smart crop (crop to face)
curl "http://localhost:6312/api/images/photo-123/crop?aspect_ratio=1:1&gravity=face"

# Search images by tag
curl http://localhost:6312/api/images/search?tag=product

# Get image info
curl http://localhost:6312/api/images/photo-123/info \
  -H "Authorization: Bearer token"

# Delete image
curl -X DELETE http://localhost:6312/api/images/photo-123 \
  -H "Authorization: Bearer token"
```

## Verification Checklist

- [ ] Cloudinary account created
- [ ] Cloud Name in .env
- [ ] API Key in .env
- [ ] API Secret in .env
- [ ] Upload preset created
- [ ] Server starts without errors
- [ ] Images upload successfully
- [ ] Thumbnails generate at different sizes
- [ ] Responsive images work
- [ ] Smart crop feature works
- [ ] Image CDN delivery working
- [ ] Signed URLs secure private images
- [ ] Transformation cache working

## Performance Tips

1. Enable responsive images for all uploads
2. Use smart crop for user-generated content
3. Set automatic quality to deliver WebP/AVIF
4. Enable lazy loading in HTML
5. Cache transformed URLs for 1 year
6. Monitor usage dashboard
7. Setup webhooks for bulk operations
