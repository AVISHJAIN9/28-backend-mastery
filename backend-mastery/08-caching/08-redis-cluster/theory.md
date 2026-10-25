# Redis Cluster: Distributed Caching at Scale

## What is Redis Cluster?

Redis Cluster is a distributed implementation of Redis that shards data across multiple nodes, providing scalability, redundancy, and high availability.

**Single Redis Limitation:**
```
Single Redis Server
  ├─ Max memory: ~128GB
  ├─ Max throughput: ~1M ops/sec
  ├─ Single point of failure
  └─ No automatic replication
```

**Redis Cluster Solution:**
```
Distributed Redis Cluster
  ├─ Memory: 128GB × N nodes
  ├─ Throughput: 1M ops/sec × N nodes
  ├─ Built-in redundancy
  └─ Automatic failover
```

## Cluster Architecture

### Hash Slots (16,384 total)

Redis Cluster divides the keyspace into 16,384 hash slots. Each key is assigned to one slot.

```javascript
// Key to slot mapping
const slot = crc16(key) % 16384;

// Example:
// Key "user:1" → slot 5461
// Key "user:2" → slot 12345  (different node!)
// Key "post:1" → slot 8192
```

### Node Distribution

```
Redis Cluster (3 primary nodes + 3 replicas)

Primary Nodes
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Node 1    │  │   Node 2    │  │   Node 3    │
│ Slots       │  │ Slots       │  │ Slots       │
│ 0-5460      │  │ 5461-10922  │  │ 10923-16383 │
└─────────────┘  └─────────────┘  └─────────────┘
      │                │                │
      ↓                ↓                ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Replica 1   │  │ Replica 2   │  │ Replica 3   │
│ (backup for 1) │(backup for 2)│(backup for 3)│
└─────────────┘  └─────────────┘  └─────────────┘
```

## Setting Up Redis Cluster

### Single-Machine Cluster (Development)

```bash
# Create 6 Redis instances on localhost
mkdir cluster
cd cluster

# Create config for each node
for i in {1..6}; do
  mkdir node-$i
  cat > node-$i/redis.conf <<EOF
port 700$i
cluster-enabled yes
cluster-config-file nodes-$i.conf
cluster-node-timeout 5000
databases 16
save ""
appendonly no
EOF
done

# Start all nodes
for i in {1..6}; do
  redis-server node-$i/redis.conf &
done

# Create cluster (3 primary + 3 replicas)
redis-cli --cluster create \
  127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 \
  127.0.0.1:7004 127.0.0.1:7005 127.0.0.1:7006 \
  --cluster-replicas 1
```

### Production Cluster (Multi-Server)

```javascript
// Use cluster-aware client
const Redis = require('redis-cluster');

const client = new Redis.Cluster([
  { host: 'redis-1.example.com', port: 6379 },
  { host: 'redis-2.example.com', port: 6379 },
  { host: 'redis-3.example.com', port: 6379 },
  { host: 'redis-4.example.com', port: 6379 },
  { host: 'redis-5.example.com', port: 6379 },
  { host: 'redis-6.example.com', port: 6379 }
]);

// Operations work transparently across cluster
await client.set('key', 'value');  // Automatically routes to correct node
const value = await client.get('key');
```

## Cluster Operations

### Key Distribution Across Nodes

```javascript
// Different keys go to different nodes
await client.set('user:1', '...');    // Node 1
await client.set('user:2', '...');    // Node 2
await client.set('user:3', '...');    // Node 3
await client.set('user:4', '...');    // Node 1 (wraps around)

// Computation distributed across cluster
// Throughput: 1M ops/sec × 6 nodes = 6M ops/sec!
```

### Hash Tags (Forcing Keys to Same Slot)

Sometimes you need multiple keys on the same node (for transactions, etc):

```javascript
// Without hash tag: keys go to different nodes
await client.set('order:123:user', 'alice');    // Slot X
await client.set('order:123:items', '[...]');   // Slot Y
// ✗ Can't use MULTI/transaction across slots!

// With hash tag: keys go to SAME node
await client.set('order:123:{123}:user', 'alice');    // Slot Z
await client.set('order:123:{123}:items', '[...]');   // Slot Z
// ✓ Now transaction works!

// Usage
const orderId = '123';
const tag = `{${orderId}}`;

await client.multi()
  .set(`order:${tag}:user`, 'alice')
  .set(`order:${tag}:items`, '[...]')
  .exec();
```

## Replication & Failover

### Data Replication

```
Node 1 (Primary)          Node 4 (Replica)
- Slot 0-5460             - Copy of Node 1
- Handles writes           - Takes over if N1 fails
- Read/Write allowed       - Reads allowed

Write: "user:1" → Node 1 → Replicated → Node 4

If Node 1 crashes:
  › Node 4 promoted to primary
  › Another node replicates Node 4
  › Zero data loss (if N4 was current)
```

### Monitoring Cluster Health

