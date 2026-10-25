# Theory - Image Processing & Optimization

## Digital Images

### Fundamentals
- **Pixel**: Single colored dot in image
- **Resolution**: Width × Height (e.g., 1920×1080)
- **DPI**: Quality for print (72 screen, 300 print)
- **Color Depth**: 8-bit (256 colors), 24-bit (16M colors), 32-bit (16M + transparency)

## Image Formats

### JPEG
- **Compression**: Lossy (removes data)
- **Use**: Photos, realistic images
- **Pros**: Small files, universal support
- **Cons**: Quality loss, no transparency
- **Sizes**: 10-50KB typical

### PNG  
- **Compression**: Lossless (no data loss)
- **Use**: Graphics, logos, transparency
- **Pros**: Perfect quality, alpha channel
- **Cons**: Larger files
- **Sizes**: 50-200KB typical

### WebP
- **Compression**: Lossy & lossless
- **Use**: Web optimization
- **Pros**: 25-35% smaller than JPEG
- **Cons**: Older browsers need fallback
- **Sizes**: 8-40KB typical

### AVIF
- **Compression**: Modern, high-ratio
- **Use**: Future-proof optimization
- **Pros**: 20% smaller than WebP
- **Cons**: Limited browser support (growing)

## Image Processing Techniques

### Resizing
Scale image to new dimensions:
```
Original: 4000×3000
Resized: 800×600 (62.5% compression)
```

**Fit Strategies:**
- `contain`: Fit inside, add padding
- `cover`: Fill area, may crop
- `fill`: Stretch to fill
- `inside`: Fit inside, no exceed

### Format Conversion
Transform between formats:
```
JPEG (100KB) → WebP (75KB) = 25% saving
```

### Quality Optimization
- 80% quality often indistinguishable from 100%
- 60-70% quality good for thumbnails
- 90%+ only for high-end printing

## Real-World Examples

### E-commerce Product Images
```
Thumbnail: 200×200px, WebP, quality 80 (8KB)
Gallery: 600×600px, WebP, quality 85 (25KB)
Zoom: 2000×2000px, WebP, quality 90 (150KB)
```

### Social Media
```
Profile: 120×120px, JPEG (3KB)
Thumbnail: 200×200px, WebP (5KB)
Feed: 600×600px, WebP (30KB)
Desktop: 1200×800px, WebP (60KB)
```

### Blog/CMS
```
Featured: 1200×630px, WebP, q80 (75KB)
Content: 800×600px, WebP, q80 (40KB)
Thumbnail: 300×300px, WebP, q75 (12KB)
```

## Performance Impact

### File Size Reduction
- JPEG to WebP: 25-35% smaller
- Resize 4000px → 800px: 75% smaller
- Optimal quality: 10-20% smaller vs max

### Page Load Benefits
```
Optimized images:
- Faster load times
- Lower bandwidth
- Better mobile experience
- Improved SEO rankings
```

## Security Considerations

1. **Validate inputs**: Check file size, dimensions
2. **Sanitize filenames**: Remove special chars
3. **Remove metadata**: Strip EXIF data
4. **Rate limit**: Prevent resource exhaustion
5. **Authorized users**: Check permissions

## Summary

✅ WebP is 25-35% smaller than JPEG  
✅ Resize to display size (80% bandwidth saving)
✅ Quality 75-80% is usually optimal  
✅ Cache processed images globally  
✅ Strip EXIF for privacy
