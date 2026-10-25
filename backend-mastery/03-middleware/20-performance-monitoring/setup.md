# Performance Monitoring Setup

## Key APIs Used
- `process.hrtime()` - High-resolution timer
- `process.memoryUsage()` - Memory stats
- `process.uptime()` - Server uptime

## Implementation
Attach middleware early to capture all requests and measure their performance impact
