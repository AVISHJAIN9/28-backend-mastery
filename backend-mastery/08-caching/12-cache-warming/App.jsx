import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [cacheStatus, setCacheStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState('user:1');
  const [itemData, setItemData] = useState(null);
  const [warmupTime, setWarmupTime] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [log, setLog] = useState([]);

  // Fetch cache status
  const fetchCacheStatus = async () => {
    try {
      const response = await fetch('/api/cache/status');
      const data = await response.json();
      setCacheStatus(data);
    } catch (error) {
      addLog(`Error fetching status: ${error.message}`, 'error');
    }
  };

  // Fetch specific item
  const fetchItem = async (key) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/item/${key}`);
      if (!response.ok) throw new Error('Not found');
      const data = await response.json();
      setItemData(data);
      addLog(`Fetched ${key} (TTL: ${data.ttl}s)`, 'success');
    } catch (error) {
      setItemData(null);
      addLog(`Failed to fetch ${key}: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger startup warm-up
  const triggerWarmup = async () => {
    setLoading(true);
    addLog('Starting cache warm-up...', 'info');
    try {
      const start = Date.now();
      const response = await fetch('/api/cache/warm/startup', { method: 'POST' });
      const data = await response.json();
      const duration = Date.now() - start;
      setWarmupTime(duration);
      addLog(`✓ Warm-up completed in ${duration}ms`, 'success');
      
      // Refresh status
      setTimeout(fetchCacheStatus, 500);
    } catch (error) {
      addLog(`Warm-up failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Clear cache
  const clearCache = async () => {
    if (!confirm('Are you sure? This will clear the entire cache.')) return;
    
    try {
      const response = await fetch('/api/cache/clear', { method: 'POST' });
      const data = await response.json();
      addLog('Cache cleared', 'warning');
      setItemData(null);
      setWarmupTime(null);
      setTimeout(fetchCacheStatus, 500);
    } catch (error) {
      addLog(`Clear failed: ${error.message}`, 'error');
    }
  };

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [{
      id: Date.now(),
      message,
      type,
      timestamp
    }, ...prev.slice(0, 19)]);
  };

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchCacheStatus, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    fetchCacheStatus();
  }, []);

  return (
    <div className="app">
      <header>
        <h1>🔄 Cache Warming Strategies</h1>
        <p>Learn startup preloading, scheduled refresh, and lazy warming patterns</p>
      </header>

      <main>
        <div className="grid">
          {/* Control Panel */}
          <section className="card control-panel">
            <h2>⚙️ Control Panel</h2>
            
            <div className="button-group">
              <button onClick={triggerWarmup} disabled={loading} className="btn-primary">
                {loading ? 'Warming...' : '📦 Warm Cache (Startup)'}
              </button>
              <button onClick={clearCache} disabled={loading} className="btn-danger">
                🗑️ Clear Cache
              </button>
            </div>

            {warmupTime && (
              <div className="info-box success">
                ✓ Last warm-up: <strong>{warmupTime}ms</strong>
              </div>
            )}

            <label className="checkbox">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh status
            </label>
          </section>

          {/* Cache Status */}
          <section className="card cache-status">
            <h2>📊 Cache Status</h2>
            {cacheStatus ? (
              <div className="status-grid">
                <div className="stat">
                  <span className="label">Total Keys:</span>
                  <span className="value">{cacheStatus.totalKeys}</span>
                </div>
                <div className="stat">
                  <span className="label">Warmed Items:</span>
                  <span className="value">{cacheStatus.userKeys}</span>
                </div>
                <div className="stat">
                  <span className="label">Memory:</span>
                  <span className="value">{cacheStatus.memory || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <p className="loading">Loading...</p>
            )}
          </section>
        </div>

        {/* Item Fetcher */}
        <section className="card item-fetcher">
          <h2>🎯 Fetch Items</h2>
          <div className="form-group">
            <label>Select Item:</label>
            <select 
              value={selectedKey} 
              onChange={(e) => setSelectedKey(e.target.value)}
              disabled={loading}
            >
              <optgroup label="Users">
                <option value="user:1">User 1: Alice</option>
                <option value="user:2">User 2: Bob</option>
                <option value="user:3">User 3: Charlie</option>
                <option value="user:4">User 4: Diana</option>
                <option value="user:5">User 5: Eve</option>
              </optgroup>
              <optgroup label="Products">
                <option value="product:101">Product 101: Laptop Pro</option>
                <option value="product:102">Product 102: Wireless Mouse</option>
                <option value="product:103">Product 103: USB-C Cable</option>
                <option value="product:104">Product 104: Monitor 4K</option>
                <option value="product:105">Product 105: Keyboard Mechanical</option>
              </optgroup>
              <optgroup label="Config">
                <option value="config:app">Config: App Settings</option>
              </optgroup>
            </select>

            <button 
              onClick={() => fetchItem(selectedKey)} 
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? 'Loading...' : '🔍 Fetch from Cache'}
            </button>
          </div>

          {itemData && (
            <div className="item-display success">
              <h3>✓ Item Found</h3>
              <pre>{JSON.stringify(itemData.data, null, 2)}</pre>
              <p className="meta">TTL: {itemData.ttl} seconds | Source: {itemData.source}</p>
            </div>
          )}
        </section>

        {/* Warming Strategies */}
        <section className="card strategies">
          <h2>📚 Warming Strategies</h2>
          
          <div className="strategy">
            <h3>1. Startup Preloading</h3>
            <p>Load all critical data when app boots.</p>
            <ul>
              <li>✓ Eliminates cold cache problem</li>
              <li>✓ Prevents thundering herd</li>
              <li>✗ Long startup time for large datasets</li>
            </ul>
            <code>await warmCacheOnStartup(redis);</code>
          </div>

          <div className="strategy">
            <h3>2. Scheduled Refresh</h3>
            <p>Periodically reload data (every 5 min in demo).</p>
            <ul>
              <li>✓ No startup delay</li>
              <li>✓ Handles slow-changing data</li>
              <li>✗ May warm unused keys</li>
            </ul>
            <code>setInterval(async () =&gt; { /* refresh */ }, 300000);</code>
          </div>

          <div className="strategy">
            <h3>3. Lazy Warmer</h3>
            <p>Reheat data before expiry, serve stale data.</p>
            <ul>
              <li>✓ Proactive reload</li>
              <li>✓ No startup delay</li>
              <li>✗ Complex logic</li>
            </ul>
            <code>if (ttl &lt; 600) reloadInBackground();</code>
          </div>

          <div className="strategy">
            <h3>4. Warm-on-Deploy</h3>
            <p>Run special warming during deployment.</p>
            <ul>
              <li>✓ Controlled warm-up window</li>
              <li>✓ Pick warm-up intensity</li>
              <li>✗ Requires deployment coordination</li>
            </ul>
            <code>await warmOnDeploy(redis, 'standard');</code>
          </div>
        </section>

        {/* Real-world Example */}
        <section className="card example">
          <h2>🏪 Real-World Example: E-commerce</h2>
          
          <div className="comparison">
            <div className="scenario cold">
              <h4>❌ Without Warming (Cold Cache)</h4>
              <pre>
User 1 → Cache MISS → DB (slow) → 500ms
User 2 → Cache MISS → DB (overloaded) → 2000ms
User 3 → Cache MISS → DB (locked) → 5000ms
              </pre>
            </div>
            
            <div className="scenario warm">
              <h4>✓ With Warming (Preloaded)</h4>
              <pre>
User 1 → Cache HIT → 10ms
User 2 → Cache HIT → 10ms
User 3 → Cache HIT → 10ms
              </pre>
            </div>
          </div>

          <p>
            <strong>Impact:</strong> 50x faster response times by avoiding database overload 
            during cold start.
          </p>
        </section>

        {/* Key Metrics */}
        <section className="card metrics">
          <h2>📈 Key Metrics</h2>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Warm-up Duration</span>
              <span className="metric-value">&lt; 30s</span>
            </div>
            <div className="metric">
              <span className="metric-label">Coverage</span>
              <span className="metric-value">80%</span>
            </div>
            <div className="metric">
              <span className="metric-label">5-Min Hit Rate</span>
              <span className="metric-value">&gt; 70%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Memory Usage</span>
              <span className="metric-value">&lt; 60%</span>
            </div>
          </div>
        </section>

        {/* Activity Log */}
        <section className="card activity-log">
          <h2>📋 Activity Log</h2>
          <div className="log">
            {log.length === 0 ? (
              <p className="empty">No activity yet...</p>
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
