# Setup & Testing Guide - Module 03: Distributed Locks

## Prerequisites

- **Node.js** 14+ (https://nodejs.org/)
- **Redis** 4.0+ (https://redis.io/)or Docker
- **npm** or **yarn**
- **React** 18+

## Installation

### Step 1: Install Backend Dependencies

```bash
cd 03-distributed-locks-redis-setnx-redlock

npm install

# Installs:
# - express (web framework)
# - redis (client library)
# - redlock (distributed locking)
# - cors (cross-origin requests)
# - helmet (security headers)
# - winston (logging)
# - dotenv (environment variables)
# - joi (validation)
```

### Step 2: Install Frontend Dependencies

```bash
# If using separate React app
cd ../frontend
npm install

# or create React app with Vite
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### Step 3: Start Redis

**Option A: Using system Redis**
```bash
# macOS with Homebrew
brew services start redis

# Linux
sudo systemctl start redis-server

# Verify
redis-cli ping
# Should output: PONG
```

**Option B: Using Docker**
```bash
docker run -d -p 6379:6379 --name redis-server redis:latest

# Verify
docker exec redis-server redis-cli ping
# Should output: PONG
```

---

## Starting the Application

### Terminal 1: Start Backend Server

```bash
cd 03-distributed-locks-redis-setnx-redlock

npm start

# Output:
# ╔═══════════════════════════════════════════════╗
# ║     DISTRIBUTED LOCKS MODULE 03               ║
# ║    Redis SETNX & Redlock Pattern              ║
# ╚═══════════════════════════════════════════════╝
# Server running on port 4003
```

Server endpoints active at:
- `http://localhost:4003/health` - Health check
- `http://localhost:4003/api/secure/transactions` - Secure endpoint
- `http://localhost:4003/api/vulnerable/transactions` - Vulnerable endpoint

### Terminal 2: Start Frontend Server

```bash
cd frontend

npm run dev

# Output:
# ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in browser

---

## Testing Scenarios

### Scenario 1: Basic Transaction Lock

**Test SETNX Lock:**

```bash
# Terminal 3: Test the secure endpoint
curl -X POST http://localhost:4003/api/secure/process-transaction \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TX-001",
    "amount": 500,
    "description": "Test transfer"
  }'

# Response:
# {
#   "success": true,
#   "transaction": {
#     "id": "TX-001",
#     "amount": 500,
#     "status": "completed",
#     "processed_count": 1,
#     "processed_at": "2024-01-15T10:30:00Z"
#   },
#   "lock_used": "SETNX",
#   "message": "Transaction safely processed with atomic lock"
# }
```

### Scenario 2: Simultaneous Requests (Race Condition Demo)

**Send 5 concurrent requests to same transaction:**

```bash
# Using parallel requests
for i in {1..5}; do
  curl -X POST http://localhost:4003/api/vulnerable/process-transaction \
    -H "Content-Type: application/json" \
    -d '{"transaction_id":"TX-RACE","amount":100}' &
done
wait

# Without lock: All 5 might process
# Result: processed_count = 1 (lucky) or more (race condition!)
```

**With secure lock:**

```bash
for i in {1..5}; do
  curl -X POST http://localhost:4003/api/secure/process-transaction \
    -H "Content-Type: application/json" \
    -d '{"transaction_id":"TX-SAFE","amount":100,"lock_ttl":5000}' &
done
wait

# With lock: Only 1 succeeds, others get 409 Conflict
# Expected:  1 success + 4 conflicts
```

### Scenario 3: Batch Payment with Redlock

```bash
curl -X POST http://localhost:4003/api/advanced/batch-payment \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "BATCH-001",
    "payments": [
      {"payee_id": "USER-1", "amount": 100, "description": "Payment 1"},
      {"payee_id": "USER-2", "amount": 200, "description": "Payment 2"},
      {"payee_id": "USER-3", "amount": 150, "description": "Payment 3"}
    ],
    "lock_ttl": 15000
  }'

# Response:
# {
#   "success": true,
#   "batch": {
#     "id": "BATCH-001",
#     "status": "completed",
#     "processed": 3
#   },
#   "lock_strategy": "Redlock",
#   "message": "Batch payment safely processed across distributed instances"
# }
```

### Scenario 4: Resource Allocation with Lock Extension

```bash
curl -X POST http://localhost:4003/api/advanced/allocate-resource \
  -H "Content-Type: application/json" \
  -d '{
    "resource_name": "inventory",
    "quantity": 50,
    "duration_ms": 3000
  }'

