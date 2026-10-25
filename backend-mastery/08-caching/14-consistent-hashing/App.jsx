import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [ringState, setRingState] = useState(null);
  const [allKeys, setAllKeys] = useState(null);
  const [selectedKey, setSelectedKey] = useState('user:1');
  const [hashResult, setHashResult] = useState(null);
  const [nodeToAdd, setNodeToAdd] = useState('');
  const [log, setLog] = useState([]);

  const addLog = (msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [{ id: Date.now(), msg, type, timestamp }, ...prev.slice(0, 14)]);
  };

  const fetchRingState = async () => {
    try {
      const response = await fetch('/api/ring/state');
      const data = await response.json();
      setRingState(data);
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
  };

  const fetchAllKeys = async () => {
    try {
      const response = await fetch('/api/keys');
      const data = await response.json();
      setAllKeys(data);
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
  };

  const hashKey = async (key) => {
    try {
      const response = await fetch(`/api/hash/${key}`);
      const data = await response.json();
      setHashResult(data);
      addLog(`${key} → ${data.assignedNode}`, 'success');
      setTimeout(() => {
        fetchRingState();
        fetchAllKeys();
      }, 100);
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
  };

  const addNode = async () => {
    if (!nodeToAdd.trim()) return;
    try {
      const response = await fetch(`/api/node/add/${nodeToAdd}`, { method: 'POST' });
      const data = await response.json();
      addLog(`Added ${nodeToAdd}: ${data.keysMoved} keys moved (${data.movePercentage})`, 'success');
      setNodeToAdd('');
      setTimeout(() => {
        fetchRingState();
        fetchAllKeys();
      }, 100);
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
  };

  const removeNode = async (nodeName) => {
    try {
      const response = await fetch(`/api/node/remove/${nodeName}`, { method: 'POST' });
      const data = await response.json();
      addLog(`Removed ${nodeName}: ${data.keysReassigned} keys moved`, 'warning');
      setTimeout(() => {
        fetchRingState();
        fetchAllKeys();
      }, 100);
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
  };

  const reset = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      setHashResult(null);
      addLog('Reset to initial state', 'warning');
      setTimeout(() => {
        fetchRingState();
        fetchAllKeys();
      }, 100);
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    fetchRingState();
    fetchAllKeys();
  }, []);

  return (
    <div className="app">
      <header>
        <h1>🔄 Consistent Hashing</h1>
        <p>Distributed cache with minimal rehashing on node changes</p>
      </header>

      <main>
        {/* Control Panel */}
        <section className="card control">
          <h2>⚙️ Control Panel</h2>

          <div classtName="section">
            <h3>Hash Key</h3>
            <div className="input-group">
              <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
                <option value="user:1">user:1</option>
                <option value="user:2">user:2</option>
                <option value="user:3">user:3</option>
                <option value="product:101">product:101</option>
                <option value="product:102">product:102</option>
                <option value="product:103">product:103</option>
                <option value="order:1001">order:1001</option>
                <option value="order:1002">order:1002</option>
                <option value="order:1003">order:1003</option>
              </select>
              <button onClick={() => hashKey(selectedKey)} className="btn-primary">
                🔍 Hash
              </button>
            </div>
          </div>

          <div className="section">
            <h3>Manage Nodes</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="New node name (e.g., Node-D)"
                value={nodeToAdd}
                onChange={(e) => setNodeToAdd(e.target.value)}
              />
              <button onClick={addNode} disabled={!nodeToAdd.trim()} className="btn-success">
                ➕ Add Node
              </button>
            </div>

            {ringState && (
              <div className="node-buttons">
                {ringState.nodes.map(node => (
                  <button
                    key={node}
                    onClick={() => removeNode(node)}
                    className="btn-danger-sm"
                  >
                    ❌ {node}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={reset} className="btn-warning">
            🔄 Reset
          </button>
        </section>

        <div className="grid">
          {/* Ring State */}
          {ringState && (
            <section className="card ring-state">
              <h2>📍 Ring State</h2>
              <div className="state-info">
                <p><strong>Nodes:</strong> {ringState.nodes.join(', ')}</p>
                <p><strong>Vnodes per node:</strong> {ringState.vnodeCount}</p>
                <p><strong>Total vnodes:</strong> {ringState.totalVnodes}</p>
              </div>

              <h3>Distribution</h3>
              {Object.entries(ringState.distribution).map(([node, dist]) => (
                <div key={node} className="distribution-item">
                  <span className="node-name">{node}</span>
                  <span className="stat">{dist.keys} keys</span>
                  <span className="stat">{dist.vnodes} vnodes</span>
                </div>
              ))}
            </section>
          )}

          {/* Hash Result */}
          {hashResult && (
            <section className="card result">
              <h2>✓ Hash Result</h2>
              <div className="result-box">
                <p><strong>Key:</strong> {hashResult.key}</p>
                <p><strong>Position:</strong> {hashResult.position.toLocaleString()}</p>
                <p><strong>Node:</strong> <span className="highlight">{hashResult.assignedNode}</span></p>
                {hashResult.value && (
                  <div className="value">
                    <p><strong>Value:</strong></p>
                    <pre>{JSON.stringify(hashResult.value, null, 2)}</pre>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Key Distribution */}
        {allKeys && (
          <section className="card distribution">
            <h2>📦 Key Distribution</h2>
            <div className="distribution-table">
              {Object.entries(allKeys).map(([node, keys]) => (
                <div key={node} className="node-column">
                  <h3>{node} ({keys.length})</h3>
                  <div className="key-list">
                    {keys.map(k => (
                      <div key={k.key} className="key-item">
                        <span className="key-name">{k.key}</span>
                        <span className="position">{k.position % 1000}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Concepts */}
        <section className="card concepts">
          <h2>💡 Consistent Hashing Concepts</h2>

          <div className="concept">
            <h3>Simple Hashing (Bad)</h3>
            <p>hash(key) % nodeCount = node</p>
            <p className="issue">❌ Adding/removing node rehashes ALL keys</p>
          </div>

          <div className="concept">
            <h3>Consistent Hashing (Good)</h3>
            <p>Keys and nodes on ring → find next node clockwise</p>
            <p className="benefit">✓ Only rehash affected keys (~1/N)</p>
          </div>

          <div className="concept">
            <h3>Virtual Nodes (Better)</h3>
            <p>Each physical node = multiple positions on ring</p>
            <p className="benefit">✓ Even distribution, balanced loads</p>
          </div>
        </section>

        {/* Examples */}
        <section className="card examples">
          <h2>📚 Real-World Impact</h2>

          <div className="example">
            <h3>Add Node (3→4)</h3>
            <p>With simple hashing: 75% keys rehashed</p>
            <p className="highlight">With consistent: ~25% keys moved</p>
          </div>

          <div className="example">
            <h3>Remove Node (3→2)</h3>
            <p>With simple hashing: 100% keys rehash</p>
            <p className="highlight">With consistent: ~33% keys moved</p>
          </div>

          <div className="example">
            <h3>Failover (1000 nodes)</h3>
            <p>Simple: ~99.9% keys move (catastrophic)</p>
            <p className="highlight">Consistent: ~0.1% keys move (minimal impact)</p>
          </div>
        </section>

        {/* Activity Log */}
        <section className="card log">
          <h2>📋 Activity Log</h2>
          <div className="log-list">
            {log.length === 0 ? (
              <p className="empty">No activity</p>
            ) : (
              log.map(entry => (
                <div key={entry.id} className={`log-entry ${entry.type}`}>
                  <span className="time">{entry.timestamp}</span>
                  <span className="msg">{entry.msg}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
