#!/usr/bin/env python3
"""Update README, setup, and checklist for Node.js internals modules 01-12"""

NODEJS_MODULES = {
    "01-event-loop-all-6-phases": {
        "readme": """# Event Loop - All 6 Phases

## What You'll Learn

- Complete event loop architecture
- All 6 phases explained with examples
- Microtasks vs macrotasks
- Execution order of callbacks
- Performance implications

## Module Contents

- **theory.md**: Complete event loop concepts
- **controller.js**: Event loop monitoring examples
- **setup.md**: Testing and profiling setup
- **checklist.md**: Understanding verification

## Quick Start

1. Understand the 6 phases
2. Learn microtask queue priority
3. Run examples to see event loop in action
4. Monitor using profiling tools

## Key Concepts

- Timers, pendingCallbacks, poll, check, close phases
- process.nextTick vs Promise.then
- setImmediate timing
- Event loop blocking detection
""",
        "setup": """# Event Loop - Setup & Testing

## Installation

```bash
npm init -y
npm install --save-dev clinic chai mocha
```

## Running Examples

```bash
# Monitor event loop
node controller.js

# Profile with clinic
clinic doctor -- node controller.js

# Run tests
npm test
```

## Profiling Tools

### Node.js Built-in
```bash
node --prof controller.js
node --prof-process isolate-*.log > output.txt
```

### Clinic.js
```bash
npm install -g clinic
clinic doctor -- node controller.js
clinic flame -- node controller.js
```

## Key Experiments

1. Timer delays and actual execution
2. Phase order with mixed callbacks
3. Event loop blocking detection
4. Microtask starvation scenarios
""",
        "checklist": """# Event Loop - Implementation Checklist

## Understanding
- [ ] Can explain all 6 event loop phases
- [ ] Understand difference between microtasks and macrotasks
- [ ] Know priority order (nextTick > Promises > setImmediate)
- [ ] Can predict callback execution order
- [ ] Understand event loop blocking

## Practical Skills
- [ ] Detect event loop blockage
- [ ] Monitor with clinic.js
- [ ] Profile with Node.js prof
- [ ] Identify performance issues
- [ ] Test execution order

## Code Examples
- [ ] Simple phase demonstration
- [ ] Microtask ordering
- [ ] Blockage detection
- [ ] With profiling output
- [ ] Performance metrics
"""
    },
    "02-nexttick-vs-promise-resolve": {
        "readme": """# process.nextTick vs Promise.resolve()

## What You'll Learn

- Difference between nextTick and Promises
- Execution order and timing
- Use cases for each
- Performance implications
- Real-world scenarios

## Module Contents

- **theory.md**: nextTick vs Promises theory
- **controller.js**: Comparison examples
- **setup.md**: Testing setup
- **checklist.md**: Verification steps

## Quick Comparison

| Feature | nextTick | Promise |
|---------|----------|---------|
| Queue | nextTick Q | Microtask Q |
| Priority | Higher | Lower |
| Speed | Immediate | After nextTick |
| Use | Error handlers | General async |

## Key Concepts

- Microtask queue between event loop phases
- process.nextTick highest priority
- Both before macrotasks
- Common mistakes and how to avoid them
""",
        "setup": """# nextTick vs Promise - Setup & Testing

## Installation

```bash
npm init -y
npm install --save-dev mocha chai
```

## Running Examples

```bash
node controller.js
npm test
```

## Test Scenarios

1. Execution order with both
2. Multiple nextTick calls
3. Promise chaining
4. Mixed nextTick and Promises
5. Starvation scenarios

## Understanding Output

Run examples and observe:
- Order of console.log outputs
- Timing differences
- Priority handling
- Edge cases
""",
        "checklist": """# nextTick vs Promise - Verification Checklist

## Concepts
- [ ] Understand nextTick queue
- [ ] Understand Promise microtask queue
- [ ] Know execution order
- [ ] Understand priority differences
- [ ] Recognize use cases

## Code Skills
- [ ] Predict callback order
- [ ] Write examples
- [ ] Handle errors with nextTick
- [ ] Chain promises correctly
- [ ] Mix both appropriately

## Testing
- [ ] Run order examples
- [ ] Verify output
- [ ] Test edge cases
- [ ] Document findings
"""
    },
    "03-blocking-event-loop": {
        "readme": """# Blocking the Event Loop

## What You'll Learn

- What causes event loop blocking
- How to detect blocking operations
- Solutions and patterns
- Performance impact
- Production monitoring

## Module Contents

- **theory.md**: Blocking causes and solutions
- **controller.js**: Detection and examples
- **setup.md**: Measurement setup
- **checklist.md**: Optimization checklist

## Common Blocking Operations

- Large synchronous loops
- Expensive computations
- Sync file operations
- Heavy JSON parsing
- Crypto operations

## Solutions Covered

- Breaking work into chunks
- setImmediate deferral
- Worker threads
- Async/await patterns
- Stream usage
""",
        "setup": """# Blocking Event Loop - Setup & Measurement

## Installation

```bash
npm init -y
npm install event-loop-lag clinic
```

## Detecting Blocking

```javascript
const lag = require('event-loop-lag');

setInterval(() => {
  console.log(`Event loop lag: ${lag()}ms`);
}, 1000);
```

## Measurement Tools

### Clinic.js
```bash
clinic doctor -- node controller.js
```

### Custom Monitoring
```bash
node controller.js
# Observe lag output
```

## Load Testing

```bash
npm install -g autocannon
autocannon -d 30 -c 10 http://localhost:3000
```
""",
        "checklist": """# Event Loop Blocking - Optimization Checklist

## Detection
- [ ] Understand lag causes
- [ ] Monitor with clinic.js
- [ ] Identify hot spots
- [ ] Measure baseline
- [ ] Track improvements

## Optimization
- [ ] Break loops with setImmediate
- [ ] Use async/await
- [ ] Defer non-critical work
- [ ] Profile bottlenecks
- [ ] Test improvements

## Solutions Applied
- [ ] Streaming for large data
- [ ] Worker threads for CPU
- [ ] Promises for async
- [ ] Batching operations
- [ ] Timeout implementation
"""
    },
    "04-buffers-and-streams": {
        "readme": """# Buffers and Streams

## What You'll Learn

- Buffer basics and operations
- Stream types and usage
- Backpressure handling
- Piping patterns
- Memory-efficient processing

## Module Contents

- **theory.md**: Buffer and stream concepts
- **controller.js**: Stream examples
- **setup.md**: Testing setup
- **checklist.md**: Implementation checklist

## Topics Covered

- Creating and manipulating buffers
- Readable, writable, duplex streams
- Transform streams
- Backpressure handling
- Pipe patterns and error handling

## Use Cases

- File processing
- Network data handling
- Compression/decompression
- Data transformation
- Memory efficiency
""",
        "setup": """# Buffers & Streams - Setup & Testing

## Installation

```bash
npm init -y
npm install --save-dev mocha chai
```

## Creating Test Files

```bash
# Create test data
dd if=/dev/zero of=testfile.bin bs=1M count=100
```

## Running Examples

```bash
node controller.js
npm test
```

## Memory Monitoring

```bash
node --max-old-space-size=256 controller.js
```

## Testing Backpressure

Stream large files and observe memory usage.
""",
        "checklist": """# Buffers & Streams - Verification Checklist

## Buffer Skills
- [ ] Create buffers (alloc, from)
- [ ] Convert between formats
- [ ] Understand encoding
- [ ] Handle binary data
- [ ] Slice and concatenate

## Stream Usage
- [ ] Create readable/writable
- [ ] Implement transform
- [ ] Pipe correctly
- [ ] Handle errors
- [ ] Monitor memory

## Advanced
- [ ] Backpressure handling
- [ ] High water marks
- [ ] Duplex streams
- [ ] Error recovery
- [ ] Performance tuning
"""
    },
    "05-async-local-storage": {
        "readme": """# AsyncLocalStorage

## What You'll Learn

- Request context propagation
- Automatic context passing through async
- Multi-tenancy patterns
- Logging with context
- Performance characteristics

## Module Contents

- **theory.md**: AsyncLocalStorage concepts
- **controller.js**: Usage examples
- **setup.md**: Integration patterns
- **checklist.md**: Implementation guide

## Use Cases

- Request tracking
- Multi-tenancy
- Transaction management
- Logging enhancement
- Context isolation

## Key Benefits

- Clean code (no param passing)
- Automatic context flow
- Isolated contexts
- Easy debugging
""",
        "setup": """# AsyncLocalStorage - Setup & Usage

## Installation

```bash
npm init -y
npm install express
```

## Basic Setup

```javascript
const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

app.use((req, res, next) => {
  storage.run({ requestId: req.id }, () => {
    next();
  });
});
```

## Testing Context

```bash
npm test
```

## Nested Context Testing

Run examples with multiple contexts to verify isolation.
""",
        "checklist": """# AsyncLocalStorage - Implementation Checklist

## Setup
- [ ] Import AsyncLocalStorage
- [ ] Create storage instance
- [ ] Understand context objects
- [ ] Set up middleware
- [ ] Test context isolation

## Usage
- [ ] Store request data
- [ ] Retrieve in handlers
- [ ] Access in nested async
- [ ] Handle errors
- [ ] Clean up contexts

## Advanced
- [ ] Multi-tenancy implementation
- [ ] Transaction patterns
- [ ] Performance testing
- [ ] Context nesting
- [ ] Error handling
"""
    },
    "06-worker-threads": {
        "readme": """# Worker Threads

## What You'll Learn

- CPU-bound work offloading
- Multi-core utilization
- Worker pool patterns
- Message passing
- Memory sharing with SharedArrayBuffer

## Module Contents

- **theory.md**: Worker thread concepts
- **controller.js**: Usage examples
- **setup.md**: Setup and benchmarking
- **checklist.md**: Implementation guide

## Topics Covered

- Creating worker threads
- Communication patterns
- Worker pools
- Shared memory
- Error handling

## Performance Gains

- CPU-bound in workers: ~8x improvement (8 cores)
- Main thread stays responsive
- Multi-core scaling
""",
        "setup": """# Worker Threads - Setup & Benchmarking

## Installation

```bash
npm init -y
npm install piscina
```

## Creating Workers

```bash
# Create worker.js
touch worker.js
```

## Benchmarking

```bash
node controller.js
# Observe timing differences
```

## Memory Monitoring

```bash
node --inspect controller.js
# Open chrome://inspect in DevTools
```

## Load Testing

Run CPU-intensive tasks with and without workers.
""",
        "checklist": """# Worker Threads - Implementation Checklist

## Concepts
- [ ] Understand when to use workers
- [ ] Memory overhead awareness
- [ ] CPU vs I/O bound distinction
- [ ] Pool advantages
- [ ] Communication overhead

## Implementation
- [ ] Create worker script
- [ ] Set up messaging
- [ ] Implement worker pool
- [ ] Handle errors
- [ ] Clean up threads

## Optimization
- [ ] Benchmark improvements
- [ ] Choose pool size
- [ ] Memory management
- [ ] Error recovery
- [ ] Production deploy
"""
    },
    "07-child-process-spawn-exec-fork": {
        "readme": """# Child Processes - spawn, exec, fork

## What You'll Learn

- spawn() for streaming
- exec() for simple commands
- execFile() for efficiency
- fork() for Node process IPC
- Error handling and cleanup

## Module Contents

- **theory.md**: All 4 methods explained
- **controller.js**: Practical examples
- **setup.md**: Integration patterns
- **checklist.md**: Implementation guide

## Method Comparison

| Method | Use Case | Output |
|--------|----------|--------|
| spawn | Large/streaming | Events |
| exec | Simple commands | Buffer |
| execFile | No shell needed | Buffer |
| fork | Node-to-Node | IPC |

## Common Use Cases

- Running system commands
- External scripts/programs
- Data processing
- Worker processes
""",
        "setup": """# Child Processes - Setup & Integration

## Installation

```bash
npm init -y
npm install --save-dev mocha
```

## Creating Test Scripts

```bash
# Python script for exec example
cat > script.py << 'EOF'
print("Hello from Python")
EOF

# Shell script
cat > script.sh << 'EOF'
#!/bin/bash
echo "Hello from shell"
EOF
chmod +x script.sh
```

## Testing

```bash
npm test
# Observe output and timing
```

## Production Usage

Set up proper error handling and logging.
""",
        "checklist": """# Child Processes - Implementation Checklist

## Method Selection
- [ ] Know when to use spawn vs exec
- [ ] Understand exec shell injection risks
- [ ] Know fork for Node-to-Node
- [ ] Benchmark for your use case
- [ ] Consider buffer limits

## Implementation
- [ ] Spawn for large output
- [ ] Exec for simple commands
- [ ] execFile for security
- [ ] Fork for parallel Node
- [ ] Handle all errors

## Production Ready
- [ ] Set timeouts
- [ ] Handle exit codes
- [ ] Clean up processes
- [ ] Log failures
- [ ] Test edge cases
"""
    },
    "08-memory-leaks-patterns": {
        "readme": """# Memory Leaks - Patterns & Detection

## What You'll Learn

- Common memory leak patterns
- Detection techniques
- Debugging with heap snapshots
- Prevention strategies
- Production monitoring

## Module Contents

- **theory.md**: Leak causes and solutions
- **controller.js**: Detection examples
- **setup.md**: Profiling setup
- **checklist.md**: Prevention checklist

## Common Patterns

- Unbounded caches
- Event listener leaks
- Circular references
- Timer leaks
- Closure references

## Detection Tools

- Node.js profiler
- clinic.js
- Heap snapshots
- Memory monitoring
""",
        "setup": """# Memory Leaks - Profiling Setup

## Installation

```bash
npm init -y
npm install clinic
```

## Profiling

### Using clinic.js
```bash
clinic doctor -- node controller.js
clinic bubble -- node controller.js
```

### Using Node.js prof
```bash
node --prof controller.js
node --prof-process isolate-*.log > output.txt
```

### Chrome DevTools
```bash
node --inspect controller.js
# Open chrome://inspect
```

## Heap Snapshot Analysis

Use DevTools to compare snapshots before/after.
""",
        "checklist": """# Memory Leaks - Prevention Checklist

## Detection
- [ ] Monitor heap growth
- [ ] Use clinic.js
- [ ] Create heap snapshots
- [ ] Compare snapshots
- [ ] Identify patterns

## Prevention
- [ ] Bound collections
- [ ] Remove listeners
- [ ] Clear timers
- [ ] Monitor event listeners
- [ ] Test memory usage

## Debugging
- [ ] Profile suspicious functions
- [ ] Analyze heap dumps
- [ ] Check for circular refs
- [ ] Verify cleanup
- [ ] Document fixes
"""
    },
    "09-graceful-shutdown": {
        "readme": """# Graceful Shutdown

## What You'll Learn

- Handling SIGTERM signals
- Cleaning up resources
- Closing connections
- Timeout patterns
- Production deployment

## Module Contents

- **theory.md**: Shutdown strategies
- **controller.js**: Implementation examples
- **setup.md**: Integration with PM2/Docker
- **checklist.md**: Verification steps

## Key Concepts

- Signal handling (SIGTERM, SIGKILL)
- Resource cleanup
- Timeout mechanisms
- Connection draining
- Error handling
""",
        "setup": """# Graceful Shutdown - Setup & Testing

## Installation

```bash
npm init -y
npm install express
npm install -g pm2
```

## Express Server Setup

See controller.js for full example.

## Manual Testing

```bash
# Start server
node controller.js

# In another terminal, send SIGTERM
kill -SIGTERM <pid>

# Observe: Server shuts down gracefully
```

## PM2 Configuration

```bash
pm2 start app.js --max-memory-restart 500M
```

## Docker Testing

```bash
docker build -t app .
docker run app
docker stop <container> # Sends SIGTERM
```
""",
        "checklist": """# Graceful Shutdown - Implementation Checklist

## Signals
- [ ] Handle SIGTERM
- [ ] Handle SIGINT (Ctrl+C)
- [ ] Set timeout (10-30s)
- [ ] Force exit after timeout
- [ ] Log shutdown events

## Cleanup Tasks
- [ ] Stop accepting connections
- [ ] Wait for in-flight requests
- [ ] Close database connections
- [ ] Flush logs
- [ ] Clean temp files

## Testing
- [ ] Test manual kill
- [ ] Test with load
- [ ] Test timeout trigger
- [ ] Verify resource cleanup
- [ ] Check logs
"""
    },
    "10-cluster-module-all-cpu-cores": {
        "readme": """# Cluster Module - Using All CPU Cores

## What You'll Learn

- Master/worker architecture
- Load balancing across cores
- Worker restarts and resilience
- Zero-downtime deployments
- Shared state patterns

## Module Contents

- **theory.md**: Clustering concepts
- **controller.js**: Implementation examples
- **setup.md**: Setup and benchmarking
- **checklist.md**: Deployment checklist

## Performance Gains

- Single core: 100% utilization
- 8 cores: ~70-80% utilization
- Throughput: ~5-6x on 8 cores
- Low latency maintained

## Key Patterns

- Worker auto-restart
- Graceful reload
- Sticky sessions
- Shared cache (Redis)
""",
        "setup": """# Cluster Module - Setup & Benchmarking

## Installation

```bash
npm init -y
npm install express redis
```

## Benchmarking

### With ab (Apache Bench)
```bash
ab -n 10000 -c 100 http://localhost:3000/
```

### With autocannon
```bash
npm install -g autocannon
autocannon -d 30 -c 100 http://localhost:3000/
```

## Shared Cache Setup

```javascript
const redis = require('redis');
const client = redis.createClient();
```

## Load Testing

Compare single vs multi-core performance.
""",
        "checklist": """# Cluster Module - Deployment Checklist

## Setup
- [ ] Determine CPU count
- [ ] Create workers for each core
- [ ] Implement restart logic
- [ ] Add health checks
- [ ] Set up logging

## State Management
- [ ] Use external cache (Redis)
- [ ] Ensure data consistency
- [ ] Handle session affinity
- [ ] Test failover
- [ ] Document state flow

## Deployment
- [ ] Zero-downtime reload
- [ ] Rolling restart strategy
- [ ] Monitor worker health
- [ ] Log startup/shutdown
- [ ] Test with production load
"""
    },
    "11-async-await-patterns": {
        "readme": """# async/await Patterns

## What You'll Learn

- async/await syntax and semantics
- Sequential vs parallel execution
- Error handling patterns
- Common anti-patterns
- Promise method usage

## Module Contents

- **theory.md**: Patterns and best practices
- **controller.js**: Real-world examples
- **setup.md**: Testing patterns
- **checklist.md**: Code review guide

## Key Patterns

- Sequential execution
- Parallel with Promise.all
- Timeout handling
- Retry logic
- Error handling

## Performance Impact

- Sequential: Slow but safe
- Parallel: Fast but needs coordination
- Proper patterns: Best performance
""",
        "setup": """# async/await - Setup & Testing

## Installation

```bash
npm init -y
npm install --save-dev mocha chai
```

## Running Examples

```bash
node controller.js
npm test
```

## Benchmarking

Compare sequential vs parallel timing.

## Error Scenarios

Test various error conditions and recovery.
""",
        "checklist": """# async/await - Code Review Checklist

## Syntax
- [ ] Proper async function syntax
- [ ] Correct await usage
- [ ] No bare Promise usage
- [ ] Proper error handling
- [ ] Return values correct

## Performance
- [ ] Not using sequential when parallel works
- [ ] Promise.all for independent ops
- [ ] Promise.race for timeouts
- [ ] Promise.allSettled for error handling
- [ ] No excessive nesting

## Best Practices
- [ ] Always handle errors
- [ ] Use try/finally for cleanup
- [ ] Avoid fire-and-forget
- [ ] Test error paths
- [ ] Document async behavior
"""
    },
    "12-express-routing-internals": {
        "readme": """# Express Routing Internals

## What You'll Learn

- Route matching and priority
- Parameter extraction
- Middleware ordering
- Router nesting
- Error handling routes

## Module Contents

- **theory.md**: Routing internals explained
- **controller.js**: Examples and patterns
- **setup.md**: Testing routes
- **checklist.md**: Route design guide

## Key Concepts

- Exact routes before parameters
- Middleware execution order
- Parameter types (URL, query, body)
- Route-level middleware
- Error middleware

## Best Practices

- Organize with routers
- Use consistent naming
- Proper error handling
- RESTful conventions
""",
        "setup": """# Express Routing - Setup & Testing

## Installation

```bash
npm init -y
npm install express --save-dev mocha chai
```

## Starting Server

```bash
node controller.js
```

## Testing Routes

```bash
curl http://localhost:3000/users
curl http://localhost:3000/users/123
curl http://localhost:3000/users/admin
```

## Running Tests

```bash
npm test
```

## Route Organization

Follow the RESTful convention examples.
""",
        "checklist": """# Express Routing - Design Checklist

## Route definition
- [ ] Exact routes before parameters
- [ ] Consistent naming convention
- [ ] Parameter validation
- [ ] HTTP method correct
- [ ] Status codes correct

## Middleware
- [ ] Middleware in correct order
- [ ] Error handler last
- [ ] Auth before protected routes
- [ ] Validation before handler
- [ ] Logging middleware first

## Organization
- [ ] Sub-routers for features
- [ ] Consistent path structure
- [ ] Error handling defined
- [ ] Documentation present
- [ ] Tests written
"""
    }
}

BASE = "/Users/avishjain/Downloads/backend-mastery/06-nodejs-internals"

def write_files(module_name, readme, setup, checklist):
    with open(f"{BASE}/{module_name}/README.md", 'w') as f:
        f.write(readme)
    with open(f"{BASE}/{module_name}/setup.md", 'w') as f:
        f.write(setup)
    with open(f"{BASE}/{module_name}/checklist.md", 'w') as f:
        f.write(checklist)
    print(f"✅ {module_name}")

for module, content in NODEJS_MODULES.items():
    write_files(module, content["readme"], content["setup"], content["checklist"])

print(f"\n✅ All 12 Node.js internals modules - README, setup, checklist updated!")