# Response:
# {
#   "success": true,
#   "resource": "inventory",
#   "allocated": 50,
#   "remaining": 950,
#   "lock_extended": true,
#   "operation_duration_ms": 3000
# }
```

**Test concurrent allocations:**

```bash
# Try to allocate while first is running
# Send multiple requests simultaneously
# Most should get 409 Conflict (locked)

for i in {1..3}; do
  curl -X POST http://localhost:4003/api/advanced/allocate-resource \
    -H "Content-Type: application/json" \
    -d '{"resource_name":"inventory","quantity":100,"duration_ms":2000}' &
done
wait
```

### Scenario 5: View Transaction Status

```bash
# Check active locks
curl http://localhost:4003/api/secure/transactions

# Response shows:
# {
#   "transactions": {...},
#   "active_locks": ["tx_lock:TX-001", "tx_lock:TX-002"],
#   "active_lock_count": 2,
#   "total_transactions": 5
# }
```

### Scenario 6: Test Lock TTL Expiry

```bash
# Set short TTL (1 second)
curl -X POST http://localhost:4003/api/secure/process-transaction \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"TX-SHORT","amount":100,"lock_ttl":1000}'

# Immediately try again (should fail with 409)
curl -X POST http://localhost:4003/api/secure/process-transaction \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"TX-SHORT","amount":100,"lock_ttl":1000}'
# Result: 409 Conflict

# Wait 1.5 seconds
sleep 1.5

# Try again (should succeed - TTL expired)
curl -X POST http://localhost:4003/api/secure/process-transaction \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"TX-SHORT","amount":100,"lock_ttl":1000}'
# Result: 200 Success (lock released)
```

---

## Frontend Testing (UI)

### Using the React UI

1. Navigate to `http://localhost:5173`

2. **Transactions Tab:**
   - Enter Transaction ID (e.g., "TX-001")
   - Enter Amount (e.g., 500)
   - Click "Test VULNERABLE" - Shows race condition risk
   - Click "Test SECURE" - Safe with lock
   - Click "Concurrent Requests (5x)" - Simulates 5 simultaneous requests

3. **Batch Payment Tab:**
   - Enter Job ID (e.g., "BATCH-001")
   - Set number of payments
   - Click "Process Batch with Redlock"
   - Simulate concurrent batches

4. **Resources Tab:**
   - Set resource name, quantity, duration
   - Click "Allocate Resource"
   - Test lock extension on long operations

5. **Logs Tab:**
   - View detailed operation logs
   - See lock acquisitions, conflicts, releases

---

## Manual Testing Checklist

### ✅ Basic Functionality

- [ ] Single transaction completes successfully
- [ ] Batch payment processes all items
- [ ] Resource allocation succeeds
- [ ] View active locks shows correct count
- [ ] Clear data resets all state

### ✅ Lock Behavior

- [ ] Concurrent requests: 1 succeeds, others get 409
- [ ] Lock releases after operation completes
- [ ] Lock releases after TTL expires
- [ ] Lock persists during long operations (extension works)

### ✅ Error Handling

- [ ] Invalid transaction ID returns 400
- [ ] Missing required fields returns 400
- [ ] Lock acquisition failure returns 409 with retry_after
- [ ] Server errors return 500 with generic message

### ✅ Concurrent Scenarios

- [ ] 5 simultaneous requests: 1 success, 4×409
- [ ] 10 sequential rapid requests: All eventually succeed
- [ ] Mixed secure/vulnerable: Vulnerable shows race condition
- [ ] Batch concurrent: Only 1 batch completes, others 409

### ✅ Edge Cases

- [ ] Very short TTL (1s) → auto-release works
- [ ] Very long operation (5s) → lock extension prevents expiry
- [ ] Zero inventory allocation → returns 400
- [ ] Negative amounts → returns 400 (validation fails)

---

## Performance Testing

### Load Test Script

Create `load-test.sh`:

