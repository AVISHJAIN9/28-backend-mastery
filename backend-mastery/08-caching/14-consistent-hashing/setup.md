# Setup Guide: Module 14 - Consistent Hashing

## Quick Start
```bash
cd 14-consistent-hashing
npm install
npm start
```
Open: **http://localhost:6414**

## Key Concepts

### Simple Hashing Problem
```
hash(key) % numNodes
Adding node: ~66% of keys rehash (bad!)
```

### Consistent Hashing Solution
```
Place key/nodes on ring, assign to next node clockwise
Adding node: ~33% of keys rehash (good!)
```

### Virtual Nodes
```
Each node multiple positions on ring
Even distribution, balanced load
```

## Features

- **Hash Key**: See which node stores a key
- **Add/Remove Nodes**: Simulate cluster changes
- **View Distribution**: See keys across nodes
- **Track Rehashing**: Monitor key movement

## Next: Module 15 - Negative Caching
