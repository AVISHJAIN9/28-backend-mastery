# Bloom Filters: A Deep Dive

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:6406
```

## What is a Bloom Filter?

A **Bloom filter** is a probabilistic data structure for set membership testing. It's space-efficient but allows false positives (never false negatives).

**Key Properties:**
- **Memory:** O(n) bits (1/100th the size of a hash set!)
- **Speed:** O(k) lookups where k = number of hash functions
- **False Positives:** Yes (1-5% typical)
- **False Negatives:** Never
- **Deletion:** Not supported in standard version

## Key Concepts

### 1. How It Works

```
Add "john@example.com":
  hash1("john@example.com") = 2    → set bit[2]
  hash2("john@example.com") = 7    → set bit[7]
  hash3("john@example.com") = 15   → set bit[15]

Check "alice@example.com":
  hash1("alice@example.com") = 3   → bit[3] = 0
  Result: DEFINITELY NOT SEEN
  (No false negatives!)

Check "john@example.com":
  All bits set → PROBABLY IN SET
  (Could be false positive)
```

### 2. Space Efficiency

```
1 Million Emails (8 bytes each):
- Hash Set: 8 MB
- Bloom Filter: 122 KB (with 1% false positive)
- Ratio: 65x smaller!
```

### 3. False Positive Rate

Determined by:
- **m** = number of bits in filter
- **n** = number of items added
- **k** = number of hash functions

**Formula:** FP ≈ (1 - e^(-kn/m))^k

**Example:** With proper sizing, can achieve <1% false positive rate

## API Endpoints

### Bloom Filter (Basic) - Email Deduplication

#### POST /api/bloom/add-email
Add email to Bloom filter

```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "email": "user@example.com",
  "itemCount": 45,
  "estimatedFPRate": "0.342%",
  "note": "Email added to Bloom filter"
}
```

#### GET /api/bloom/check-email/:email
Check if email might be duplicate

```
GET /api/bloom/check-email/user@example.com
```

Response (New Email):
```json
{
  "success": true,
  "mightBeInSet": false,
  "result": "Definitely NOT seen",
  "note": "✓ Definitely new"
}
```

Response (Possible Duplicate):
```json
{
  "success": true,
  "mightBeInSet": true,
  "result": "Probably seen (needs DB check)",
  "note": "⚠️ False positive possible"
}
```

### Bloom Filter (URL Blacklist)

#### POST /api/bloom/add-url
Add malicious URL to blacklist

```json
{
  "url": "https://malicious-site.com"
}
```

#### GET /api/bloom/check-url/:url
Check if URL is suspicious

```
GET /api/bloom/check-url/https://example.com
```

Response:
```json
{
  "success": true,
  "mightBeBlacklisted": false,
  "result": "Looks safe",
  "note": "✓ Probably safe"
}
```

**Real-World Example:** Chrome Safe Browsing uses similar approach with ~99.9% accuracy

### Counting Bloom Filter (Frequency Tracking)

#### POST /api/counting/add-id
Increment frequency counter for ID

```json
{
  "id": "user:123"
}
```

#### GET /api/counting/frequency/:id
Get access frequency for ID

```
GET /api/counting/frequency/user:123
```

Response:
```json
{
  "success": true,
  "frequency": 42,
  "isFrequent": true,
  "note": "High frequency access"
}
```

**Use Case:** Cache access patterns, rate limiting, hotspot detection

#### POST /api/counting/remove-id
Decrement frequency counter (supports deletion!)

```json
{
  "id": "user:123"
}
```

Difference from standard Bloom filter: Counting Bloom allows deletion

### Utility Endpoints

#### POST /api/compare/space
Compare Bloom filter vs Hash Set memory

```json
{
  "testSet": [
    "item-1",
    "item-2",
    "item-3"
  ]
}
```

Response:
```json
{
  "success": true,
  "itemCount": 1000,
  "hashSetMemory": "50000 bytes",
  "bloomFilterMemory": "1250 bytes",
  "compressionRatio": "40.0x",
  "advantage": "Bloom filter is more efficient"
}
```

#### GET /api/stats
Get Bloom filter statistics and metrics

Response:
```json
{
  "bloomFilters": {
    "emails": {
      "itemCount": 234,
      "memory": "12500 bytes",
      "estimatedFPRate": "0.234%"
    },
    "urls": {
      "itemCount": 567,
      "memory": "25000 bytes",
      "estimatedFPRate": "0.145%"
    }
  },
  "metrics": {
    "bloomChecks": 1234,
    "countingOperations": 456
  }
}
```

## Real-World Use Cases

### 1. Email Deduplication
```
New signup form:
├─ Check Bloom filter: "Definitely new" (fast)
├─ Skip DB query, create account
└─ Total latency: 1ms vs 100ms DB query
```

### 2. Chrome Safe Browsing
```
User visits "malicious.com":
├─ Check local Bloom filter
├─ Fast, works offline
├─ 1-5% false positives OK
└─ Full verification on positive match
```

### 3. Data Deduplication
```
Ingesting CSV with 100k rows:
├─ Check Bloom filter for each row
├─ "Definitely new" → Insert
├─ "Maybe duplicate" → Check DB
└─ 99% fast inserts, 1% slow inserts
```

### 4. Rate Limiting
```
Use Counting Bloom to track per-IP requests:
├─ Increment counter on each request
├─ Check if > limit
├─ Memory efficient for millions of IPs
└─ Support deletion after rate reset
```

### 5. Cryptocurrency SPV
```
Bitcoin lite client:
├─ Download Bloom filter of transactions
├─ Check locally without full blockchain
├─ Some false positives are acceptable
└─ Privacy trade-off: slight tracking risk
```

## Comparison Table

| Aspect | Bloom Filter | Hash Set | Database |
|--------|-------------|----------|----------|
| **Memory** | O(n) bits | O(n) bytes | N/A |
| **Speed** | Very fast | Very fast | Slow |
| **FP** | Yes | No | No |
| **Deletion** | No (std) | Yes | Yes |
| **Persistence** | No | No | Yes |
| **Use** | Approximate | Exact | Exact |

## Common Mistakes & Lessons

### Mistake 1: False Positives as Certain
```javascript
// ❌ WRONG
if (emailBF.contains(email)) {
  return "Duplicate";  // 5% false positive rate!
}

