# Theory - Video Transcoding & Streaming

## Video Fundamentals

### Components
- **Frame**: Single image in sequence
- **Frame Rate**: Frames per second (24/30/60 fps)
- **Bitrate**: Data rate (Mbps)
- **Codec**: Compression algorithm
- **Container**: File format (MP4, WebM, MKV)

## Video Codecs

### H.264 (AVC)
- **Efficiency**: Good compression-quality ratio
- **Support**: Universal, >95% devices
- **Speed**: Slower encoding
- **Use**: Current standard

### VP9
- **Efficiency**: 25-50% better compression
- **Support**: Modern browsers, YouTube
- **Speed**: Very slow encoding
- **Use**: Next-generation standard

### AV1
- **Efficiency**: 30% better than VP9
- **Support**: Limited (growing)
- **Speed**: Extremely slow
- **Use**: Future standard

## Bitrate Optimization

### Quality Levels
```
480p: 1-2 Mbps (good for mobile)
720p: 2.5-5 Mbps (recommended)
1080p: 5-10 Mbps (high quality)
4K: 20-60 Mbps (cinema)
```

### Bandwidth Savings
- Original: 100 Mbps
- H.264 optimal: 5 Mbps (98% reduction)
- VP9 optimal: 3 Mbps (97% reduction)

## Streaming Protocols

### HLS (HTTP Live Streaming)
- Apple standard
- Segment-based (10-second chunks)
- M3U8 playlist format
- Wide device support

### DASH (Dynamic Adaptive Streaming)
- MPEG standard
- Segment-based
- MPD manifest format
- Advanced adaptation

### RTMP (Deprecated)
- Adobe Flash-era protocol
- Real-time streaming
- Now replaced by HLS/DASH

## Adaptive Bitrate (ABR)

### How It Works
```
User 4G: 5000 kbps → 1080p stream
User WiFi: 25000 kbps → 4K stream
User 3G: 500 kbps → 480p stream
```

### Implementation
1. Encode same video at multiple bitrates
2. Create manifest with options
3. Player measures bandwidth
4. Switch quality dynamically
5. Seamless playback

## Real-World Examples

### Netflix Pipeline
```
Source video (100+ Mbps)
 ↓
Encode to H.264 (multiple bitrates)
Encode to VP9 (multiple bitrates)
Generate HLS/DASH manifests
Distribute to CDN
Users stream adaptive quality
```

### Live Streaming
```
1. Producer encodes to H.264 single bitrate
2. Segments created every 2-10 seconds
3. Manifest updated with new segments
4. Viewers connect to stream
5. Global CDN distribution
```

## Summary

✅ H.264 is current standard
✅ VP9/AV1 offer better compression
✅ Multi-bitrate encoding enables adaptation
✅ HLS/DASH provide reliable delivery
✅ Optimal bitrate depends on resolution
