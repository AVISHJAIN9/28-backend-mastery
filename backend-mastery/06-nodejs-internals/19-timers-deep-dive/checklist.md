# Module 19: Timers Deep Dive - Checklist

## Core Concepts
- [ ] Understand setTimeout precision and drift
- [ ] Know the difference between setTimeout and setInterval
- [ ] Understand setImmediate vs setTimeout
- [ ] Know microtasks vs macrotasks
- [ ] Understand process.nextTick()

## Timer.unref() & Timer.ref()
- [ ] Know when to use unref()
- [ ] Understand impact on process lifecycle
- [ ] Know how to ref() back
- [ ] Real-world use cases (keep-alive)

## Event Loop Integration
- [ ] Understand timer phase in event loop
- [ ] Know check phase (setImmediate)
- [ ] Understand microtask queue
- [ ] Execution order with Promises

## Performance & Optimization
- [ ] Measure timer precision in your environment
- [ ] Understand timer skew in setInterval
- [ ] Know memory impact of many timers
- [ ] Implement adaptive timing if needed

## Common Patterns
- [ ] Implement timer cleanup
- [ ] Create timer manager class
- [ ] Handle timer leaks
- [ ] Cancel timers properly

## Testing Scenarios
- [ ] Test timer precision
- [ ] Test setImmediate execution order
- [ ] Test unref behavior
- [ ] Test interval timing
- [ ] Test microtask ordering
- [ ] Test memory with many timers

## API Endpoints
- [ ] POST /api/timers/test-precision
- [ ] GET /api/timers/test-immediate
- [ ] POST /api/timers/test-unref
- [ ] GET /api/timers/test-interval
- [ ] GET /api/timers/microtasks-vs-macrotasks
- [ ] POST /api/timers/test-memory
- [ ] GET /health
- [ ] GET /

## Deployment
- [ ] .env.example configured
- [ ] PORT set to 3019
- [ ] Dependencies installed
- [ ] Server starts: npm start
- [ ] Dev mode: npm run dev