```bash
#!/bin/bash

DURATION=30
CONCURRENT=10
ENDPOINT="http://localhost:4003/api/secure/process-transaction"

echo "Running load test for ${DURATION}s with ${CONCURRENT} concurrent requests..."

for ((i=0; i<$ DURATION; i++)); do
  for ((j=0; j<CONCURRENT; j++)); do
    curl -s -X POST "${ENDPOINT}" \
      -H "Content-Type: application/json" \
      -d "{\"transaction_id\":\"TX-$i-$j\",\"amount\":$((100 + RANDOM % 900))}" \
      -o /dev/null &
  done
  sleep 1
done

wait
echo "Load test completed"
```

Run:
```bash
chmod +x load-test.sh
./load-test.sh
```

Monitor:
- Lock wait times (should be < 10ms)
- 409 conflict rate (should be appropriate)
- Response latencies

### Metrics to Track

```
1. Lock Acquisition Time
   - SETNX: < 5ms
   - Redlock: < 20ms

2. Critical Section Duration
   - Should be minimized (< 100ms ideal)

3. Conflict Rate
   - At high concurrency: 5-20%
   - At low concurrency: < 1%

4. TTL Appropriateness
   - Lock TTL should be 2× operation time
   - If TTL expires mid-operation: Increase TTL
```

---

## Debugging Tips

### Check Redis Connection

```bash
redis-cli ping
# Output: PONG

redis-cli keys '*'
# Shows all keys in Redis (including locks)

redis-cli keys 'lock:*'
# Shows active locks

redis-cli del "lock:key-name"
# Manually delete stuck lock
```

### View Server Logs

```bash
# Backend logs show in terminal
# Look for:
# - "VULNERABLE: No lock on transaction"
# - "Redlock acquired for batch payment"
# - "Failed to acquire lock - transaction in progress"

# View error logs
cat error.log | tail -50
```

### Test Redis Connectivity

```bash
# From Node
node -e "
  const redis = require('redis');
  const client = redis.createClient();
  client.set('test', 'value', (err, reply) => {
    console.log('Set:', reply);
    client.get('test', (err, reply) => {
      console.log('Get:', reply);
      client.quit();
    });
  });
"
```

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED` | Redis not running | Start Redis: `brew services start redis` or `docker run -d -p 6379:6379 redis` |
| `409 Conflict` | Lock held by other request | Normal - wait for current request or check logs |
| Lock never releases | Exception in critical section | Check server logs for errors, restart server |
| All requests timeout | Server not running | Start server: `npm start` |
| Conflict rate too high | Too many concurrent requests | Reduce concurrency or increase TTL |
| Low throughput | Lock contention | Either: optimize critical section OR accept reduced throughput |

---

## Integration Testing

### Test Suite Structure

```javascript
// test/distributed-locks.test.js

describe('SETNX Locking', () => {
  it('allows single transaction through', async () => {
    const res = await fetch('/api/secure/process-transaction', {
      method: 'POST',
      body: JSON.stringify({ transaction_id: 'TX-1', amount: 100 })
    });
    expect(res.status).toBe(200);
  });

  it('blocks concurrent transactions', async () => {
    const promises = Array(5).fill().map(() =>
      fetch('/api/secure/process-transaction', {
        method: 'POST',
        body: JSON.stringify({ transaction_id: 'TX-CONCURRENT', amount: 100 })
      })
    );
    
    const statuses = await Promise.all(promises).then(rs => rs.map(r => r.status));
    expect(statuses.filter(s => s === 200).length).toBe(1);
    expect(statuses.filter(s => s === 409).length).toBe(4);
  });
});
```

Run with:
```bash
npm test
```

---

## Cleanup

### Stop Services

```bash
# Stop backend (Ctrl+C in terminal)
# Stop frontend (Ctrl+C in terminal)

# Stop Redis
redis-cli shutdown

# Or if Docker:
docker stop redis-server
docker rm redis-server
```

### Clear All Data

```bash
# Via API
curl -X POST http://localhost:4003/api/clear

# Via Redis CLI
redis-cli flushdb
```

---

## Next Steps

After completing Module 03, proceed to:

- **Module 04:** Feature Flags (LaunchDarkly & DB-based toggles)
- **Module 05:** Configuration Management (hot-reload)
- **Module 14:** Idempotency (using locks for deduplication)
