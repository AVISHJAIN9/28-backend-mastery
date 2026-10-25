import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 6414;

app.use(helmet());
app.use(cors());
app.use(express.json());

// ============== CONSISTENT HASHING IMPLEMENTATION ==============

class ConsistentHash {
  constructor(nodes, vnodeCount = 3) {
    this.ring = new Map();
    this.nodes = nodes;
    this.vnodeCount = vnodeCount;
    this.sortedPositions = [];
    this.buildRing();
  }

  hash(key) {
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = ((h << 5) - h) + key.charCodeAt(i);
      h = h & h;
    }
    return Math.abs(h) % (2 ** 32);
  }

  buildRing() {
    this.ring.clear();
    this.sortedPositions = [];

    for (const node of this.nodes) {
      for (let i = 0; i < this.vnodeCount; i++) {
        const vnodeKey = `${node}:vnode:${i}`;
        const position = this.hash(vnodeKey);
        this.ring.set(position, node);
        this.sortedPositions.push(position);
      }
    }

    this.sortedPositions.sort((a, b) => a - b);
  }

  getNode(key) {
    if (this.ring.size === 0) return null;

    const position = this.hash(key);

    // Find the first position >= key's position (clockwise)
    for (const pos of this.sortedPositions) {
      if (pos >= position) {
        return this.ring.get(pos);
      }
    }

    // Wrap around to first position
    return this.ring.get(this.sortedPositions[0]);
  }

  addNode(node) {
    if (!this.nodes.includes(node)) {
      this.nodes.push(node);
      this.buildRing();
    }
  }

  removeNode(node) {
    const index = this.nodes.indexOf(node);
    if (index > -1) {
      this.nodes.splice(index, 1);
      this.buildRing();
    }
  }

  getNodePositions(node) {
    const positions = [];
    for (const [pos, n] of this.ring.entries()) {
      if (n === node) positions.push(pos);
    }
    return positions.sort((a, b) => a - b);
  }
}

// ============== SIMULATION DATA ==============

const nodeStates = new Map();

// Initialize node states
function initializeNodes(nodes) {
  for (const node of nodes) {
    nodeStates.set(node, new Map());
  }
}

// Simulate data storage on nodes
function setValue(hash, key, value, node) {
  if (!nodeStates.has(node)) {
    nodeStates.set(node, new Map());
  }
  nodeStates.get(node).set(key, value);
}

function getValue(key, node) {
  return nodeStates.get(node)?.get(key) || null;
}

function deleteValue(key, node) {
  nodeStates.get(node)?.delete(key);
}

// ============== GLOBAL STATE ==============

let hash = new ConsistentHash(['Node-A', 'Node-B', 'Node-C'], 3);
initializeNodes(hash.nodes);

// Sample data
const sampleData = {
  'user:1': { id: 1, name: 'Alice' },
  'user:2': { id: 2, name: 'Bob' },
  'user:3': { id: 3, name: 'Charlie' },
  'product:101': { id: 101, name: 'Laptop', price: 999 },
  'product:102': { id: 102, name: 'Mouse', price: 25 },
  'product:103': { id: 103, name: 'Keyboard', price: 79 },
  'order:1001': { id: 1001, amount: 1099, items: 2 },
  'order:1002': { id: 1002, amount: 104, items: 2 },
  'order:1003': { id: 1003, amount: 79, items: 1 }
};

// Warm up with sample data
for (const [key, value] of Object.entries(sampleData)) {
  const node = hash.getNode(key);
  setValue(hash, key, value, node);
}

// ============== API ENDPOINTS ==============

// Get current ring state
app.get('/api/ring/state', (req, res) => {
  const state = {
    nodes: hash.nodes,
    vnodeCount: hash.vnodeCount,
    totalVnodes: hash.ring.size,
    distribution: {}
  };

  for (const node of hash.nodes) {
    const positions = hash.getNodePositions(node);
    const keyCount = Array.from(nodeStates.get(node) || new Map()).length;
    state.distribution[node] = {
      vnodes: positions.length,
      keys: keyCount,
      positions: positions.slice(0, 3) // Show first 3
    };
  }

  res.json(state);
});

