import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [stats, setStats] = useState(null);
  const [contents, setContents] = useState(null);
  const [selectedKey, setSelectedKey] = useState('user:1');
  const [fetchResult, setFetchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [{
      id: Date.now(),
      message,
      type,
      timestamp
    }, ...prev.slice(0, 19)]);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      addLog(`Error fetching stats: ${error.message}`, 'error');
    }
  };

  const fetchContents = async () => {
    try {
      const response = await fetch('/api/cache/contents');
      const data = await response.json();
      setContents(data);
    } catch (error) {
      addLog(`Error fetching contents: ${error.message}`, 'error');
    }
  };

  const fetchValue = async (key) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/value/${key}`);
      const data = await response.json();
      setFetchResult(data);
      addLog(`${key} from ${data.source} (${data.latency}ms)`, 'success');
      setTimeout(() => {
        fetchStats();
        fetchContents();
      }, 100);
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const invalidateKey = async (key) => {
    try {
      await fetch(`/api/invalidate/${key}`, { method: 'POST' });
      addLog(`Invalidated ${key}`, 'warning');
      setTimeout(() => {
        fetchStats();
        fetchContents();
      }, 100);
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear all caches?')) return;
    try {
      await fetch('/api/cache/clear', { method: 'POST' });
      setFetchResult(null);
      addLog('All caches cleared', 'warning');
      setTimeout(() => {
        fetchStats();
        fetchContents();
      }, 100);
    } catch (error) {
      addLog(`Error: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchContents();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats();
      fetchContents();
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="app">
      <header>
        <h1>🏢 Multi-tier Caching</h1>
        <p>L1 (In-Memory) → L2 (Redis) → L3 (Database)</p>
      </header>

      <main>
        {/* Control Panel */}
        <section className="card control">
          <h2>⚙️ Control Panel</h2>
          <div className="button-group">
            <select 
              value={selectedKey} 
              onChange={(e) => setSelectedKey(e.target.value)}
              disabled={loading}
            >
              <option value="user:1">User 1: Alice</option>
              <option value="user:2">User 2: Bob</option>
              <option value="user:3">User 3: Charlie</option>
              <option value="product:101">Product 101: Laptop</option>
              <option value="product:102">Product 102: Mouse</option>
              <option value="product:103">Product 103: Keyboard</option>
            </select>

            <button 
              onClick={() => fetchValue(selectedKey)} 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Loading...' : '🔍 Fetch Value'}
            </button>

            <button 
              onClick={() => invalidateKey(selectedKey)}
              className="btn-warning"
            >
              ❌ Invalidate
            </button>

            <button onClick={clearAll} className="btn-danger">
              🗑️ Clear All
            </button>
          </div>

          <label className="checkbox">
            <input 
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh stats (1s)
          </label>
        </section>

        <div className="grid">
          {/* Fetch Result */}
          {fetchResult && (
            <section className="card result">
              <h2>✓ Fetched Value</h2>
              <div className={`result-card source-${fetchResult.source.toLowerCase()}`}>
                <p className="source">Source: <strong>{fetchResult.source}</strong></p>
                <p className="latency">Latency: <strong>{fetchResult.latency}ms</strong></p>
                <pre>{JSON.stringify(fetchResult.value, null, 2)}</pre>
              </div>
            </section>
          )}

          {/* Cache Hierarchy */}
          <section className="card hierarchy">
            <h2>📊 Cache Hierarchy</h2>
            <div className="hierarchy-visual">
              <div className="tier tier-l1">
                <h3>L1: In-Memory</h3>
                <p className="metric">0.5ms</p>
                <p className="description">Process-local, fastest</p>
              </div>
              <div className="arrow">↓ MISS</div>
              <div className="tier tier-l2">
                <h3>L2: Redis</h3>
                <p className="metric">15ms</p>
                <p className="description">Distributed, large</p>
              </div>
              <div className="arrow">↓ MISS</div>
              <div className="tier tier-l3">
                <h3>L3: Database</h3>
                <p className="metric">100ms</p>
                <p className="description">Source of truth</p>
              </div>
            </div>
          </section>
        </div>

        {/* Statistics */}
        {stats && (
          <>
            <section className="card stats">
              <h2>📈 Hit Ratio Statistics</h2>
              <div className="stats-grid">
                <div className="stat-block">
                  <h3>L1: In-Memory Cache</h3>
                  <div className="stat-item">
                    <span className="label">Hits:</span>
                    <span className="value">{stats.L1.hits}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Misses:</span>
                    <span className="value">{stats.L1.misses}</span>
                  </div>
                  <div className="stat-item highlight">
                    <span className="label">Hit Ratio:</span>
                    <span className="value">{stats.L1.hitRatio}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Avg Latency:</span>
                    <span className="value">{stats.L1.avgLatency}</span>
                  </div>
                </div>

                <div className="stat-block">
                  <h3>L2: Redis Cache</h3>
                  <div className="stat-item">
                    <span className="label">Hits:</span>
                    <span className="value">{stats.L2.hits}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Misses:</span>
                    <span className="value">{stats.L2.misses}</span>
                  </div>
                  <div className="stat-item highlight">
                    <span className="label">Hit Ratio:</span>
                    <span className="value">{stats.L2.hitRatio}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Avg Latency:</span>
                    <span className="value">{stats.L2.avgLatency}</span>
                  </div>
                </div>

                <div className="stat-block">
                  <h3>L3: Database</h3>
                  <div className="stat-item">
                    <span className="label">Hits:</span>
                    <span className="value">{stats.L3.hits}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Avg Latency:</span>
                    <span className="value">{stats.L3.avgLatency}</span>
                  </div>
                </div>

                <div className="stat-block overall">
                  <h3>Overall Impact</h3>
                  <div className="stat-item highlight large">
                    <span className="label">Hit Ratio:</span>
                    <span className="value">{stats.overallHitRatio}</span>
                  </div>
                  <p className="explanation">% of requests served from L1+L2</p>
                </div>
              </div>
            </section>

            {/* Cache Contents */}
            {contents && (
              <section className="card contents">
                <h2>📦 Cache Contents</h2>
                <div className="contents-grid">
                  <div className="content-block">
                    <h3>L1 Cache ({contents.L1.itemCount} items, {contents.L1.totalSize} bytes)</h3>
                    {contents.L1.itemCount === 0 ? (
                      <p className="empty">Empty</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Key</th>
                            <th>Size (bytes)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contents.L1.items.map(item => (
                            <tr key={item.key}>
                              <td>{item.key}</td>
                              <td>{item.size}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="content-block">
                    <h3>L2 Cache ({contents.L2.itemCount} items, {contents.L2.totalSize} bytes)</h3>
                    {contents.L2.itemCount === 0 ? (
                      <p className="empty">Empty</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Key</th>
                            <th>Size (bytes)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contents.L2.items.map(item => (
                            <tr key={item.key}>
                              <td>{item.key}</td>
                              <td>{item.size}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* Test Scenarios */}
        <section className="card scenarios">
          <h2>🧪 Test Scenarios</h2>
          
          <div className="scenario">
            <h3>1. Cold Start (All Misses)</h3>
            <ol>
              <li>Click "Clear All" to empty all caches</li>
              <li>Fetch any value → Goes to L3 (Database, ~100ms)</li>
              <li>Value now in L1 and L2</li>
              <li>Fetch same value → L1 hit (~0.5ms)</li>
            </ol>
          </div>

          <div className="scenario">
            <h3>2. L2 Fallback</h3>
            <ol>
              <li>Fetch a value (populates L1 & L2)</li>
              <li>Click "Invalidate" to clear L1</li>
              <li>Fetch same value → L2 hit (~15ms), populates L1</li>
              <li>Fetch again → L1 hit (~0.5ms)</li>
            </ol>
          </div>

          <div className="scenario">
            <h3>3. Full Cache Miss</h3>
            <ol>
              <li>Click "Clear All"</li>
              <li>Fetch a value → L3 hit (DB), now in L1 & L2</li>
              <li>Hit ratio shows DB access</li>
              <li>Watch how repeated fetches improve latency</li>
            </ol>
          </div>
        </section>

        {/* Real-World Impact */}
        <section className="card impact">
          <h2>💡 Real-World Impact</h2>
          <div className="impact-table">
            <div className="row header">
              <div className="cell metric">Use Case</div>
              <div className="cell result">Single L2</div>
              <div className="cell result">Multi-tier</div>
              <div className="cell result">Improvement</div>
            </div>
            <div className="row">
              <div className="cell metric">E-commerce (1000 req/s)</div>
              <div className="cell result">10ms avg</div>
              <div className="cell result">2ms avg</div>
              <div className="cell result">5x faster</div>
            </div>
            <div className="row">
              <div className="cell metric">Social Media (10k req/s)</div>
              <div className="cell result">50ms P99</div>
              <div className="cell result">15ms P99</div>
              <div className="cell result">3.3x better</div>
            </div>
            <div className="row">
              <div className="cell metric">Content (100k req/s)</div>
              <div className="cell result">200ms P99</div>
              <div className="cell result">20ms P99</div>
              <div className="cell result">10x better</div>
            </div>
          </div>
        </section>

        {/* Activity Log */}
        <section className="card log">
          <h2>📋 Activity Log</h2>
          <div className="log-list">
            {log.length === 0 ? (
              <p className="empty">No activity yet</p>
            ) : (
              log.map(entry => (
                <div key={entry.id} className={`log-entry ${entry.type}`}>
                  <span className="time">{entry.timestamp}</span>
                  <span className="message">{entry.message}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
