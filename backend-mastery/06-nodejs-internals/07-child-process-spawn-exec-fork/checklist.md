# Child Processes - Implementation Checklist

## Method Selection
- [ ] Know when to use spawn vs exec
- [ ] Understand exec shell injection risks
- [ ] Know fork for Node-to-Node
- [ ] Benchmark for your use case
- [ ] Consider buffer limits

## Implementation
- [ ] Spawn for large output
- [ ] Exec for simple commands
- [ ] execFile for security
- [ ] Fork for parallel Node
- [ ] Handle all errors

## Production Ready
- [ ] Set timeouts
- [ ] Handle exit codes
- [ ] Clean up processes
- [ ] Log failures
- [ ] Test edge cases
