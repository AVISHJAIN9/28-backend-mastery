# 05 - Worker Concurrency Control

## What is this?

Worker concurrency control is the practice of managing how many jobs execute simultaneously in a queue. Instead of processing all jobs at once (which could overwhelm resources) or one at a time (which is slow), you configure the optimal number of concurrent workers based on your system's capabilities.

## Why does it matter?

**Resource Management**: Without concurrency control, you might:
- Exhaust CPU on compute-intensive tasks
- Exhaust I/O connections on database operations
- Run out of memory processing large datasets
- Timeout on slow operations

**Performance**: Proper concurrency settings mean:
- Maximum throughput for your hardware
- Consistent response times
- No resource starvation
- Efficient queue processing

## How it works (step by step)

1. **Define queue concurrency level**
   ```javascript
   const queue = new Queue('tasks', {
     defaultJobOptions: { attempts: 3 }
   });
   
   queue.process(10, handler); // 10 concurrent workers
   ```

2. **Submit jobs to appropriate queue**
   - High concurrency queue (10 workers) → I/O-bound tasks
   - Low concurrency queue (1 worker) → CPU-intensive tasks
   - Adaptive queue (5 workers) → Mixed workloads

3. **Workers process jobs concurrently**
   - Each worker processes one job at a time
   - When a worker finishes, it picks up the next job
   - Queue ensures no more than N jobs run simultaneously

4. **Monitor and adjust**
   - Check system load
   - Monitor queue depth
   - Adjust worker count if needed

## Key concepts

### CPU-Bound Tasks
Tasks that consume CPU cycles:
- Image processing
- Video encoding
- Mathematical computations
- Data analysis

**Recommendation**: Use concurrency = number of CPU cores

### I/O-Bound Tasks
Tasks that wait for external resources:
- API calls
- Database queries
- File downloads
- Network requests

**Recommendation**: Use concurrency = 10+ workers (network operations have latency)

### Memory-Bound Tasks
Tasks that consume significant RAM:
- Large data processing
- In-memory caching
- Batch aggregations

**Recommendation**: Use concurrency = RAM available / memory per task

### Adaptive Concurrency
Automatically adjust worker count based on:
- Current CPU usage
- Memory availability
- Queue depth
- Historical performance

## Common mistakes

1. **Setting concurrency too high**
   ```javascript
   // ❌ DON'T - Will crash with 1000 concurrent tasks
   queue.process(1000, handler);
   ```
   Solution: Start with (CPU cores × 2) and monitor

2. **Same concurrency for different task types**
   ```javascript
   // ❌ DON'T - CPU tasks should be 4, I/O should be 20
   const queue = new Queue('mixed', {
     concurrency: 10
   });
   ```
   Solution: Use separate queues for CPU and I/O tasks

3. **Not monitoring resource usage**
   - Set and forget concurrency settings
   - Solution: Monitor CPU, memory, and queue depth continuously

4. **Fixed concurrency in dynamic environments**
   - Set on deployment, never adjusted
   - Solution: Use adaptive concurrency or environment-based configuration

## Real world usage

### E-Commerce Order Processing
```javascript
// I/O-heavy: database writes + API calls
const orderQueue = new Queue('orders', { concurrency: 20 });
// Process 20 orders simultaneously
```

### Image Resizing Service
```javascript
// CPU-heavy: image processing
const imageQueue = new Queue('images', { concurrency: 4 });
// Process 4 images (matches 4 CPU cores)
```

### API aggregation service
```javascript
// Mixed workload
const aggregatorQueue = new Queue('api-calls', { concurrency: 15 });
// Allows parallel API calls with some CPU overhead
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/submit` | POST | Submit task with concurrency queue selection |
| `/api/status/:id` | GET | Get job status |
| `/api/recommendation` | GET | Get concurrency recommendation |
| `/api/queue-status` | GET | View queue metrics |
| `/api/dashboard` | GET | System metrics dashboard |

## Testing

Use the React UI at port 4005 to:
1. Submit tasks with different types (CPU/IO/Memory-bound)
2. View system metrics (CPU, memory usage)
3. See active workers and queue depth
4. Get automatic recommendations

## Resources
- See `theory.md` for detailed concepts
- See `setup.md` for installation
- See `App.jsx` for testing interface
