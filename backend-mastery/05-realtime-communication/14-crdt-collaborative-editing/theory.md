# CRDT Theory - Conflict-Free Collaborative Editing

## The Challenge

```
User1: Creates document "Hello"
         ↓
User1: Adds " World"  → "Hello World"
User2: (offline)       (no sync)
       ↓
User2: Adds " from me" → "Hello from me"
       ↓
Reconnect: Both have different content
Which is correct???
```

## CRDT (Conflict-free Replicated Data Type)

CRDT allows updates from multiple sources to automatically merge to same state without conflicts.

### Key Properties
```
1. Commutative: Order doesn't matter
   A + B = B + A

2. Idempotent: Duplicates are safe
   Apply operation twice = same result

3. Convergent: All replicas reach same state
   Eventually consistent across network
```

## Operational Transformation

### Position-Based
```
Document: "Hello"
Operation: Insert "X" at position 3
Result: "HeXllo"

Problem: If User2 deletes position 0, positions shift
User1's position 3 now points to wrong location
```

### Solution: Transform Operations
```
User1: Insert "X" at 3 → "HeXllo"
User2: Delete position 0 → "ello"

Transform User2's delete:
- Since User1 inserted before position, shift by 1
- Delete position 0 in context of "HeXllo" = "eXllo"

Both reach same state: "eXllo"
```

## Implementation Example

### Simple String CRDT
```javascript
class CRDT {
  constructor() {
    this.text = '';
    this.operations = [];
  }
  
  insert(pos, char, userId, timestamp) {
    const op = { type: 'insert', pos, char, userId, timestamp };
    this.operations.push(op);
    this.rebuild();
  }
  
  delete(pos, userId, timestamp) {
    const op = { type: 'delete', pos, userId, timestamp };
    this.operations.push(op);
    this.rebuild();
  }
  
  rebuild() {
    // Sort by timestamp
    const sorted = this.operations.sort((a,b) => 
      a.timestamp - b.timestamp
    );
    
    // Apply all operations in order
    this.text = '';
    sorted.forEach(op => {
      if (op.type === 'insert') {
        this.text = this.text.slice(0, op.pos)
                   + op.char
                   + this.text.slice(op.pos);
      } else if (op.type === 'delete') {
        this.text = this.text.slice(0, op.pos)
                   + this.text.slice(op.pos + 1);
      }
    });
  }
}
```

## Advantages

✅ No conflict resolution needed
✅ Works offline
✅ Automatically converges
✅ Fault tolerant
✅ P2P friendly

## Disadvantages

❌ Complex to implement
❌ More memory (track all ops)
❌ Harder to reason about
❌ Performance overhead

## Vector Clocks

### Problem
```
How to order concurrent operations?
User1: Insert "A"
User2: Insert "B" (same position, same time)
Which wins?
```

### Solution: Vector Clock
```
Timestamp each operation with:
[userId, localCounter]

User1's ops: [1, 1], [1, 2], [1, 3]
User2's ops: [2, 1], [2, 2]

Total order: Compare (userId, counter)
[1,1] < [1,2] < [2,1] < [2,2] < [1,3]
```

## Real-World CRDTs

### Yjs
```
Popular CRDT library
Supports rich text, arrays, maps
Works with WebSocket
Example: ˙Figma, Notion use similar tech
```

### Automerge
```
JSON-like CRDT
Works offline
Good for apps with local editing
```

## Performance

### Memory
```
Stores all operations ever
1000 edits = store 1000 operations
Can snapshot and compact
```

### CPU
```
Rebuild document every change
Scales O(n) with operation count
With 10k operations, rebuild = ~10ms

Optimization: Incremental rebuild
```

## Scaling

### Problem
With 1000 concurrent users, 10k operations/sec
Each rebuild = 10ms
= 100 CPU seconds/second (not scalable)

### Solution
Use simpler OT (Operational Transform)
or limit concurrency

## Testing

```javascript
// Test convergence
const crdt1 = new CRDT();
const crdt2 = new CRDT();

crdt1.insert(0, 'A', 'user1', 1);
crdt2.insert(0, 'B', 'user2', 2);

// Exchange operations
crdt1.apply(crdt2.operations);
crdt2.apply(crdt1.operations);

// Both should have same text
assert(crdt1.text === crdt2.text);
```

## Best Practices

✅ Use proven CRDT library (Yjs, Automerge)
✅ Don't implement from scratch
✅ Snapshot periodically to save space
✅ Test with simulated network delay
✅ Monitor memory usage
✅ Test offline/online transitions
✅ Implement tombstones for deletions
✅ Version your CRDT format
✅ Handle corrupt/corrupt documents
✅ Log for debugging conflicts
