# Theory: Distributed Locks & Concurrency Control

## Part 1: The Problem - Race Conditions in Distributed Systems

### 1.1 What is a Race Condition?

A race condition occurs when two or more processes access shared data simultaneously, and at least one modifies it, without coordinating. The result depends on the **timing** (race) of events, not on correctness logic.

#### Example: Bank Transfer Race Condition

```
Alice's Account: $100
Bob's Account: $50

Transaction: Transfer $30 from Alice to Bob
===================================================

TIME    | Alice's Process     | Bob's Process       | Actual Values
--------|---------------------|---------------------|---------------
T0      | Read Alice: $100    |                     | Alice=100
T1      |                     | Read Bob: $50       | Alice=100, Bob=50
T2      | Deduct $30 ($70)    |                     | Alice=?, Bob=50
T3      |                     | Add $30 ($80)       | Alice=$70, Bob=80
T4      | Write Alice=$70     |                     | Alice=$70, Bob=50
T5      |                     | Write Bob=$80       | Alice=$70, Bob=$80

Expected: Alice=$70, Bob=$80
Actual: Alice=$70, Bob=$80 ✓ (worked by luck!)

But with different timing...

TIME    | Alice's Process     | Bob's Process       | Actual Values
--------|---------------------|---------------------|---------------
T0      | Read Alice: $100    |                     | Alice=100
T1      |                     | Read Bob: $50       | Alice=100, Bob=50
T2      |                     | Add $30 ($80)       |
T3      | Deduct $30 ($70)    |                     |
T4      | Write Alice=$70     |                     | Alice=$70
T5      |                     | Write Bob=$80       | Alice=$70, Bob=$80

System total: $70 + $80 = $150 ✓ Still correct here

But in inventory:

Alice's Inventory: 5 items
Request 1: Buy 3 items
Request 2: Buy 4 items
Available: 5 items (both should be rejected!)

TIME    | Request 1           | Request 2           | Result
--------|---------------------|---------------------|---------------
T0      | Read: 5 items       |                     |
T1      |                     | Read: 5 items       |
T2      | Check: 5 >= 3 ✓     |                     |
T3      |                     | Check: 5 >= 4 ✓     | Both pass!
T4      | Write: 5-3=2        |                     |
T5      |                     | Write: 5-4=1        |
        |                     |                     | INVENTORY NEGATIVE!

Both transactions passed validation, both modified, both committed.
Inventory = 1 (should be 0 or error)
```

### 1.2 Why Race Conditions Are Dangerous

In distributed systems with many concurrent users, race conditions are **GUARANTEED** to occur at scale:

- **High-frequency trading:** 1000s of operations/second
- **Cloud infrastructure:** Massive concurrency by default
- **Web scale:** Multiple servers receiving simultaneous requests
- **Mobile apps:** Millions of users, thousands of requests/second

#### Real-World Impact

- **DoorDash (2020):** Race condition in promo code redemption → $100M loss
- **Equifax (2017):** Race condition in session management
- **JP Morgan Chase:** Race condition in payment processing → millions in losses
- **Stripe:** Race condition in Ethereum integration (detected and fixed)

### 1.3 The Three Phases of Concurrency Issues

Every read-modify-write operation has three phases prone to race conditions:

```
┌─────────────────────────────────────────┐
│     Check-Then-Act (TOCTOU)             │
├─────────────────────────────────────────┤
│                                         │
│  Phase 1: READ                          │
│  └─ Get current state from database     │
│     "Current balance: $100"             │
│                                         │
│               ⚠️ RACE WINDOW ⚠️        │
│  (Other process can modify here!)      │
│                                         │
│  Phase 2: DECIDE                        │
│  └─ Apply business logic                │
│     "Deduct $30"                        │
│                                         │
│  Phase 3: WRITE                         │
│  └─ Update database                     │
│     "New balance: $70"                  │
│                                         │
└─────────────────────────────────────────┘

Atomic operation (single critical section):
┌─────────────────────────────────────────┐
│          READ-MODIFY-WRITE              │
│       (Atomic, can't be interrupted)    │
├─────────────────────────────────────────┤
│  1. Read $100                           │
│  2. Deduct $30                          │
│  3. Write $70                           │
│  (No other process can interfere)       │
└─────────────────────────────────────────┘
```

