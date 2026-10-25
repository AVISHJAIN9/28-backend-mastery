import React, { useState, useEffect } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('basic');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('1');
  const [formData, setFormData] = useState({ name: '', email: '', role: '', salary: '' });
  const [cacheKey, setCacheKey] = useState('user:1');
  const [pattern, setPattern] = useState('user:*');
  const [strategies, setStrategies] = useState({
    manual: 0,
    ttlOnly: 0,
    cascade: 0
  });
  const [metrics, setMetrics] = useState(null);

  const apiBase = 'http://localhost:6403';

  // Fetch with loading state
  const fetchAPI = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${apiBase}${endpoint}`, options);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Fetch metrics
  const refreshMetrics = () => {
    fetchAPI('/api/metrics');
  };

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (response?.invalidations) {
      setMetrics(response.invalidations);
    }
  }, [response]);

  return (
    <div className="container">
      <header>
        <h1>Cache Invalidation</h1>
        <p>Strategies for keeping cached data fresh and consistent</p>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}>
          Manual Invalidation
        </button>
        <button className={`tab ${activeTab === 'cascade' ? 'active' : ''}`}
          onClick={() => setActiveTab('cascade')}>
          Cascade Invalidation
        </button>
        <button className={`tab ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}>
          Strategy Comparison
        </button>
        <button className={`tab ${activeTab === 'pattern' ? 'active' : ''}`}
          onClick={() => setActiveTab('pattern')}>
          Pattern Invalidation
        </button>
        <button className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}>
          Metrics
        </button>
      </div>

      <div className="content">
        {/* ===== TAB 1: Manual Invalidation ===== */}
        {activeTab === 'basic' && (
          <section>
            <h2>Manual Cache Invalidation</h2>
            <div className="description">
              When you update data in database, explicitly delete the cached version. This ensures the next read fetches fresh data.
            </div>

            <div className="panel">
              <h3>How It Works (4 Steps)</h3>
              <ol>
                <li><strong>Update Database:</strong> Change data in source</li>
                <li><strong>Delete Cache:</strong> Remove old cached value</li>
                <li><strong>Warm Cache (optional):</strong> Populate with fresh data</li>
                <li><strong>Next Read:</strong> Gets fresh data (hit or miss)</li>
              </ol>
              <div className="note">
                <strong>💡 Key Insight:</strong> Consistency window is ~1 millisecond (only network latency).
              </div>
            </div>

            <div className="panel">
              <h3>Test Manual Invalidation</h3>
              <div className="two-col">
                <div>
                  <h4>Step 1: Load User from Cache</h4>
                  <input
                    type="number"
                    placeholder="User ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                  <button className="primary"
                    onClick={() => fetchAPI(`/api/user/${userId}`)}
                    disabled={loading}>
                    {loading ? 'Loading...' : 'GET User (Cache-Aside)'}
                  </button>
                  <div className="hint">First call: cache miss → DB hit. Second call: cache hit.</div>
                </div>

                <div>
                  <h4>Step 2: Update User (Invalidates Cache)</h4>
                  <input
                    placeholder="New name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <input
                    placeholder="New email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <button className="primary"
                    onClick={() => fetchAPI(`/api/user/${userId}`, 'POST', formData)}
                    disabled={loading}>
                    {loading ? 'Updating...' : 'POST Update (+ Invalidate)'}
                  </button>
                  <div className="hint">Update + delete cache in same operation.</div>
                </div>
              </div>

              <div className="panel">
                <h3>What Happened</h3>
                <ol>
                  <li><code>GET /api/user/1</code> → Cache miss → Fetch DB → Store in cache</li>
                  <li><code>POST /api/user/1</code> → Update DB → <strong>DELETE cache</strong></li>
                  <li>Next <code>GET /api/user/1</code> → Cache miss → Fetch fresh DB data</li>
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* ===== TAB 2: Cascade Invalidation ===== */}
        {activeTab === 'cascade' && (
          <section>
            <h2>Cascade Invalidation</h2>
            <div className="description">
              When a user is updated, invalidate not just that user's cache, but all related caches (profile, permissions, preferences, etc.).
            </div>

            <div className="panel">
              <h3>The Problem: Related Data</h3>
              <p>
                One user change affects multiple caches:
              </p>
              <ul>
                <li><code>user:1</code> - User data</li>
                <li><code>user:1:profile</code> - Profile cache</li>
                <li><code>user:1:permissions</code> - Permissions (depends on role)</li>
                <li><code>user:1:settings</code> - User settings</li>
                <li><code>user:1:preferences</code> - Preferences</li>
              </ul>
              <p>Update one field = invalidate all of them</p>
            </div>

            <div className="panel">
              <h3>Test Cascade Invalidation</h3>
              <input
                type="number"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <button className="primary"
                onClick={() => fetchAPI(`/api/user/${userId}/cascade-invalidate`, 'POST', {})}
                disabled={loading}>
                {loading ? 'Invalidating...' : '🗑️ Cascade Invalidate All Related Keys'}
              </button>
              <div className="note" style={{ marginTop: '20px' }}>
                <strong>Effect:</strong> Deletes all 5 related cache keys:
                <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                  <li>user:{userId}</li>
                  <li>user:{userId}:profile</li>
                  <li>user:{userId}:permissions</li>
                  <li>user:{userId}:settings</li>
                  <li>user:{userId}:preferences</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ===== TAB 3: Strategy Comparison ===== */}
        {activeTab === 'comparison' && (
          <section>
            <h2>Invalidation Strategy Comparison</h2>

            <div className="panel">
              <h3>Strategy 1: Manual Invalidation (Event-Based)</h3>
              <p><strong>When:</strong> Delete cache immediately after database change</p>
              <p><strong>Stale Data Window:</strong> ~1 millisecond (network latency only)</p>
              <p><strong>Complexity:</strong> Medium (need to call delete in every update path)</p>
              <button onClick={() => {
                setStrategies({ ...strategies, manual: strategies.manual + 1 });
                fetchAPI(`/api/user/${userId}`, 'POST', { name: 'Updated ' + Date.now(), email: 'test@test.com' });
              }} className="secondary">
                Simulate Manual Invalidation
              </button>
              <div className="note" style={{ marginTop: '15px' }}>
                <strong>✅ Pros:</strong> High consistency, minimal stale data<br/>
                <strong>❌ Cons:</strong> Easy to forget invalidation in some code path
              </div>
            </div>

            <div className="panel">
              <h3>Strategy 2: TTL-Only (Passive)</h3>
              <p><strong>When:</strong> Cache expires automatically, no code invalidation</p>
              <p><strong>Stale Data Window:</strong> 0 to TTL duration (e.g., 1 hour)</p>
              <p><strong>Complexity:</strong> Low (just set TTL, forget about it)</p>
              <button onClick={() => {
                setStrategies({ ...strategies, ttlOnly: strategies.ttlOnly + 1 });
                fetchAPI(`/api/user/${userId}/ttl-only`, 'POST', { name: 'Updated ' + Date.now(), email: 'test@test.com' });
              }} className="secondary">
                Simulate TTL-Only (No Invalidation)
              </button>
              <div className="note" style={{ marginTop: '15px' }}>
                <strong>✅ Pros:</strong> Simple, guaranteed freshness after TTL<br/>
                <strong>❌ Cons:</strong> Stale data up to 1 hour, not suitable for critical data
              </div>
            </div>

            <div className="panel">
              <h3>Strategy 3: Cascade Invalidation</h3>
              <p><strong>When:</strong> One update affects multiple cached objects</p>
              <p><strong>Stale Data Window:</strong> ~1 millisecond</p>
              <p><strong>Complexity:</strong> High (need to map all dependencies)</p>
              <button onClick={() => {
                setStrategies({ ...strategies, cascade: strategies.cascade + 1 });
                fetchAPI(`/api/user/${userId}/cascade-invalidate`, 'POST', {});
              }} className="secondary">
                Simulate Cascade Invalidation
              </button>
              <div className="note" style={{ marginTop: '15px' }}>
                <strong>✅ Pros:</strong> Ensures all related data stays fresh<br/>
                <strong>❌ Cons:</strong> Complex to maintain, risk of incomplete cascades
              </div>
            </div>

            <div className="comparison-results">
              <div className="result miss">
                <h4>Manual</h4>
                <div className="metric">
                  <span>Uses:</span>
                  <strong>{strategies.manual}</strong>
                </div>
                <div className="metric">
                  <span>Consistency:</span>
                  <strong>High ✅</strong>
                </div>
              </div>
              <div className="arrow">→</div>
              <div className="result miss">
                <h4>TTL-Only</h4>
                <div className="metric">
                  <span>Uses:</span>
                  <strong>{strategies.ttlOnly}</strong>
                </div>
                <div className="metric">
                  <span>Consistency:</span>
                  <strong>Low ⚠️</strong>
                </div>
              </div>
              <div className="arrow">→</div>
              <div className="result hit">
                <h4>Cascade</h4>
                <div className="metric">
                  <span>Uses:</span>
                  <strong>{strategies.cascade}</strong>
                </div>
                <div className="metric">
                  <span>Consistency:</span>
                  <strong>Very High ✅</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== TAB 4: Pattern Invalidation ===== */}
        {activeTab === 'pattern' && (
          <section>
            <h2>Pattern-Based Invalidation</h2>
            <div className="description">
              Use Redis SCAN + MATCH to invalidate all keys matching a pattern. Useful for bulk operations.
            </div>

            <div className="panel">
              <h3>Test Pattern Invalidation</h3>
              <input
                placeholder="Key pattern (e.g., 'user:*')"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              />
              <button className="primary"
                onClick={() => fetchAPI(`/api/cache/pattern/${pattern}`, 'DELETE')}
                disabled={loading}>
                {loading ? 'Invalidating...' : `🗑️ Delete All Keys Matching: ${pattern}`}
              </button>

              <div className="note" style={{ marginTop: '20px' }}>
                <strong>Common Patterns:</strong>
                <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                  <li><code>user:*</code> - All user caches</li>
                  <li><code>profile:*:1</code> - All profile views of user 1</li>
                  <li><code>session:*</code> - All sessions</li>
                  <li><code>*:invalidated</code> - All invalidation markers</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ===== TAB 5: Metrics ===== */}
        {activeTab === 'metrics' && (
          <section>
            <h2>Invalidation Metrics</h2>
            {metrics && (
              <div className="metrics-display">
                <div className="metric-card">
                  <h4>Total Invalidations</h4>
                  <div className="value">{metrics.total}</div>
                  <div className="label">Cache delete operations</div>
                </div>
                <div className="metric-card">
                  <h4>Last Invalidated</h4>
                  <div className="value">{metrics.lastAt ? new Date(metrics.lastAt).toLocaleTimeString() : 'Never'}</div>
                  <div className="label">Most recent invalidation</div>
                </div>
              </div>
            )}

            <div className="panel">
              <h3>Recent Invalidation History</h3>
              {metrics?.recentHistory && metrics.recentHistory.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Cache Key</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentHistory.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>
                          <code style={{ background: '#f5f5f5', padding: '3px 6px', borderRadius: '3px' }}>
                            {item.key}
                          </code>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ background: item.type === 'manual' ? '#fff3cd' : '#e3f2fd', padding: '3px 8px', borderRadius: '3px', fontSize: '0.85em' }}>
                            {item.type}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#666', fontSize: '0.9em' }}>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No invalidations yet</p>
              )}

              <button className="secondary" style={{ marginTop: '20px' }}
                onClick={() => fetchAPI('/api/metrics/reset', 'POST', {})}>
                Reset All Metrics
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Response Display */}
      {response && (
        <div className="response">
          <h3>API Response:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      <footer>
        <p className="info">
          Backend running on port 6403 | Redis cache with 1-hour TTL | All invalidations logged and tracked
        </p>
      </footer>
    </div>
  );
}