// ✅ RIGHT
if (!emailBF.contains(email)) {
  return "Definitely new";
} else {
  const inDB = await db.findEmail(email);
  if (inDB) return "Duplicate";
  else return "New (false positive)";
}
```

### Mistake 2: Not Monitoring FP Rate
```javascript
// ❌ WRONG - assume 1% FP rate, didn't measure
const bf = new BloomFilter(10000);
// After 50,000 items added, actual FP = 30%!

// ✅ RIGHT - monitor in production
const actualFP = testBloomFilter(bf, testData);
if (actualFP > expectedFP * 1.5) {
  rebuildWithLargerSize();
}
```

### Mistake 3: Using for Deletion
```javascript
// ❌ WRONG - standard Bloom doesn't support deletion
bf.add("item");
bf.delete("item");  // Broken!
// Future lookups may be incorrect

// ✅ RIGHT - use Counting Bloom for deletion
const cbf = new CountingBloomFilter();
cbf.add("item");
cbf.remove("item");  // Works!
```

#### Mistake 4: Wrong Size Estimate
```javascript
// ❌ WRONG - estimating too low
const bf = new BloomFilter(1000);  // For 10k items!
// FP rate becomes 50%+

// ✅ RIGHT - calculate properly
m = -(n * ln(p)) / (ln(2)^2)
// Or use scalable variant
const sbf = new ScalableBloomFilter();
```

### Mistake 5: Serialization Issues
```javascript
// ❌ WRONG - naive JSON serialization
const json = JSON.stringify(bloomFilter);
// Loses binary representation, huge file

// ✅ RIGHT - serialize Uint8Array efficiently
const serialized = btoa(String.fromCharCode(...bf.bits));
const restored = new Uint8Array(atob(serialized).split('').map(c => c.charCodeAt(0)));
```

## Implementation Checklist

- [ ] Define false positive rate target (1%, 5%, 10%)
- [ ] Calculate filter size: m = -(n * ln(p)) / (ln(2)^2)
- [ ] Choose k hash functions: k = (m/n) * ln(2)
- [ ] Implement BloomFilter class
- [ ] Test with small dataset
- [ ] Measure actual false positive rate
- [ ] Compare vs Hash Set memory usage
- [ ] Decide if need Counting Bloom (for deletion)
- [ ] Set up monitoring dashboard
- [ ] Plan rebuild strategy
- [ ] Document false positive caveat
- [ ] Load test with production volume
- [ ] Choose hash function carefully
- [ ] Handle serialization (if needed)
- [ ] Update team documentation

## Further Learning

- Scalable Bloom Filters (dynamic sizing)
- Cuckoo Filters (deletion + lower FP)
- Quotient Filters (compact, queryable)
- Forbidden Patterns (minimal storage)
- Distributed Bloom Filters (sharded)
- Probabilistic Counting (cardinality estimation, HyperLogLog)

## Production Considerations

1. **Monitor FP Rate:** Track actual vs estimated in production
2. **Plan Rebuilds:** What happens when FP rate exceeds threshold?
3. **Persistence:** Do filters need to survive restarts?
4. **Distribution:** Single node vs sharded across multiple servers?
5. **Variants:** When to use Counting vs Cuckoo vs Scalable?
6. **Serialization:** How to snapshot filters for backup?

---

## Further Reading

- [Wikipedia: Bloom Filter](https://en.wikipedia.org/wiki/Bloom_filter)
- [Bloom Filters by Example](https://www.eecs.harvard.edu/~michaelm/postscripts/tr-02-05.pdf)
- [Chrome Safe Browsing API](https://developers.google.com/safe-browsing)