// Hash a key to show which node it goes to
app.get('/api/hash/:key', (req, res) => {
  const { key } = req.params;
  const node = hash.getNode(key);
  const position = hash.hash(key);

  res.json({
    key,
    position,
    assignedNode: node,
    value: getValue(key, node)
  });
});

// Get or set value
app.post('/api/value', (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'Key required' });

  const node = hash.getNode(key);
  if (value !== undefined) {
    setValue(hash, key, value, node);
  }

  const storedValue = getValue(key, node);
  res.json({
    key,
    value: storedValue,
    node,
    position: hash.hash(key)
  });
});

// Get all keys and their assignments
app.get('/api/keys', (req, res) => {
  const distribution = {};

  for (const node of hash.nodes) {
    distribution[node] = Array.from(nodeStates.get(node) || new Map()).map(([key]) => ({
      key,
      position: hash.hash(key)
    }));
  }

  res.json(distribution);
});

// Add node
app.post('/api/node/add/:nodeName', (req, res) => {
  const { nodeName } = req.params;
  const oldState = JSON.parse(JSON.stringify(Object.fromEntries(nodeStates)));

  hash.addNode(nodeName);
  initializeNodes(hash.nodes);

  // Simulate rehashing: redistribute all keys
  const allKeys = Object.keys(sampleData);
  let movedCount = 0;
  const moved = [];

  for (const key of allKeys) {
    const oldNode = Object.entries(oldState)
      .find(([_, m]) => m[key])?.[0];
    const newNode = hash.getNode(key);

    if (oldNode && newNode !== oldNode) {
      movedCount++;
      moved.push({ key, from: oldNode, to: newNode });
      setValue(hash, key, sampleData[key], newNode);
    } else if (!oldNode) {
      setValue(hash, key, sampleData[key], newNode);
    }
  }

  res.json({
    message: `Added node ${nodeName}`,
    keysMoved: movedCount,
    movedKeys: moved.slice(0, 10),
    totalKeys: allKeys.length,
    movePercentage: ((movedCount / allKeys.length) * 100).toFixed(1) + '%'
  });
});

// Remove node
app.post('/api/node/remove/:nodeName', (req, res) => {
  const { nodeName } = req.params;

  if (!hash.nodes.includes(nodeName)) {
    return res.status(400).json({ error: `Node ${nodeName} not found` });
  }

  const keysOnNode = Array.from(nodeStates.get(nodeName) || new Map()).map(([k]) => k);
  let movedCount = 0;
  const moved = [];

  // Remove node and redistribute its keys
  hash.removeNode(nodeName);

  // Rehash all keys that were on removed node
  for (const key of keysOnNode) {
    if (sampleData[key]) {
      const newNode = hash.getNode(key);
      moved.push({ key, from: nodeName, to: newNode });
      setValue(hash, key, sampleData[key], newNode);
      movedCount++;
    }
  }

  nodeStates.delete(nodeName);

  res.json({
    message: `Removed node ${nodeName}`,
    keysReassigned: movedCount,
    reassignedKeys: moved,
    remainingNodes: hash.nodes
  });
});

// Reset
app.post('/api/reset', (req, res) => {
  hash = new ConsistentHash(['Node-A', 'Node-B', 'Node-C'], 3);
  nodeStates.clear();
  initializeNodes(hash.nodes);

  for (const [key, value] of Object.entries(sampleData)) {
    const node = hash.getNode(key);
    setValue(hash, key, value, node);
  }

  res.json({ message: 'Reset to initial state' });
});

// ============== START SERVER ==============

app.listen(HTTP_PORT, () => {
  console.log(`\n🚀 Consistent Hashing Server running on http://localhost:${HTTP_PORT}`);
  console.log(`📊 Dashboard: http://localhost:${HTTP_PORT}/index.html`);
  console.log(`\n📍 Initial Ring State:`);
  console.log(`   Nodes: ${hash.nodes.join(', ')}`);
  console.log(`   Vnodes per node: ${hash.vnodeCount}`);
  console.log(`   Total vnodes: ${hash.ring.size}`);
});
