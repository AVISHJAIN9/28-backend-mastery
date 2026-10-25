# Module 20: Debugging & Inspector - Checklist

## Inspector Concepts
- [ ] Understand Chrome DevTools Protocol (CDP)
- [ ] Know how to start Node with --inspect
- [ ] Know --inspect vs --inspect-brk
- [ ] Understand port configuration
- [ ] Know how to connect from Chrome

## Debugging Tools
- [ ] Use DevTools breakpoints
- [ ] Use conditional breakpoints
- [ ] Set watch expressions
- [ ] Use debugger statement
- [ ] Understand call stack viewing

## Profiling Techniques
- [ ] CPU profiling methods
- [ ] Memory profiling methods
- [ ] Heap snapshots
- [ ] Flame graphs interpretation
- [ ] Performance timeline analysis

## Memory Analysis
- [ ] Understand heap allocation
- [ ] Detect memory leaks
- [ ] Analyze object retention
- [ ] Track memory growth patterns
- [ ] Use heap snapshots

## Debugging Patterns
- [ ] Request logging
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] Stack trace analysis
- [ ] Function tracing

## Performance Analysis
- [ ] CPU usage tracking
- [ ] Event loop lag detection
- [ ] Memory trend analysis
- [ ] Throughput measurement
- [ ] Latency profiling

## API Endpoints
- [ ] GET /api/debug/inspector-info
- [ ] POST /api/debug/cpu-intensive
- [ ] GET /api/debug/memory-usage
- [ ] GET /api/debug/performance
- [ ] POST /api/debug/breakpoint-test
- [ ] POST /api/debug/slow-function
- [ ] POST /api/debug/trigger-error
- [ ] GET /api/debug/stats
- [ ] GET /health
- [ ] GET /

## Best Practices
- [ ] Never log sensitive data
- [ ] Use appropriate log levels
- [ ] Structure logs for analysis
- [ ] Remove debugger statements before deploy
- [ ] Monitor production safely

## Deployment
- [ ] .env.example configured
- [ ] PORT set to 3020
- [ ] Dependencies installed
- [ ] Server starts: npm start
- [ ] Debug mode: npm run debug
