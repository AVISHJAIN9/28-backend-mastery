# Image CDN & Optimization: Theory & Concepts

## 1. Image Formats

### Format Comparison
```
Format    | Compression | Transparency | Support   | Use Case
----------|-------------|--------------|-----------|-------------------
JPEG      | Lossy 90%   | No           | Universal | Photographs
PNG       | Lossless    | Yes          | Universal | Screenshots, logos
WebP      | Lossy 80%   | Yes          | Chrome    | Web (smaller files)
AVIF      | Lossy 75%   | Yes          | Modern    | Future standard
GIF       | Lossless    | Yes          | Universal | Animations
SVG       | Vector      | Yes          | Universal | Icons, logos
```

### Quality vs File Size
```
JPEG quality settings (1-100):

Quality 100: 500 KB (lossless, largest)
Quality 80:  100 KB (imperceptible loss)
Quality 60:  50 KB (noticeable artifacts)
Quality 40:  25 KB (very lossy)

Best practice: Quality 75-85 (sweet spot)
```

## 2. Responsive Images

### Device-Specific Sizing
```
Desktop user (1920x1080):
  Fetch: /image_1920.jpg (2 MB)

Tablet user (768x1024):
  Fetch: /image_768.jpg (0.5 MB)

Mobile user (375x667):
  Fetch: /image_375.jpg (0.1 MB)

Same image, different sizes = 20x smaller on mobile
```

### Srcset Implementation
```html
<img 
  srcset="image_375.jpg 375w, image_768.jpg 768w, image_1920.jpg 1920w"
  src="image_1920.jpg"
  alt="Product"
/>

Browser automatically selects based on:
- Screen width
- Device pixel ratio (Retina = 2x)
- Viewport meta tag
```

## 3. Smart Cropping

### Face Detection
```
Problem: Admin uploads 4000x3000 image
Needs 100x100 thumbnail
Auto crop creates empty 100x100 of sky (no face)

Solution: Smart crop with face detection
1. Detect faces in image
2. Crop to include largest face
3. Result: 100x100 with face centered
```

### Aspect Ratio Preservation
```
Original: 16:9 widescreen
Needed: 1:1 square

Dumb crop: Cuts off sides (distorted)
Smart crop: Detects subject, crops intelligently
```

## 4. CDN Caching

### Cache TTL (Time To Live)
```
Image uploaded to Cloudinary
  ↓
User 1 in Tokyo requests image
  ↓
Cloudinary edge in Tokyo caches
  ↓
Image cached for 31536000 seconds (1 year)
  ↓
User 2 in Tokyo requests same image (1 hour later)
  ↓
Served from Tokyo edge (instant, < 10ms)
  ↓
No origin fetch, saves bandwidth & latency
```

### Cache Invalidation
```
Author updates image
  ↓
Upload new version
  ↓
Old cached version still served for 1 hour
  ↓
Users see stale image
  ↓
Solution: Use Cache Busting token
  /image_v2.jpg (forces new cache entry)
  or
  /image.jpg?v=2 (query parameter busts cache)
```

## 5. Performance Metrics

### Largest Contentful Paint (LCP)
```
Time until largest element (usually image) renders:
Target: < 2.5 seconds

Page with unoptimized images:
  3 images x 2 MB = 6 MB
  On 3G network: 6 MB / (1.5 Mbps) = 32 seconds (SLOW)

With Cloudinary optimization:
  3 images x 0.2 MB (WebP) = 0.6 MB
  On 3G: 0.6 / 1.5 = 2.4 seconds (FAST)
```

### Cumulative Layout Shift (CLS)
Images without dimensions cause layout shift:
```html
<!-- BAD - Causes CLS -->
<img src="image.jpg" />
<!-- Height unknown, page jumps when image loads -->

<!-- GOOD - Prevents CLS -->
<img src="image.jpg" width="800" height="600" />
<!-- Browser reserves space, no jump -->
```

## 6. Transformation URLs

### Cloudinary URL Pattern
```
https://res.cloudinary.com/{cloud}/image/upload/
  {transformations}/
  {version}/{public_id}.{format}

Example:
https://res.cloudinary.com/myapp/image/upload/
  w_100,h_100,c_fill,g_face/
  v1234567/profile_pic.jpg

Transformations:
  w_100 = Width 100px
  h_100 = Height 100px
  c_fill = Crop to fill (don't distort)
  g_face = Gravity (use face detection)
```

## 7. Security Checklist

- [ ] Images deployed to CDN (not origin server)
- [ ] Cache headers: 1 year for immutable URLs
- [ ] Cache busting: Version tokens for updates
- [ ] Lazy loading: loading="lazy" attribute
- [ ] Responsive images: srcset for multiple sizes
- [ ] Formats: WebP/AVIF for modern browsers, JPG fallback
- [ ] Quality: 75-85 JPEG quality (sweet spot)
- [ ] Smart crop: Face detection enabled
- [ ] Dimensions: width/height attributes to prevent CLS
- [ ] Alt text: Descriptive for accessibility
- [ ] Signed URLs: Private images require signatures
- [ ] Watermarking: Protect original artist work
- [ ] EXIF stripping: Remove camera metadata
- [ ] Abuse prevention: Rate limit download requests
