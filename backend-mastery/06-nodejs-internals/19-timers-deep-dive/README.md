# 19: Timers Deep Dive

## Overview
The Node.js timer functions (setTimeout, setInterval, setImmediate, process.nextTick) drive asynchronous execution. Understanding their ordering and performance is critical for writing non-blocking code.

## What You'll Learn
- setTimeout vs setInterval precision
- setImmediate vs nextTick ordering
- Timer resolution and drift
- Ref/unref for graceful shutdown
- Real-world timing patterns

## Key Concepts

### 1. **Timer Priority**
```javascript
process.nextTick(() => console.log('1. nextTick'));
Promise.resolve().then(() => console.log('2. promise'));
setImmediate(() => console.log('3. immediate'));
setTimeout(() => console.log('4. timeout'));
// Output: 1. nextTick, 2. promise, 3. immediate, 4. timeout
```

### 2. **Ref & Unref**
```javascript
const timer = setTimeout(() => {}, 1000);
timer.unref(); // Process won't wait for this
// Process can exit even if timer pending
```

### 3. **Timer Precision**
- Minimum 1ms resolution
- Actual delays longer (event loop delays)
- System load affects precision

## Module Structure
- Backend on Port 3019
- Timer execution order demos
- Precision measurement testing
- Ref/unref behavior examples
- Interval management patterns
- Performance testing under load

## Quick Start
1. `npm install` - Install dependencies
2. `npm start` - Start server
3. Open `http://localhost:3019` - Access UI
