# Cloudinary Image CDN

## What is this?

Cloudinary is an image/video management platform providing:
- **Image Upload**: Store images with automatic backups
- **Responsive Transformations**: Auto-resize images for device width
- **Format Optimization**: Auto-convert WebP for newer browsers, JPG for older
- **Smart Cropping**: AI detects faces/objects, crops intelligently
- **CDN Distribution**: Global edge network delivers images in < 100ms
- **Digital Asset Management**: Organize, tag, search millions of images
- **Video Transcoding**: Convert videos to HLS for streaming

## Why does it matter?

Images account for 50% of web page weight. Cloudinary reduces image size by 40-60% through format optimization and responsive delivery. Smart cropping prevents cutting heads off in thumbnails. Global CDN reduces latency and bandwidth costs by 80% compared to origin server.

## How it works (step by step)

1. **Upload Request**: POST `/api/images/upload` with image file
2. **Validation**: Check format (JPG, PNG, WebP), size < 100MB
3. **Send to Cloudinary**: Backend uploads to Cloudinary API
4. **Generate Transformations**: Cloudinary creates responsive sizes (100px, 300px, 800px)
5. **CDN Caching**: Images cached globally, subsequent requests served from edge
6. **Retrieve URL**: Backend stores Cloudinary URL in database
7. **Responsive Display**: HTML img srcset uses multiple sizes
8. **Lazy Loading**: Images load only when in viewport

## Key concepts

- **Transformations**: URL parameters apply transformations (width, height, crop, quality)
- **Quality Optimization**: Auto-adjust quality to target file size
- **Format Detection**: Browser sends Accept header, Cloudinary returns best format
- **Responsive Images**: Different sizes for mobile (400px) vs desktop (1200px)
- **Smart Crop**: AI detects faces, ensures they're in frame
- **Asset Metadata**: Store width, height, aspect ratio for layout
- **Upload Presets**: Restrict uploads to specific folders, auto-apply tags
- **Signed URLs**: Temporary URLs with 1-hour expiration for private images

## Common mistakes

1. **Storing large PNG files** → 2MB per image, slow downloads → Cloudinary converts to WebP (0.3MB)
2. **Same image size for mobile and desktop** → 4500px image on 375px phone → Use responsive srcset
3. **Uploading unoptimized video** → 50MB video doesn't stream → Cloudinary transcodes to HLS
4. **No lazy loading** → Load 50 images on page load = slow → Use loading="lazy" attribute
5. **Public upload endpoint** → Anyone uploads images to bucket → Use unsigned presets with auth
6. **Not caching images** → Every request hits origin → Cloudinary caches for 1 year

## Real world usage

**E-commerce**: Product images uploaded → Cloudinary generates 40px thumbnail →  400px mobile → 1200px desktop → srcset serves best size per device
**Social Media**: User uploads profile picture → Cloudinary crops to face → serves 48px for profile, 500px for full view
**Real Estate**: Listing has 50 photos → uploaded to Cloudinary → lazy loaded as user scrolls → fast page load
**Email Newsletter**: 100 recipients receive HTML email with images → served from CDN edge in their region → < 100ms latency

## API Endpoints

### Upload
- `POST /api/images/upload` - Upload image
- `POST /api/images/upload-url` - Get signed upload URL
- `DELETE /api/images/:id` - Delete image

### Transformations
- `GET /api/images/:id/thumbnail` - Get thumbnail URL
- `GET /api/images/:id/responsive` - Get responsive image sizes
- `GET /api/images/:id/crop` - Get smart-cropped image

### Management
- `GET /api/images` - List user's images
- `PUT /api/images/:id/tags` - Tag image for organization
- `GET /api/images/search` - Search images by tag

## Quick Start

```bash
npm install
node server.js
# Running on http://localhost:6312
```

## Testing

```bash
# Upload image
curl -X POST http://localhost:6312/api/images/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@photo.jpg" \
  -F "public_id=product-001"

# Get thumbnail
curl "http://localhost:6312/api/images/photo-123/thumbnail?width=100&height=100"

# Get responsive sizes
curl http://localhost:6312/api/images/photo-123/responsive

# Smart crop
curl "http://localhost:6312/api/images/photo-123/crop?aspect_ratio=1:1&gravity=face"
```