---

## Part 2: Locking Mechanisms

### 2.1 Pessimistic Locking

**Philosophy:** "Assume the worst will happen. Lock everything."

#### How It Works

```
Request 1              Request 2
───────────            ───────────
LOCK resource    ──→  ⏳ Waiting...
  (acquired)

Process data
  (safe zone)

UNLOCK resource  ──→  🚨 Now locked!
                      LOCK resource
                      Process data
                      UNLOCK resource
```

#### Implementation

```javascript
// Traditional pessimistic locking (e.g., SQL)
SELECT * FROM account WHERE id=123 FOR UPDATE;  // Lock acquired
  balance = balance - 30;
  UPDATE account SET balance=balance WHERE id=123;
COMMIT;  // Lock released
```

#### Pros & Cons

✅ **Simple:** Easy to understand  
✅ **Effective:** No conflicts possible  
❌ **Low Performance:** Blocking, serialized access  
❌ **Deadlock Risk:** If A waits for B and B waits for A  
❌ **Not Distributed:** Requires centralized database locks

#### When to Use

- Small critical sections
- Guaranteed to have many conflicts
- System already has central database

---

### 2.2 Optimistic Locking

**Philosophy:** "Assume conflicts are rare. Detect and retry."

#### How It Works

```
Request 1           Request 2
───────────         ───────────
Read v=1, data  ──→ Read v=1, data
Modify data         Modify data
Write: v=1→v=2 ✓    Write: v=1→v=2 ❌
(version matches)   (version doesn't match!)
                    CONFLICT DETECTED
                    RETRY required
```

#### Implementation

```javascript
// Optimistic locking pattern
const { data, version } = await db.get(id);  // Get version
const modified = modifyData(data);

// Update only if version still matches
const result = await db.update(id, modified, { expectedVersion: version });

if (result.success) {
  console.log('Success');
} else {
  console.log('Conflict! Version changed from', version, 'to', result.currentVersion);
  // Retry logic
}
```

#### Pros & Cons

✅ **High Performance:** No blocking  
✅ **Scalable:** Works in distributed systems  
❌ **Complex:** Requires retry logic  
❌ **High Overhead:** When many conflicts occur  
❌ **Stale Data:** May read outdated information

#### When to Use

- Read-heavy systems (conflicts are rare)
- Distributed systems
- Performance critical
- Acceptable to retry on conflict

---

### 2.3 Distributed Locking

**Philosophy:** "Coordinate across multiple systems using consensus."

#### How It Works (SETNX)

```
Distributed Systems (all accessing Redis)
───────────────────────────────────────

Time | Server A           | Server B           | Server C           | Redis
-----|-------------------|-------------------|-------------------|--────
T0   | SETNX lock (NX)  →             →             →        ✅ OK  | SET lock
T1   | Critical section |           | SETNX (NX) ←  ←            | KEY_EXISTS
     |                 |           | ❌ Fails      |            | (LOCKED)
T2   | DEL lock        →             →             →        OK  | DEL lock
T3   |                 | SETNX (NX) ←  ←            ✅ OK       | SET lock
     |                 | Critical    |            |            |
T4   |                 | DEL lock   →  →           →       OK  | DEL lock
```

#### Implementation

```javascript
// SETNX (Set if Not eXists) - Atomic
const acquired = await redis.set('lock:key', '1', 'PX', 5000, 'NX');
//                                              ↑  ↑    ↑
//                                         TTL  milliseconds  NX=Only if not exists

if (!acquired) {
  return res.status(409).json({ error: 'Locked' });
}

try {
  // Critical section
  await criticalOperation();
} finally {
  await redis.del('lock:key');  // Always release
}
```

#### Redlock Algorithm (Multi-Instance Failover)

