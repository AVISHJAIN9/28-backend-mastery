# Architecture & Node.js Internals

## The libuv Event Loop & Thread Pool

```mermaid
flowchart TD
    CallStack[V8 Call Stack] --> Macro[Macrotask Queue: Timers setTimeout]
    Macro --> IORunning[I/O Polling & Callbacks]
    IORunning --> Check[setImmediate Check Queue]
    Check --> Close[Close Callbacks]

    subgraph "Microtask Execution (Runs between every phase)"
        PNext[process.nextTick] --> PromiseQueue[Promise Microtasks]
    end

    IORunning --> MicrotaskPhase{Drain Microtasks}
    MicrotaskPhase --> PNext
```

## Non-Blocking Asynchronous I/O
Node.js delegates file system and DNS operations to the libuv thread pool (default 4 threads), while network sockets are monitored using native kernel mechanisms (`epoll` on Linux, `kqueue` on macOS), allowing a single thread to handle tens of thousands of concurrent connections.
