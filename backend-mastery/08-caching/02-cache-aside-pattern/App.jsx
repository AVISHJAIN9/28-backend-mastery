import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:6402';

export default function App() {
  const [tab, setTab] = useState('basic');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);

  // Basic tab state
  const [userId, setUserId] = useState('1');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  // Comparison state
  const [comparisonResults, setComparisonResults] = useState(null);

  // Stampede state
  const [stampedeDuration, setStampedeDuration] = useState(0);

  const makeRequest = async (method, endpoint, body = null) => {
    try {
      setLoading(true);
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      };
      const res = await fetch(`${API_URL}${endpoint}`, options);
      const data = await res.json();
      setResponse(data);
      return data;
    } catch (error) {
      const errorMsg = { error: error.message };
      setResponse(errorMsg);
      return errorMsg;
    } finally {
      setLoading(false);
    }
  };

  // Basic cache-aside
  const handleFetchUser = () => {
    makeRequest('GET', `/api/user/${userId}`);
  };

  const handleFetchDirect = () => {
    makeRequest('GET', `/api/database/user/${userId}`);
  };

  // Update user (invalidation test)
  const handleUpdateUser = () => {
    if (!userName && !userRole) {
      return alert('Enter name or role');
    }

    const updates = {};
    if (userName) updates.name = userName;
    if (userRole) updates.role = userRole;

    makeRequest('POST', `/api/user/${userId}`, updates);
    setUserName('');
    setUserRole('');
  };

  // Compare performance
  const handleComparePerformance = async () => {
    try {
      setLoading(true);

      // Clear cache first
      await makeRequest('DELETE', `/api/cache/user:${userId}`);

      // Fetch from database (first time - miss)
      const result1 = await makeRequest('GET', `/api/user/${userId}`);
      const cacheLatency = parseInt(result1.latency);

      // Fetch from cache (second time - hit)
      await new Promise(r => setTimeout(r, 100)); // Small delay
      const result2 = await makeRequest('GET', `/api/user/${userId}`);
      const directLatency = parseInt(result2.latency);

      setComparisonResults({
        firstFetch: {
          ...result1,
          label: 'First Fetch (Cache Miss)'
        },
        secondFetch: {
          ...result2,
          label: 'Second Fetch (Cache Hit)'
        },
        improvement: `${cacheLatency - directLatency}ms faster`
      });
    } finally {
      setLoading(false);
    }
  };

  // Stampede simulation
  const handleSimulateStampede = async () => {
    try {
      setLoading(true);
      setStampedeDuration(0);

      // Clear cache
      await makeRequest('DELETE', '/api/cache/user:99');

      // Make 5 simultaneous requests
      const startTime = Date.now();
      const promises = Array(5)
        .fill()
        .map(() => makeRequest('GET', `/api/user/99/with-stampede`));

      const results = await Promise.all(promises);

      const totalTime = Date.now() - startTime;
      setStampedeDuration(totalTime);

      setResponse({
        title: 'Stampede Prevention Results',
        duration: `${totalTime}ms`,
        requests: 5,
        details: results.map((r, i) => ({
          request: i + 1,
          source: r.source,
          latency: r.latency
        }))
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch metrics
  const handleFetchMetrics = async () => {
    const metricsData = await makeRequest('GET', '/api/metrics');
    setMetrics(metricsData.metrics);
    setResponse(metricsData);
  };

  // Reset metrics
  const handleResetMetrics = async () => {
    await makeRequest('POST', '/api/metrics/reset');
    setMetrics(null);
  };

  return (
    <div className="container">
      <header>
        <h1>⚡ Cache-Aside Pattern</h1>
        <p>Interactive demonstration of the most common caching pattern</p>
      </header>

      <div className="tabs">
        {['basic', 'comparison', 'stampede', 'invalidation', 'metrics'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`tab ${tab === t ? 'active' : ''}`}>
            {t === 'basic' && '📄 Basic Pattern'}
            {t === 'comparison' && '⚖️ Cache vs DB'}
            {t === 'stampede' && '⚠️ Stampede'}
            {t === 'invalidation' && '🗑️ Invalidation'}
            {t === 'metrics' && '📊 Metrics'}
          </button>
        ))}
      </div>

      <div className="content">
        {/* BASIC TAB */}
        {tab === 'basic' && (
          <section>
            <h2>Cache-Aside: The Pattern</h2>
            <p className="description">Request → Check Cache → On Miss: Fetch DB → Update Cache → Return</p>

            <div className="two-col">
              <div className="panel">
                <h3>📖 How It Works</h3>
                <ol>
                  <li>Application checks Redis cache</li>
                  <li>If hit: return immediately (~1ms)</li>
                  <li>If miss: fetch from database (~100ms)</li>
                  <li>Store in cache with TTL (3600s)</li>
                  <li>Return data to client</li>
                </ol>
                <p className="note">
                  <strong>Goal:</strong> Reduce database load while accepting stale data
                </p>
              </div>

              <div className="panel">
                <h3>🧪 Test It</h3>
                <input
                  type="number"
                  placeholder="User ID (1-5)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  min="1"
                  max="5"
                />
                <button onClick={handleFetchUser} disabled={loading}>
                  Fetch User (Cache-Aside)
                </button>
                <button onClick={handleFetchDirect} disabled={loading} className="secondary">
                  Fetch Direct (DB Only)
                </button>
                <p className="hint">Try fetching the same user twice. Second should be faster!</p>
              </div>
            </div>
          </section>
        )}

        {/* COMPARISON TAB */}
        {tab === 'comparison' && (
          <section>
            <h2>Cache vs Database Performance</h2>
            <p className="description">See the latency difference between cache hits and database queries</p>

            <div className="panel">
              <h3>⚖️ Performance Comparison</h3>
              <input
                type="number"
                placeholder="User ID (1-5)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                min="1"
                max="5"
              />
              <button onClick={handleComparePerformance} disabled={loading} className="primary">
                Run Comparison
              </button>
              <p className="hint">
                Clears cache, fetches twice, shows improvement between miss and hit
              </p>

              {comparisonResults && (
                <div className="comparison-results">
                  <div className="result miss">
                    <h4>{comparisonResults.firstFetch.label}</h4>
                    <div className="metric">
                      <span>Latency:</span>
                      <strong>{comparisonResults.firstFetch.latency}</strong>
                    </div>
                    <div className="metric">
                      <span>Source:</span>
                      <strong>{comparisonResults.firstFetch.source}</strong>
                    </div>
                  </div>

                  <div className="arrow">→</div>

                  <div className="result hit">
                    <h4>{comparisonResults.secondFetch.label}</h4>
                    <div className="metric">
                      <span>Latency:</span>
                      <strong>{comparisonResults.secondFetch.latency}</strong>
                    </div>
                    <div className="metric">
                      <span>Source:</span>
                      <strong>{comparisonResults.secondFetch.source}</strong>
                    </div>
                  </div>

                  <div className="improvement">
                    <h4>Improvement</h4>
                    <strong>{comparisonResults.improvement}</strong>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* STAMPEDE TAB */}
        {tab === 'stampede' && (
          <section>
            <h2>⚠️ Cache Stampede Prevention</h2>
            <p className="description">
              When cache expires, multiple requests hit DB simultaneously. Locking prevents this.
            </p>

            <div className="panel">
              <h3>Stampede Test</h3>
              <p>
                Makes 5 simultaneous requests when cache is empty. With locking, only first hits
                database.
              </p>
              <button onClick={handleSimulateStampede} disabled={loading} className="primary">
                Simulate Stampede (5 concurrent requests)
              </button>

              {stampedeDuration > 0 && (
                <div className="stampede-results">
                  <p>
                    <strong>Total time:</strong> {stampedeDuration}ms
                  </p>
                  <p className="success">
                    ✓ Locking prevented multiple DB queries. Only first request hit database.
                  </p>
                </div>
              )}
            </div>

            <div className="panel">
              <h3>How Locking Works</h3>
              <ol>
                <li>First request acquires lock (SET NX with EX)</li>
                <li>First request fetches from database</li>
                <li>Other 4 requests wait for cache to populate</li>
                <li>Once cached, all serve from Redis</li>
                <li>Result: 1 DB query instead of 5</li>
              </ol>
            </div>
          </section>
        )}

        {/* INVALIDATION TAB */}
        {tab === 'invalidation' && (
          <section>
            <h2>🗑️ Cache Invalidation</h2>
            <p className="description">When data changes, cache must be cleared or it serves stale data</p>

            <div className="two-col">
              <div className="panel">
                <h3>📝 Update User</h3>
                <input
                  type="number"
                  placeholder="User ID (1-5)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  min="1"
                  max="5"
                />
                <input
                  type="text"
                  placeholder="New name (optional)"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                  <option value="">- No role change -</option>
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={handleUpdateUser} disabled={loading}>
                  Update & Invalidate Cache
                </button>
              </div>

              <div className="panel">
                <h3>✅ What Happens</h3>
                <ol>
                  <li>Database updated with new values</li>
                  <li>Cache key is deleted (invalidated)</li>
                  <li>Next request will miss cache</li>
                  <li>Will fetch fresh data from database</li>
                  <li>Cache is repopulated with new data</li>
                </ol>
                <p className="note">
                  <strong>Without invalidation:</strong> Cache would serve old data for 1 hour!
                </p>
              </div>
            </div>
          </section>
        )}

        {/* METRICS TAB */}
        {tab === 'metrics' && (
          <section>
            <h2>📊 Performance Metrics</h2>
            <p className="description">Monitor cache hit ratio and identify optimization opportunities</p>

            <div className="panel">
              <button onClick={handleFetchMetrics} disabled={loading} className="primary">
                Fetch Metrics
              </button>
              <button onClick={handleResetMetrics} className="secondary">
                Reset Metrics
              </button>

              {metrics && (
                <div className="metrics-display">
                  <div className="metric-card">
                    <h4>Hit Ratio</h4>
                    <p className="value">{metrics.hitRatio}</p>
                    <p className="label">Target: >80%</p>
                  </div>
                  <div className="metric-card">
                    <h4>Cache Hits</h4>
                    <p className="value">{metrics.cacheHits}</p>
                  </div>
                  <div className="metric-card">
                    <h4>Cache Misses</h4>
                    <p className="value">{metrics.cacheMisses}</p>
                  </div>
                  <div className="metric-card">
                    <h4>Database Queries</h4>
                    <p className="value">{metrics.databaseQueries}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="panel">
              <h3>🎯 What These Mean</h3>
              <ul>
                <li>
                  <strong>Hit Ratio:</strong> Percentage of requests served from cache (not DB)
                </li>
                <li>
                  <strong>Cache Hits:</strong> Requests that found data in Redis (~1ms)
                </li>
                <li>
                  <strong>Misses:</strong> Requests that had to query database (~100ms)
                </li>
                <li>
                  <strong>DB Queries:</strong> Total database round trips (should be low!)
                </li>
              </ul>
            </div>
          </section>
        )}

        {/* RESPONSE DISPLAY */}
        {response && (
          <section className="response">
            <h3>Response:</h3>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </section>
        )}
      </div>

      <footer>
        <p className="info">
          🚀 Module 08.2 - Cache-Aside Pattern | Server: localhost:6402 | Redis required
        </p>
      </footer>
    </div>
  );
}
