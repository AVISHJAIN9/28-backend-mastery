# Module 11: Rate Limiting with Redis

## Overview

Rate limiting controls request rates to prevent abuse, DDoS attacks, and ensure fair resource allocation. This module demonstrates three algorithms optimized for different scenarios.

## Learning Objectives

- Understand three rate limiting algorithms
- Choose the right algorithm for your use case
- Implement distributed rate limiting with Redis
- Handle burst traffic intelligently
- Set appropriate limits for different endpoints
- Monitor rate limit violations

## Three Algorithms

### **1. Fixed Window** (Simplest & Fastest)
- Divide time into fixed buckets
- Count requests per bucket
- Reset at boundaries
- Best for: High-traffic public APIs
- Speed: ⚡⚡⚡ Fastest
- Memory: Minimal

### **2. Token Bucket** (Most Flexible)
- Tokens refill at steady rate
- Each request consumes 1 token
- Allows burst up to capacity
- Best for: Fair allocation, bursy traffic
- Speed: ⚡⚡ Fast
- Memory: Low

### **3. Sliding Window** (Most Accurate)
- Track all request timestamps
- Window slides continuously
- Exact rate limiting, no burst
- Best for: Strict quotas, compliance
- Speed: ⚡ Slower
- Memory: High

## Quick Start

```bash
cd 11-rate-limiting
npm install
npm start
# Backend on http://localhost:6417
```

## API Endpoints

### Fixed Window
```bash
POST /api/fixed-window/check
Body: {"identifier":"user123","limit":100,"window":60}
```

### Token Bucket
```bash
POST /api/token-bucket/check
Body: {"identifier":"user123","capacity":100,"refill":60}
```

### Sliding Window
```bash
POST /api/sliding-window/check
Body: {"identifier":"user123","limit":100,"window":60}
```

### Testing
```bash
POST /api/simulate/burst        # Test burst behavior
GET /api/stats/rate-limits      # View statistics
POST /api/clear-all             # Reset all limits
```

## Real-World Example

```javascript
// Express middleware
app.use(async (req, res, next) => {
  const identifier = req.user?.id || req.ip;
  const limit = req.user?.tier === 'pro' ? 1000 : 100;
  
  const result = await fixedWindow(identifier, limit, 60);
  
  // Set standard headers
  res.set('RateLimit-Limit', limit);
  res.set('RateLimit-Remaining', result.remaining);
  res.set('RateLimit-Reset', result.resetTime);
  
  if (!result.allowed) {
    res.set('Retry-After', result.resetIn);
    return res.status(429).json({
      error: 'Rate limited',
      retryAfter: result.resetIn
    });
  }
  
  next();
});
```

## Performance Benchmarks

| Algorithm | Per-Request | 1M requests/sec |
|-----------|------------|------------------|
| Fixed Window | <1ms | ✅ Handles easily |
| Token Bucket | 1-2ms | ✅ Handles well |
| Sliding Window | 5-10ms | ⚠️ Marginal |

## Decision Guide

**Need simplicity?** → Fixed Window  
**Need fairness?** → Token Bucket  
**Need precision?** → Sliding Window  

## Module Structure

```
11-rate-limiting/
├── theory.md      # Comprehensive algorithms guide
├── server.js      # Express with 3 algorithms
├── App.jsx        # Interactive testing UI
├── package.json   # Dependencies
├── setup.md       # Installation
├── README.md      # This file
└── checklist.md   # Learning objectives
```

## Testing Workflows

### Test 1: Single Request
1. Set limit to 5
2. Click "Single Request"
3. Repeat 7 times
4. First 5 allowed, last 2 rejected

### Test 2: Burst Test
1. Set limit to 5, burst to 10
2. Click "Burst Test" for each algorithm
3. Compare results
4. Fixed Window: fast, allows some burst
5. Token Bucket: allows burst up to capacity
6. Sliding Window: rejects all beyond limit

### Test 3: Compare Algorithms
1. Run burst test on all three
2. Observe differences
3. Choose best for your scenario

---

**Author:** Backend Mastery  
**Level:** Intermediate  
**Time:** 2-3 hours
