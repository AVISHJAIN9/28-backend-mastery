import React, { useState, useEffect } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('basic');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('1');
  const [keys, setKeys] = useState('user:1,user:1:profile,user:1:permissions');
  const [metrics, setMetrics] = useState(null);
  const [cacheState, setCacheState] = useState(null);
  const [instanceInfo, setInstanceInfo] = useState(null);

  const apiBase = 'http://localhost:6404';

  const fetchAPI = async (endpoint, method = 'GET', body = null, showResponse = true) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${apiBase}${endpoint}`, options);
      const data = await res.json();
      
      if (showResponse) setResponse(data);
      return data;
    } catch (error) {
      const errResponse = { error: error.message };
      if (showResponse) setResponse(errResponse);
      return errResponse;
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh metrics and cache state
  useEffect(() => {
    const interval = setInterval(async () => {
      const metricsData = await fetchAPI('/api/metrics', 'GET', null, false);
      if (metricsData.metrics) setMetrics(metricsData);
      
      const cacheData = await fetchAPI('/api/cache/state', 'GET', null, false);
      if (cacheData.keys) setCacheState(cacheData);
      
      setInstanceInfo(metricsData.instance);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <header>
        <h1>Redis Pub/Sub Pattern</h1>
        <p>Distribute cache invalidation across multiple instances in real-time</p>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}>
          Direct Invalidation
        </button>
        <button className={`tab ${activeTab === 'cascade' ? 'active' : ''}`}
          onClick={() => setActiveTab('cascade')}>
          Cascade Events
        </button>
        <button className={`tab ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => setActiveTab('batch')}>
          Batch Invalidation
        </button>
        <button className={`tab ${activeTab === 'multiinstance' ? 'active' : ''}`}
          onClick={() => setActiveTab('multiinstance')}>
          Multi-Instance
        </button>
        <button className={`tab ${activeTab === 'monitor' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitor')}>
          Monitor & Metrics
        </button>
      </div>

      <div className="content">
        {/* ===== TAB 1: Direct Invalidation ===== */}
        {activeTab === 'basic' && (
          <section>
            <h2>Direct Cache Invalidation (Single Channel)</h2>
            <div className="description">
              When a user is updated, publish an event to 'cache:invalidation' channel. All listening instances receive the event and invalidate their local caches in real-time.
            </div>

            <div className="panel">
              <h3>How It Works</h3>
              <ol>
                <li><strong>Update Database:</strong> Change user data</li>
                <li><strong>Publish Event:</strong> call redis.publish with update event</li>
                <li><strong>All Instances Receive:</strong> Subscribers listening to channel get message</li>
                <li><strong>Local Cache Invalidated:</strong> <code>localCache.delete('user:1')</code></li>
                <li><strong>Result:</strong> ~5-10ms for all instances to invalidate</li>
              </ol>
              <div className="note">
                <strong>💡 Key Insight:</strong> One publish event reaches ALL subscribers instantly.
              </div>
            </div>

            <div className="panel">
              <h3>Test Direct Invalidation</h3>
              <div className="two-col">
                <div>
                  <h4>Step 1: Load User</h4>
                  <input
                    type="number"
                    placeholder="User ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                  <button className="primary"
                    onClick={() => fetchAPI(`/api/user/${userId}`)}>
                    {loading ? 'Loading...' : '📥 GET User'}
                  </button>
                  <div className="hint">Loads user into local cache on this instance.</div>
                </div>

                <div>
                  <h4>Step 2: Update & Publish</h4>
                  <button className="primary"
                    onClick={() => fetchAPI(`/api/user/${userId}`, 'POST', {
                      name: 'Updated ' + new Date().toLocaleTimeString(),
                      email: `user${userId}@example.com`,
                      role: 'admin'
                    })}>
                    {loading ? 'Publishing...' : '🚀 POST Update + Publish'}
                  </button>
                  <div className="hint">Updates DB, publishes event to all instances.</div>
                </div>
              </div>

              <div className="result hit" style={{ marginTop: '20px' }}>
                <h4>What Happened</h4>
                <ul style={{ marginLeft: '20px' }}>
                  <li>Database updated</li>
                  <li>Local cache on THIS instance cleared</li>
                  <li>redis.publish called to broadcast event</li>
                  <li><strong>All other instances received event immediately</strong></li>
                  <li><strong>All other instances cleared their caches too</strong></li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ===== TAB 2: Cascade Events ===== */}
        {activeTab === 'cascade' && (
          <section>
            <h2>Cascade Invalidation (Related Keys)</h2>
            <div className="description">
              When a user changes, publish a single event that invalidates multiple related cache keys across all instances: user, profile, permissions, roles, settings.
            </div>

            <div className="panel">
              <h3>Cascade Keys for User</h3>
              <ul>
                <li><code>user:{userId}</code> - User data</li>
                <li><code>user:{userId}:profile</code> - Profile</li>
                <li><code>user:{userId}:permissions</code> - Permissions</li>
                <li><code>user:{userId}:roles</code> - Roles</li>
                <li><code>user:{userId}:settings</code> - Settings</li>
              </ul>
              <p style={{ marginTop: '15px', color: '#666' }}>
                <strong>One event, 5 invalidations across all instances!</strong>
              </p>
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
                onClick={() => fetchAPI(`/api/user/${userId}/cascade`, 'POST', {})}>
                {loading ? 'Publishing...' : '🌊 Publish Cascade Event'}
              </button>

              <div className="note" style={{ marginTop: '20px' }}>
                <strong>Effect:</strong> Publishes CASCADE event to <code>cache:cascade</code> channel.
                <br/>All instances receive and invalidate all 5 related keys at once.
              </div>
            </div>
          </section>
        )}

        {/* ===== TAB 3: Batch Invalidation ===== */}
        {activeTab === 'batch' && (
          <section>
            <h2>Batch Invalidation (Multiple Keys)</h2>
            <div className="description">
              Invalidate multiple unrelated cache keys in a single event. More efficient than multiple individual Pub/Sub events.
            </div>

            <div className="panel">
              <h3>Test Batch Invalidation</h3>
              <label>Keys to invalidate (comma-separated):</label>
              <textarea
                value={keys}
                onChange={(e) => setKeys(e.target.value)}
                style={{ width: '100%', height: '80px', padding: '10px', marginBottom: '15px', fontFamily: 'monospace' }}
              />
              <button className="primary"
                onClick={() => {
                  const keyArray = keys.split(',').map(k => k.trim());
                  fetchAPI('/api/cache/batch-invalidate', 'POST', { keys: keyArray });
                }}>
                {loading ? 'Publishing...' : '📦 Publish Batch Event'}
              </button>

              <div className="note" style={{ marginTop: '20px' }}>
                <strong>Optimization:</strong> One event with 5 keys is more efficient than 5 separate Pub/Sub calls.
                <br/>Reduces Redis I/O and network overhead.
              </div>
            </div>
          </section>
        )}

        {/* ===== TAB 4: Multi-Instance ===== */}
        {activeTab === 'multiinstance' && (
          <section>
            <h2>Multi-Instance Testing</h2>
            <div className="description">
              Open multiple terminals to run multiple instances of this server, then publish events from one instance and see them received by all others.
            </div>

            <div className="panel">
              <h3>Setup Multiple Instances</h3>
              <ol>
                <li>Terminal 1: <code>npm run dev</code> (port 6404)</li>
                <li>Terminal 2: <code>HTTP_PORT=6405 npm run dev</code> (port 6405)</li>
                <li>Terminal 3: <code>HTTP_PORT=6406 npm run dev</code> (port 6406)</li>
              </ol>
              <p style={{ marginTop: '15px', color: '#666' }}>
                Open this page on each port (6404, 6405, 6406) in different browser tabs/windows.
              </p>
            </div>

            <div className="panel">
              <h3>Test with Multiple Instances</h3>
              <p>
                <strong>On Instance 1 (port 6404):</strong>
              </p>
              <input
                type="number"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <button className="primary"
                onClick={() => fetchAPI(`/api/user/${userId}/multi-publish`, 'POST', {})}>
                {loading ? 'Publishing...' : '📡 Multi-Publish to All Channels'}
              </button>

              <div className="note" style={{ marginTop: '20px' }}>
                <strong>Watch this happen:</strong>
                <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                  <li>Click button on Instance 1</li>
                  <li>Event published to: cache:invalidation, cache:cascade, cache:batch</li>
                  <li><strong>See in real-time:</strong> Instances 2 & 3 receive event in Metrics tab</li>
                  <li>All instances invalidate their local caches</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ===== TAB 5: Monitor & Metrics ===== */}
        {activeTab === 'monitor' && (
          <section>
            <h2>Real-Time Monitoring</h2>
            <div className="description">
              Watch published events, received events, and local cache state across all instances in real-time.
            </div>

            {instanceInfo && (
              <div className="metrics-display">
                <div className="metric-card">
                  <h4>Instance ID</h4>
                  <div className="value" style={{ fontSize: '1.2em' }}>{instanceInfo}</div>
                  <div className="label">Current instance</div>
                </div>
                {metrics && (
                  <>
                    <div className="metric-card">
                      <h4>Published</h4>
                      <div className="value">{metrics.metrics.published}</div>
                      <div className="label">Total events published</div>
                    </div>
                    <div className="metric-card">
                      <h4>Received</h4>
                      <div className="value">{metrics.metrics.received}</div>
                      <div className="label">Total events received</div>
                    </div>
                    <div className="metric-card">
                      <h4>Invalidations</h4>
                      <div className="value">{metrics.metrics.invalidations}</div>
                      <div className="label">Cache keys cleared</div>
                    </div>
                    <div className="metric-card">
                      <h4>Cache Size</h4>
                      <div className="value">{metrics.metrics.localCacheSize}</div>
                      <div className="label">Keys in local cache</div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="panel">
              <h3>Recent Message History (Last 20)</h3>
              {metrics?.recentMessages && metrics.recentMessages.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Channel</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Event Type</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Keys</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentMessages.map((msg, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px' }}>
                          <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px', fontSize: '0.85em' }}>
                            {msg.channel}
                          </code>
                        </td>
                        <td style={{ padding: '8px' }}>{msg.event}</td>
                        <td style={{ padding: '8px' }}>{msg.keys}</td>
                        <td style={{ padding: '8px', color: '#666', fontSize: '0.85em' }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No messages yet</p>
              )}
            </div>

            <div className="panel">
              <h3>Local Cache State</h3>
              {cacheState && (
                <>
                  <p><strong>Cache Size:</strong> {cacheState.cacheSize} keys</p>
                  <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                    <strong>Cached Keys:</strong>
                    {cacheState.keys.length > 0 ? (
                      <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                        {cacheState.keys.map((key, idx) => (
                          <li key={idx}>
                            <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>
                              {key}
                            </code>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: '#999', marginTop: '10px' }}>Cache is empty</p>
                    )}
                  </div>
                </>
              )}

              <button className="secondary" onClick={() => fetchAPI('/api/cache/clear', 'POST', {})}>
                Clear Local Cache
              </button>
              <button className="secondary" style={{ marginLeft: '10px' }}
                onClick={() => fetchAPI('/api/metrics/reset', 'POST', {})}>
                Reset Metrics
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
          Backend running on port 6404 | Redis Pub/Sub enabled | Local cache on each instance | Real-time metrics
        </p>
      </footer>
    </div>
  );
}
