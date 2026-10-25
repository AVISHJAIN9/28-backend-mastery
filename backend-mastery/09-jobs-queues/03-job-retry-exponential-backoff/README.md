# 03 - Job Retry with Exponential Backoff

Handle transient failures intelligently with configurable retry strategies and exponential backoff delays.

## 🎯 What You'll Learn

- Retry mechanisms for failed jobs
- Exponential backoff strategy
- Linear, Fibonacci, and fixed backoff
- Preventing thundering herd
- Request jitter
- Retry statistics and monitoring

## 📋 Backoff Strategies

### Exponential Backoff
```
Delay doubles each attempt:
Attempt 1: 2s
Attempt 2: 4s
Attempt 3: 8s
Attempt 4: 16s
Attempt 5: 32s
```

Perfect for: API calls, network operations

### Linear Backoff
```
Constant increment:
Attempt 1: 1s
Attempt 2: 2s
Attempt 3: 3s
Attempt 4: 4s
Attempt 5: 5s
```

Perfect for: Database operations

### Fibonacci Backoff
```
Fibonacci sequence:
Attempt 1: 1s
Attempt 2: 1s
Attempt 3: 2s
Attempt 4: 3s
Attempt 5: 5s
```

### Fixed Delay
```
Same delay every time:
Attempt 1: 5s
Attempt 2: 5s
Attempt 3: 5s
Attempt 4: 5s
Attempt 5: 5s
```

Perfect for: Transient errors (timeouts)

## 💡 When to Use

**Exponential**: External API calls, network requests
**Linear**: Database operations, locks
**Fibonacci**: Balanced approach
**Fixed**: Rate-limiting, circuit breaker

## 🚀 Quick Start

```bash
npm install
npm run dev
# Server on http://localhost:4003
```

## 📊 Problem: Thundering Herd

```javascript
// ❌ Problem: All retries at same time
// Attempt 1 (100 jobs fail)
// Attempt 2 (all 100 retry immediately)
// Result: Overload server!

// ✅ Solution: Add jitter
Delay = baseDelay * 2^attempt + random(0, jitter)
```

## 🎨 Example Usage

```javascript
// Submit job with exponential backoff
const job = await emailQueue.add(data, {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000  // base delay 2 seconds
  }
});
```

## 📈 Queue Progression

```
Job submitted
    ↓
Job processing
    ↓
Job fails (Error)
    ↓
Retry = exponential(attempt) 
    ↓
Wait delay seconds
    ↓
Retry attempt
    ↓
Success or Fail again
```

## 🔧 API Endpoints

### Submit Job
```bash
POST /api/submit/email
{
  "to": "user@example.com",
  "subject": "Subject",
  "body": "Email body",
  "maxAttempts": 5,
  "baseDelay": 2000
}
```

### Calculate Delays
```bash
GET /api/calculate-backoff
?strategy=exponential&attempt=5&baseDelay=2000
```

Response:
```json
{
  "strategy": "exponential",
  "delays": [
    {"attempt": 1, "delayMs": 2000, "delaySeconds": "2.00"},
    {"attempt": 2, "delayMs": 4000, "delaySeconds": "4.00"},
    {"attempt": 3, "delayMs": 8000, "delaySeconds": "8.00"},
    {"attempt": 4, "delayMs": 16000, "delaySeconds": "16.00"},
    {"attempt": 5, "delayMs": 32000, "delaySeconds": "32.00"}
  ],
  "totalDelaySeconds": "62.00"
}
```

## ✅ Features

✅ Multiple backoff strategies
✅ Jitter support
✅ Configurable retry attempts
✅ Real-time job monitoring
✅ Dashboard overview
✅ Backoff delay visualization
✅ Manual job retry

## 📊 Monitoring

```bash
GET /api/stats
```

Response shows:
- Total retry jobs
- Active, failed, completed jobs
- Delayed jobs
- Common failure reasons

## ⚠️ Best Practices

1. **Use appropriate strategy**
   - Exponential for network operations
   - Linear for transient errors

2. **Set reasonable max attempts**
   - Too many = long waits
   - Too few = give up quickly

3. **Use jitter**
   - Prevents thundering herd
   - Better for distributed systems

4. **Monitor failures**
   - Track failure reasons
   - Alert on patterns

5. **Log retry attempts**
   - Helps debugging
   - Performance analysis

## 🌍 Real-World Examples

- **Email Delivery**: Retry failed sends with exponential backoff
- **Payment Processing**: Retry API calls with jitter
- **Data Sync**: Retry external API syncs
- **Message Queue**: Retry failed message processing
- **Web Scraping**: Retry with exponential backoff

## 🎓 Related Concepts

- Circuit Breaker pattern
- Bulkhead pattern
- Timeout configuration
- Dead Letter Queue (Module 04)
- Distributed tracing

---

**Status**: ✅ Complete | **Complexity**: Intermediate | **Time**: 30-45 min