```
Clock skew tolerance:
- 3 Redis instances minimum
- Acquire lock on 2/3 majority (N/2 + 1)
- TTL >> network delay

Fault tolerance:

Scenario 1: One instance down
  Redis1 (UP)    Redis2 (DOWN)   Redis3 (UP)
  ✅ Locked       ❌ No response  ✅ Locked
  Result: 2/3 success → LOCK GRANTED

Scenario 2: Two instances down
  Redis1 (UP)    Redis2 (DOWN)   Redis3 (DOWN)
  ✅ Locked       ❌ No response  ❌ No response
  Result: 1/3 success → LOCK FAILED (reject all)
```

#### Pros & Cons (SETNX)

✅ **Fast:** No blocking, atomic at protocol level  
✅ **Simple:** Just 2 commands (SET, DEL)  
❌ **Single Point of Failure:** Redis crash = more issues  
❌ **Single Instance Only:** Can't handle Redis replication failure

#### Pros & Cons (Redlock)

✅ **Fault Tolerant:** Survives single/multiple instance failures  
✅ **Distributed:** Designed for distributed systems  
❌ **Complex:** Requires multiple Redis instances  
❌ **Requires Good Network:** Assumes < 100ms latency  
❌ **Clock Dependent:** Assumes synchronized clocks

#### When to Use

**SETNX:** Single Redis instance, high availability of Redis guaranteed  
**Redlock:** Multiple servers, microservices, needs fault tolerance

---

## Part 3: Critical Concepts

### 3.1 Atomicity vs. Isolation

```
Atomicity: All or nothing execution
  ✓ ALL operations complete
  ✗ NONE complete (on error)
  
  Example: Bank transfer
  - Both: Debit Alice AND Credit Bob
  - Never: Only debit Alice (money vanishes)

Isolation: No partial state visibility
  Request 1: Read → Modify → Write
  Request 2:           ↑
         Can't see partially modified data
         Either sees old state OR fully new state
```

### 3.2 Lock Granularity

```
Coarse-Grained Lock (Large Critical Section)
─────────────────────────────────────────
LOCK entire_user_data
  ├─ Update profile          (1ms)
  ├─ Update settings         (1ms)
  ├─ Update preferences      (1ms)
  └─ Update notifications    (1ms)
UNLOCK                        (Total: 4ms locked)

❌ Inefficient: Other requests blocked for 4ms

Fine-Grained Locks (Small Critical Sections)
─────────────────────────────────────────
LOCK profile             (1ms) ──→ UNLOCK
LOCK settings            (1ms) ──→ UNLOCK
LOCK preferences         (1ms) ──→ UNLOCK
LOCK notifications       (1ms) ──→ UNLOCK
(Total: 4ms work, but only 1ms locked at a time)

✅ Better: More concurrency possible
```

### 3.3 Lock Contention Scenarios

```
Scenario 1: LOW Contention (Rare Conflicts)
───────────────────────────────────────────
Request 1 locks resource
Request 2 waits... (1ms)
Result: Minimal impact

Scenario 2: HIGH Contention (Frequent Conflicts)
────────────────────────────────────────────────
Request 1 locks
Request 2 waits (5ms)
Request 3 waits (10ms)
Request 4 waits (15ms)
Request 5 waits (20ms)
...
Result: Queue forms, all requests slow down
```

### 3.4 Deadlock Risk

```
Transaction A              Transaction B
Lock Resource 1             Lock Resource 2
  (acquired)                  (acquired)
Try lock Resource 2 ──→ ⏳    (waiting)
  (waiting)
                        Try lock Resource 1
                          (waiting) ←── ⚠️ DEADLOCK!

Both waiting for each other forever.
Neither can proceed. System hangs.
```

**Prevention:**
1. **Lock Ordering:** Always lock in same order (A before B)
2. **Timeout:** Release after X ms and retry
3. **Avoid Nested Locks:** Flatten lock requirements

---

## Part 4: Analysis & Performance

### 4.1 Throughput vs. Safety

