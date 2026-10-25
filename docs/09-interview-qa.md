# Interview Preparation: 150+ Questions & Answers

## Core Architectural Questions

### Q1: Can you explain how the Node.js event loop works?
**Answer**:
The Node.js event loop is powered by libuv and consists of six distinct phases: Timers (`setTimeout`, `setInterval`), Pending callbacks, Idle/Prepare, Poll (retrieving new I/O events), Check (`setImmediate`), and Close callbacks. Between every single phase and before returning to the event loop, Node drains the microtask queue—executing `process.nextTick` callbacks first, followed by resolved Promise microtasks.

### Q2: How do you prevent event loop blocking in Node.js?
**Answer**:
Heavy computations—such as cryptographic key generation, image resizing, or large JSON parsing—will block the single main JavaScript thread. To prevent this, CPU-bound tasks should be offloaded to Worker Threads (`worker_threads`), delegated to external background workers via job queues like BullMQ, or broken down into chunks using asynchronous iteration.

### Q3: What is the difference between process.nextTick and setImmediate?
**Answer**:
Despite its name, `process.nextTick` fires immediately after the currently executing operation finishes, before the event loop advances to the next phase or microtask. `setImmediate` schedules a callback to run during the Check phase of the event loop, after the Poll phase has processed pending I/O events.

### Q4: How do you handle database transactions under high concurrency?
**Answer**:
We use atomic database sessions with optimistic locking. In MongoDB or PostgreSQL, transactions verify record versions during updates. If a concurrent write is detected, the transaction aborts and retries with exponential backoff, preventing lost updates and phantom reads.

### Q5: How do you gracefully shut down a Node.js web server?
**Answer**:
When receiving a `SIGTERM` signal from Docker or Kubernetes, the server stops accepting new connections by calling `server.close()`. It sets a timeout window (e.g. 15 seconds) to allow in-flight HTTP requests to complete, flushes write streams and log buffers, closes database and Redis connection pools, and exits with code 0.