```javascript
// Check cluster info
const info = await client.cluster('INFO');
console.log(info);

// Check node status
const nodes = await client.cluster('NODES');
nodes.forEach(node => {
  console.log(`${node.id}: ${node.flags}`);
  // flags: master, slave, fail, etc.
});

// Check slots
const slots = await client.cluster('SLOTS');
slots.forEach(slot => {
  console.log(`Slot ${slot.start}-${slot.end}: ${slot.nodes}`);
});
```

## Limitations & Workarounds

### Limitation 1: Multi-Key Operations Across Slots

```javascript
// ✗ WRONG: Keys on different slots
try {
  await client.mset('key1', 'val1', 'key2', 'val2');  // May fail!
} catch (err) {
  console.error('CROSSSLOT error');
}

// ✓ RIGHT: Use hash tags
const tag = '{batch1}';
await client.mset(`key1:${tag}`, 'val1', `key2:${tag}`, 'val2');
// Both keys go to same slot
```

### Limitation 2: SCAN Operations

```javascript
// ✗ Partial: SCAN only returns keys from one node
const result = await client.scan(0);

// ✓ Full: Use cluster SCAN
async function scanCluster() {
  const keys = [];
  for (let i = 0; i < 16384; i++) {
    const result = await client.cluster('GETKEYSINSLOT', i, 100);
    keys.push(...result);
  }
  return keys;
}
```

### Limitation 3: Transactions Across Slots

```javascript
// ✓ RIGHT: All keys have same tag
async function transaction() {
  const tag = '{user:123}';
  
  return client.multi()
    .get(`profile:${tag}`)
    .get(`settings:${tag}`)
    .get(`preferences:${tag}`)
    .exec();
}
```

## Cluster Scaling

### Adding Nodes

```bash
# Add new node to cluster
redis-cli --cluster add-node 127.0.0.1:7007 127.0.0.1:7001

# Redistribute slots
redis-cli --cluster reshard 127.0.0.1:7001

# For migration
redis-cli --cluster reshard 127.0.0.1:7001 \
  --cluster-from <node-id> \
  --cluster-to <new-node-id> \
  --cluster-slots 2048
```

### Removing Nodes

```bash
# First, move slots from node
redis-cli --cluster reshard --cluster-from <node-id>

# Then remove node
redis-cli --cluster del-node 127.0.0.1:7001 <node-id>
```

## Performance Considerations

### Sharding Benefits

```
Operation         Single Redis    Cluster (6 nodes)   Throughput Gain
───────────────────────────────────────────────────────────────────
Get requests      1M ops/sec      5-6M ops/sec        5-6×
Random key        Memory limited  Memory × 6          6×
Write throughput  Disk I/O limit  Parallel disk I/O   3-4×

Memory limit      ~128GB          ~768GB              6×
```

### Latency Trade-offs

```javascript
// Single Redis (no cluster)
const value = await redis.get('key');  // 1-2ms

// Cluster (minimal overhead)
const value = await cluster.get('key');  // 2-3ms (slot lookup + routing)

// Cluster with network latency (multi-dc)
const value = await cluster.get('key');  // 5-50ms depending on geography
```

## Monitoring Cluster Health

```javascript
async function healthCheck() {
  try {
    // Check each node
    const nodes = await client.cluster('NODES');
    let healthy = true;

    for (const node of nodes) {
      if (node.flags.includes('fail')) {
        console.error(`❌ Node ${node.id} failed`);
        healthy = false;
      } else if (node.flags.includes('disconnected')) {
        console.warn(`⚠️ Node ${node.id} disconnected`);
      } else {
        console.log(`✓ Node ${node.id} ok`);
      }
    }

    // Check slots coverage
    const slots = await client.cluster('SLOTS');
    const covered = slots.reduce((sum, slot) => sum + (slot.end - slot.start + 1), 0);
    
    if (covered !== 16384) {
      console.error(`❌ Only ${covered}/16384 slots covered`);
      healthy = false;
    }

    return healthy;
  } catch (err) {
    console.error('Cluster unhealthy:', err);
    return false;
  }
}
```

## When to Use Redis Cluster

**Use Redis Cluster when:**
- Need > 128GB of cache
- Single node reaching throughput limits (> 1M ops/sec)
- Require high availability (auto-failover)
- Running in enterprise environment
- Need to scale horizontally

**Don't use if:**
- Single Redis server meets needs
- Too much operational complexity expected
- Frequent transactions across many keys needed
- Using non-cluster-aware libraries

## Redis Cluster vs Redis Sentinel

| Feature | Cluster | Sentinel |
|---------|---------|----------|
| Scaling | Horizontal | N/A |
| HA | Built-in | Separate |
| Failover | Automatic | Automatic |
| Sharding | Yes | No |
| Complexity | High | Medium |
| Memory Limit | 16,384 × node_max | Single node_max |
| Good For | Enterprise scale | HA + replication |

**TL;DR: Use Cluster for massive scale, Sentinel for HA without sharding.**
