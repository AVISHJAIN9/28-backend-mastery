import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [userId, setUserId] = useState('3');
  const [result, setResult] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [log, setLog] = useState([]);

  const addLog = (msg, type) => {
    setLog(prev => [{ id: Date.now(), msg, type }, ...prev.slice(0, 9)]);
  };

  const getUser = async () => {
    try {
      const res = await fetch(`/api/user/${userId}`);
      const data = await res.json();
      setResult(data);
      addLog(`User ${userId} from ${data.source}`, data.user ? 'success' : 'info');
      setTimeout(() => fetchMetrics(), 100);
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  const clearCache = async () => {
    try {
      await fetch('/api/cache/clear', { method: 'POST' });
      setResult(null);
      addLog('Cache cleared', 'warning');
      setTimeout(fetchMetrics, 100);
    } catch (err) {
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="app">
      <header>
        <h1>❌ Negative Caching</h1>
        <p>Cache NULL/404 results to prevent repeated missed queries</p>
      </header>

      <main>
        <section className="card control">
          <h2>⚙️ Control Panel</h2>
          <div className="input-group">
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
            />
            <button onClick={getUser} className="btn-primary">🔍 Get User</button>
            <button onClick={clearCache} className="btn-danger">🗑️ Clear Cache</button>
          </div>
          <p className="hint">Try IDs: 1, 2, 5 (exist) | 3, 4, 10 (don't exist)</p>
        </section>

        <div className="grid">
          {/* Result */}
          {result && (
            <section className="card result">
              <h2>✓ Result</h2>
              <div className={`result-box ${result.user ? 'found' : 'notfound'}`}>
                <p><strong>Source:</strong> {result.source}</p>
                {result.cacheAge && <p><strong>Cache TTL:</strong> {result.cacheAge}s</p>}
                {result.user ? (
                  <div className="user-data">
                    <p><strong>ID:</strong> {result.user.id}</p>
                    <p><strong>Name:</strong> {result.user.name}</p>
                  </div>
                ) : (
                  <p className="notfound-msg">User not found (NULL cached)</p>
                )}
              </div>
            </section>
          )}

          {/* Metrics */}
          {metrics && (
            <section className="card metrics">
              <h2>📊 Performance</h2>
              <div className="metric-grid">
                <div className="metric">
                   <span className="label">Hit Rate</span>
                  <span className="value">{metrics.hitRate}</span>
                </div>
                <div className="metric">
                  <span className="label">Cache Hits</span>
                  <span className="value">{metrics.cacheHits}</span>
                </div>
                <div className="metric">
                  <span className="label">DB Queries</span>
                  <span className="value">{metrics.dbQueries}</span>
                </div>
                <div className="metric">
                  <span className="label">Negative Hits</span>
                  <span className="value highlight">{metrics.negativeCacheHits}</span>
                </div>
              </div>
              <p className="savings">{metrics.efficiency.description}</p>
            </section>
          )}
        </div>

        {/* Scenarios */}
        <section className="card scenarios">
          <h2>📚 Test Scenarios</h2>

          <div className="scenario">
            <h3>Scenario 1: Repeated Missing User</h3>
            <ol>
              <li>Enter ID "3" (doesn't exist) and click "Get User"</li>
              <li>See "database (negative)" source</li>
              <li>Click "Get User" again for ID "3"</li>
              <li>Now shows "negative-cache" source</li>
              <li>Notice: 0 additional DB queries!</li>
            </ol>
          </div>

          <div className="scenario">
            <h3>Scenario 2: Compare Existing vs Missing</h3>
            <ol>
              <li>Get User ID "1" (exists) → DB query, cached 1 hour</li>
              <li>Get User ID "1" again → Cache hit</li>
              <li>Get User ID "10" (missing) → DB query, negative cached 5 min</li>
              <li>Get User ID "10" again → Negative cache hit</li>
              <li>See both reduce DB load</li>
            </ol>
          </div>

          <div className="scenario">
            <h3>Scenario 3: DDoS Prevention</h3>
            <ol>
              <li>Simulate attacker requesting IDs: 100, 101, 102...</li>
              <li>Each new ID → 1 DB query</li>
              <li>But then repeat same missing ID → cache hit</li>
              <li>Hit rate climbs as pattern repeats</li>
              <li>Database load stabilizes</li>
            </ol>
          </div>
        </section>

        {/* Impact Example */}
        <section className="card impact">
          <h2>💡 Real-World Impact</h2>

          <div className="example">
            <h3>Without Negative Caching</h3>
            <pre>
User tries login 10 times with wrong email:
- Query 1: SELECT * FROM users WHERE email='wrong@email.com' (0 results)
- Query 2: SELECT * FROM users WHERE email='wrong@email.com' (0 results)
- Query 3: SELECT * FROM users WHERE email='wrong@email.com' (0 results)
[... 7 more queries ...]
Total: 10 identical queries, 0 results found
            </pre>
          </div>

          <div className="example">
            <h3>With Negative Caching</h3>
            <pre>
User tries login 10 times with wrong email:
- Query 1: SELECT * FROM users WHERE email='wrong@email.com' (0 results)
  → Cache: 'NULL_SENTINEL' for 5 minutes
- Cache 2-10: Cache hit on 'wrong@email.com'
[... all from cache ...]
Total: 1 database query, 9 cache hits
Result: 90% reduction in database load!
            </pre>
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
                  <span className="timestamp">{new Date(entry.id).toLocaleTimeString()}</span>
                  <span className="message">{entry.msg}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
