# Theory & Concepts
## Response Compression Overview
Compression middleware reduces response size by compressing text-based content (JSON, HTML, CSS, JS) before sending to browser.

## Compression Algorithms
- **Gzip**: Standard compression, 60-70% reduction, widely supported
- **Brotli**: Newer algorithm, 15-20% better than gzip, modern browsers
- **Deflate**: Older, rarely used

## How It Works
1. Client sends: Accept-Encoding: gzip, deflate, br
2. Browser tells server what compression it supports
3. Server compresses response body
4. Server sends: Content-Encoding: gzip
5. Browser automatically decompresses
6. User sees normal uncompressed content

## Compression Ratios
- **JSON**: 60-80% reduction (highly compressible)
- **HTML**: 50-70% reduction
- **CSS**: 60-80% reduction
- **JavaScript**: 60-80% reduction
- **Images**: Already compressed, skip (waste of CPU)
- **Videos**: Already compressed, skip

## Configuration
- **Threshold**: Minimum size to compress (1KB default)
- **Level**: 1-11 (higher = better compression, slower)
- **Filter**: Which content types to compress

## Performance Tradeoff
- **Benefit**: 60-80% bandwidth reduction
- **Cost**: CPU used for compression
- **Win**: Faster for client, works for most APIs
- **Monitor**: Track CPU usage on high-traffic servers