```
High Throughput, No Locking    | SAFE but Slow
└─ Data corruption possible    | └─ Perfect consistency
└─ Fast (100k req/s)           | └─ Slow (1k req/s)
└─ Not production-ready        | └─ Production-safe

Optimistic Locking             | Distributed Locking
(Read-Heavy)                   | (Both)
└─ Fast (50k req/s)            | └─ Medium (10k req/s)
└─ Retries on conflict         | └─ Blocks on contention
└─ Ideal: 10% conflicts        | └─ Ideal: 1% conflicts
```

### 4.2 Lock Performance Analysis

```
Lock Acquisition Time: T_lock
Critical Section Time: T_critical
Lock Release Time: T_release
Contention Rate: C (requests / second trying to lock)

Total Time = T_lock + T_critical + T_release

With Contention:
Request 1: T_lock + T_critical + T_release = 20ms
Request 2: (20ms wait) + T_lock + T_critical + T_release = 40ms
Request 3: (40ms wait) + T_lock + T_critical + T_release = 60ms

Queue depth grows exponentially with contention!
```

### 4.3 Bottleneck Detection

```
Metrics to Monitor:
───────────────────
1. Lock Wait Time
   - If > 10% of request latency → HIGH CONTENTION
   
2. Lock Acquisition Failures (409 responses)
   - If > 5% → Consider optimistic locking
   
3. Lock Hold Time
   - If > 100ms → Consider breaking down critical section
   
4. Timeout Rate
   - If any timeouts → Set timeout too low or real deadlock
```

---

## Part 5: Real-World Patterns

### 5.1 Idempotency Pattern (Using Locks)

```
Problem: Request idempotency
  Client sends request, gets timeout
  Client retries same request
  Server processes twice! → Duplicate charge, etc.

Solution: Idempotency key + Lock

LOCK idempotency_key_XYZ
  If exists in cache:
    return cached_response  // Already processed
  Else:
    result = process_request()
    cache[key] = result     // Save result
UNLOCK

Retried request:
  Finds result in cache
  Returns same response
  No double-processing!
```

### 5.2 Cache Stampede Prevention

```
Problem: Thundering Herd
  Cache expires (popular item)
  1000 concurrent requests all hit database
  Database overloaded, slow, cascading failure

Solution: Lock during cache refresh

first_request:
  LOCK cache_refresh_key
  if not in cache:
    data = expensive_db_query()
    cache[key] = data
  UNLOCK

subsequent_requests:
  ⏳ Wait (other request refreshing)
  Data now in cache
  Return immediately

Result: Only ONE database query, 1000s serve from cache
```

### 5.3 Distributed Job Coordination

```
Problem: Multiple servers might process same job
  Server1 processes invoice
  Server2 also processes invoice
  Both charge customer twice

Solution: Lock with lease

server1:
  LOCK invoice_123 (5 minute lease)
  processInvoice(123)
  UNLOCK

server2:
  LOCK invoice_123 -> FAILS (already locked)
  Wait or try different invoice
  Eventually LOCK succeeds after lease expires

Result: Exactly one server processes each invoice
```

---

## Part 6: Comparison Table - All Locking Strategies

| Aspect | No Lock | Optimistic | Pessimistic | SETNX | Redlock |
|--------|---------|-----------|-------------|-------|---------|
| **Safety** | ❌❌❌ | ✅ | ✅✅ | ✅ | ✅✅ |
| **Performance** | ✅✅✅ | ✅✅ | ❌ | ✅ | ✅ |
| **Scalability** | ✅✅ | ✅ | ❌ | ✅ | ✅ |
| **Distributed** | ✅ | ✅ | ❌ | ✅ | ✅✅ |
| **Complexity** | Simple | Medium | High | Low | Medium |
| **Conflict Handling** | Data loss | Retry | Block | 409 Error | 409 Error |
| **Suitable For** | Non-critical | Read-heavy | Strong ACID | Single-instance | Distributed |
| **Lock Overhead** | 0% | Medium | High | Low | Medium |
| **Deadlock Risk** | No | No | Yes | No | No |

