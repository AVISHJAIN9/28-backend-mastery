# 04 - Dead Letter Queue (DLQ)

Handle failed jobs gracefully by routing them to a dead letter queue for manual inspection, analysis, and potential reprocessing.

## 🎯 What You'll Learn

- What is a dead letter queue
- When jobs move to DLQ
- Analyzing failure causes
- Retrying failed jobs
- Exporting failed data
- Monitoring DLQ health

## 📋 What is a Dead Letter Queue?

A **Dead Letter Queue** (DLQ) is a holding area for jobs that have failed all retry attempts. Instead of losing the data, it's preserved for later investigation and manual reprocessing.

### Why DLQ?

```
Without DLQ:
Job fails → Retries fail → Data lost 😱

With DLQ:
Job fails → Retries fail → Saved to DLQ → Manual review → Retry or archive
```

## 🚀 Quick Start

```bash
npm install
npm run dev
# Server on http://localhost:4004
```

## 📊 Job Lifecycle with DLQ

```
1. Create Job
   ↓
2. Process with Retries (max 3 attempts)
   ├─ Attempt 1 fails
   ├─ Attempt 2 fails
   └─ Attempt 3 fails
   ↓
3. Move to DLQ
   ↓
4. Options:
   ├─ Analyze cause
   ├─ Retry manually
   └─ Delete or archive
```

## 🎨 Common DLQ Scenarios

### Network Timeout
```javascript
// Job fails due to network timeout
// Moved to DLQ after 3 attempts
// Action: Retry after network stabilizes
```

### Validation Error
```javascript
// Job data validation fails
// Moved to DLQ
// Action: Fix data and retry
```

### Database Connection
```javascript
// Database is down
// Job retries fail
// Action: Wait for DB recovery, then retry
```

## 🔧 API Examples

### Get All Dead Letters
```bash
curl http://localhost:4004/api/dlq
```

### Analyze Failure Causes
```bash
curl http://localhost:4004/api/analysis/causes
```

Response:
```json
{
  "totalDeadLetters": 45,
  "failureReasons": {
    "ECONNREFUSED": 12,
    "Timeout": 8,
    "Validation error": 25
  },
  "byCategory": {
    "network": 20,
    "validation": 25,
    "database": 0,
    "timeout": 8,
    "other": 0
  }
}
```

### Retry Specific Job
```bash
POST /api/dlq/job-123/retry
```

### Bulk Retry All DLQ Jobs
```bash
POST /api/dlq/retry-all
```

## ⚠️ Best Practices

1. **Monitor DLQ Size**
   - Don't let DLQ grow without limit
   - Set alerts for threshold

2. **Review Regularly**
   - Daily review of new DLQ items
   - Categorize failure reasons

3. **Batch Retry**
   - Don't retry all at once
   - Use exponential backoff

4. **Archive Old Jobs**
   - Keep for 30 days
   - Then archive to cold storage

5. **Alerting**
   - Alert on critical failures
   - Track DLQ growth

## 📊 Monitoring

```bash
# Get DLQ statistics
curl http://localhost:4004/api/stats
```

## 🌍 Real-World Use Cases

- **E-Commerce**: Failed payment processing
- **Email Service**: Undeliverable emails
- **Data Sync**: API sync failures
- **Log Processing**: Unparseable events
- **File Processing**: Corrupted file uploads

## 🔄 Retry Strategy

```javascript
When job enters DLQ:
1. Change database schema version?
2. Fix bug in processor code?
3. Issue external service?
4. Invalid input data?
5. Resource exhaustion?

Then:
- Fix root cause
- Retry all DLQ jobs
- Monitor for new failures
```

## 📈 Severity Levels

| Reason | Severity | Action |
|--------|----------|--------|
| Timeout | Medium | Retry |
| ECONNREFUSED | High | Wait & Retry |
| Validation | Low | Fix & Retry |
| Database | High | Wait & Retry |

## ✅ Features

✅ Automatic job preservation
✅ Failure cause analysis
✅ Selective job retry
✅ Bulk retry operations
✅ Export for audit
✅ DLQ statistics
✅ Dashboard monitoring

---

**Status**: ✅ Complete | **Complexity**: Intermediate | **Time**: 30-45 min

