# Theory - HLS Streaming

## HLS Overview

### What is HLS?
- HTTP Live Streaming
- Apple's adaptive streaming protocol
- Segment-based (chunks of 10 seconds)
- Playlist-driven (M3U8 format)
- Works over standard HTTP

### Why HLS?
- Works through firewalls/proxies
- CDN-friendly (standard HTTP)
- Adaptive bitrate (quality switching)
- Wide device support
- Reliable delivery

## HLS Architecture

### Components
1. **Media Segment**: 10-second TS file
2. **Playlist**: M3U8 text file listing segments
3. **Master Playlist**: Lists quality options
4. **Media Server**: Generates segments
5. **CDN**: Distributes segments globally

### Flow
```
Live source (camera/encoder)
  ↓
Encode to H.264 + AAC
  ↓
Segment into 10-second chunks
  ↓
Generate M3U8 playlist
  ↓
Publish to CDN
  ↓
Clients stream via standard HTTP
```

## M3U8 Playlist Format

### Live Playlist
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
segment-0.ts
#EXTINF:10.0,
segment-1.ts
#EXTINF:10.0,
segment-2.ts
```

### Tags
- `#EXT-X-VERSION`: HLS version
- `#EXT-X-TARGETDURATION`: Max segment duration
- `#EXT-X-MEDIA-SEQUENCE`: Segment numbering
- `#EXTINF`: Individual segment duration

## Segment Management

### Sliding Window
- Keep last 3-5 segments
- Remove oldest when new arrives
- Allows rewind 30-50 seconds
- Limits latency

### Example
```
Time 0: [seg-0, seg-1, seg-2]
Time 10: [seg-1, seg-2, seg-3]
Time 20: [seg-2, seg-3, seg-4]
```

## Adaptive Bitrate (ABR)

### Master Playlist
```
#EXT-X-STREAM-INF:BANDWIDTH=1280000
low.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2560000
mid.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=7680000
high.m3u8
```

### Player Logic
1. Measure available bandwidth
2. Select appropriate variant
3. Switch if network changes
4. Maintain smooth playback

## Real-World Metrics

### Latency
- Traditional HLS: 20-60 seconds
- Optimized: 6-10 seconds
- Low-latency LL-HLS: <3 seconds

### Buffer
- Minimum: 1-2 segments (10-20 seconds)
- Optimal: 3-5 segments (30-50 seconds)
- Maximum: 20+ segments (200+ seconds)

## Use Cases

### Live Streaming
- News, sports, events
- Conferences, webinars
- Gaming streams
- 24/7 broadcast

### On-Demand
- Movies, shows
- Educational content
- Training videos
- User-generated content

## Summary

✅ HLS uses standard HTTP
✅ Segments are 10-second TS files
✅ Playlist (M3U8) lists segments
✅ Sliding window limits latency
✅ Adaptive bitrate optimizes quality
✅ Works reliably worldwide
