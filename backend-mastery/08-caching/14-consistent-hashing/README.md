# Module 14: Consistent Hashing

Distributed cache mapping with minimal rehashing.

## Problem Solved
When nodes join/leave cluster, data needs redistribution. Simple modulo hashing rehashes everything. Consistent hashing rehashes only affected keys.

## How It Works
- Keys and nodes placed on hash ring (0 to 2^32)
- Key assigned to next node clockwise  
- Remove node: only its zone's keys rehash (~1/N)
- Virtual nodes: even distribution

## Real-World Impact
- **3→4 nodes**: 25% keys move (vs 75% with simple)
- **Add to 1000 nodes**: 0.1% keys move
- Zero downtime deployments possible

See README for examples.