---

## Part 7: Debugging & Troubleshooting

### 7.1 Common Issues

#### Issue 1: "Lock Not Releasing"

```
Symptom: All requests get 409, system hangs
Root Cause: Exception in critical section, lock never deleted

try {
  lock = SETNX key
  process()           // ❌ Throws exception here
  DEL lock            // Never reached!
} catch (e) {
  // Lock stuck forever, TTL must expire
}

Fix: Always use try/finally
try {
  lock = SETNX key
  process()
} finally {
  if (lock) DEL lock  // Always runs
}
```

#### Issue 2: "Intermittent 409 Errors"

```
Symptom: Some requests succeed, others fail with 409
Root Cause: Lock TTL too short or long operations

Lock acquired (TTL=1s)
0-0.5s:  Processing... ✓
0.5-1.0s: Processing continues... ✓
1.0s:    Lock expired! ⚠️
1.0-1.5s: Another process acquires lock ❌
1.5s:    First process finishes (stale data!)

Fix: Set appropriate TTL
TTL should be:
  TTL = 2 × (average operation time)
  + network latency buffer (100-500ms)
```

#### Issue 3: "Periodic Timeout Spikes"

```
Symptom: Every 60 seconds, requests slow down
Root Cause: High contention window

Scenario: Background job locks every 60 seconds for 5 seconds
T=60s:  Background job: LOCK
T=60-65s: All user requests fail with 409
T=65s:  Background job: UNLOCK
T=65s+: Performance returns

Fix: Use low-contention time Windows
  - Run heavy background jobs off-peak
  - Use read replicas to avoid locking reads
  - Implement queue for background work
```

### 7.2 Debugging Tools

```javascript
// Monitor lock contention
logger.info('Lock metrics', {
  lock_wait_time_ms: Date.now() - requestStart,
  lock_acquired: lockObtained,
  queue_depth: activeRequests - 1,
  contention_rate: failures / totalRequests
});

// Detect deadlocks
if (lockWaitTime > 30000) {
  logger.error('Potential deadlock detected', {
    lock_key: key,
    wait_time: lockWaitTime,
    request_id: req.id
  });
}
```

---

## Part 8: Key Takeaways

### 8.1 When to Use What

```
Single-Server, High Concurrency
  → Use SETNX or database locks
  → Simple, fast, sufficient

Multi-Server, Must Handle Failover
  → Use Redlock
  → Distributed consensus required

Read-Heavy (90% reads, 10% writes)
  → Use Optimistic Locking
  → Conflicts rare, better performance

Write-Heavy (many concurrent updates)
  → Use locks (SETNX or Redlock)
  → Conflicts frequent, locking better
```

### 8.2 Performance Rules of Thumb

```
Lock Hold Time:
  ✅ Good:   < 10ms
  ⚠️ Warning: 10-100ms
  ❌ Bad:    > 100ms

Lock Wait Time (at 100 req/s):
  ✅ Good:   < 10ms
  ⚠️ Warning: 10-50ms
  ❌ Bad:    > 50ms

Contention Rate:
  ✅ Good:   < 1%
  ⚠️ Warning: 1-5%
  ❌ Bad:    > 5%
```

### 8.3 Production Checklist

- [ ] Use try/finally for lock releases
- [ ] Set reasonable TTL (2x operation time)
- [ ] Monitor lock wait times
- [ ] Log all lock conflicts (409s)
- [ ] Implement exponential backoff for retries
- [ ] Test concurrent scenarios
- [ ] Implement timeout on lock acquisition
- [ ] Have fallback strategy for lock failure
- [ ] Document lock dependencies (avoid deadlock)
- [ ] Use distributed tracing to identify lock bottlenecks

---

## References

- Redis SETNX: http://redis.io/commands/set (NX PX options)
- Redlock Algorithm: http://redis.io/topics/distlock
- Google Chubby: Distributed lock service paper
- Apache Zookeeper: Distributed coordination
- Etcd: Distributed key-value with locking support
