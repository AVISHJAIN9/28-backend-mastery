import React, { useState } from 'react';
import './App.css';

export default function RateLimiting() {
  const [activeTab, setActiveTab] = useState('fixed');
  const [identifier, setIdentifier] = useState('user123');
  const [limit, setLimit] = useState(5);
  const [window, setWindow] = useState(60);
  const [burstSize, setBurstSize] = useState(10);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:6417/api';

  // Single request test
  const testSingleRequest = async (algorithm) => {
    setLoading(true);
    try {
      const endpoint = {
        fixed: '/fixed-window/check',
        token: '/token-bucket/check',
        sliding: '/sliding-window/check'
      }[algorithm];

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          limit: parseInt(limit),
          capacity: parseInt(limit),
          refill: parseInt(window),
          window: parseInt(window)
        })
      });

      const data = await res.json();
      
      setResponse({
        type: res.ok ? 'success' : 'warning',
        title: res.ok ? '✅ Request Allowed' : '❌ Rate Limited',
        data
      });
    } catch (error) {
      setResponse({ type: 'error', title: 'Error', message: error.message });
    }
    setLoading(false);
  };

  // Burst test
  const testBurst = async (algorithm) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/simulate/burst`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithm: algorithm.charAt(0),
          identifier: `burst-${Date.now()}`,
          count: parseInt(burstSize),
          limit: parseInt(limit),
          window: parseInt(window)
        })
      });

      const data = await res.json();
      
      setResponse({
        type: 'success',
        title: `🔥 Burst Test Results (${algorithm})`,
        data
      });
    } catch (error) {
      setResponse({ type: 'error', title: 'Error', message: error.message });
    }
    setLoading(false);
  };

  // Clear all
  const clearAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clear-all`, { method: 'POST' });
      const data = await res.json();
      
      setResponse({
        type: 'success',
        title: '🗑️ Cleared',
        message: data.message
      });
    } catch (error) {
      setResponse({ type: 'error', title: 'Error', message: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <header>
        <h1>⏱️ Rate Limiting with Redis</h1>
        <p>Three algorithms: Fixed Window, Token Bucket, and Sliding Window</p>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'fixed' ? 'active' : ''}`} onClick={() => setActiveTab('fixed')}>
          Fixed Window
        </button>
        <button className={`tab ${activeTab === 'token' ? 'active' : ''}`} onClick={() => setActiveTab('token')}>
          Token Bucket
        </button>
        <button className={`tab ${activeTab === 'sliding' ? 'active' : ''}`} onClick={() => setActiveTab('sliding')}>
          Sliding Window
        </button>
        <button className={`tab ${activeTab === 'compare' ? 'active' : ''}`} onClick={() => setActiveTab('compare')}>
          Compare
        </button>
      </div>

      <div className="content">
        {/* Configuration */}
        <section style={{ marginBottom: '30px' }}>
          <h2>⚙️ Configuration</h2>
          <div className="panel">
            <label>Identifier (user/IP):</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="user123"
            />
            <label>Rate Limit (requests):</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min="1"
              max="1000"
            />
            <label>Window (seconds):</label>
            <input
              type="number"
              value={window}
              onChange={(e) => setWindow(e.target.value)}
              min="1"
              max="3600"
            />
            <label>Burst Size (for testing):</label>
            <input
              type="number"
              value={burstSize}
              onChange={(e) => setBurstSize(e.target.value)}
              min="1"
              max="100"
            />
          </div>
        </section>

        {/* Fixed Window */}
        {activeTab === 'fixed' && (
          <section>
            <h2>⬜ Fixed Window</h2>
            <p className="description">
              Divide time into fixed buckets. Count requests in current bucket. Reset at boundary.
              <br/>
              Best for: Simple rate limiting, lightweight endpoints
            </p>
            <div className="panel">
              <h3>How It Works:</h3>
              <ul>
                <li>Time divided into fixed periods (e.g., 60 seconds)</li>
                <li>Count requests in current period</li>
                <li>Reset count at period boundary</li>
                <li>Burst possible at boundaries (100 at T=59s, 100 at T=60s)</li>
              </ul>
              <button onClick={() => testSingleRequest('fixed')} disabled={loading}>
                📤 Single Request
              </button>
              <button onClick={() => testBurst('fixed')} disabled={loading}>
                🔥 Burst Test ({burstSize} requests)
              </button>
            </div>
          </section>
        )}

        {/* Token Bucket */}
        {activeTab === 'token' && (
          <section>
            <h2>🪣 Token Bucket</h2>
            <p className="description">
              Tokens added at steady rate. One token per request. Allows burst up to capacity.
              <br/>
              Best for: Bursty traffic, fair allocation, premium tiers
            </p>
            <div className="panel">
              <h3>How It Works:</h3>
              <ul>
                <li>Capacity: {limit} tokens (maximum)</li>
                <li>Refill rate: {(limit / window).toFixed(2)} tokens/second</li>
                <li>Each request consumes 1 token</li>
                <li>Tokens accrue over time (capped at capacity)</li>
                <li>Burst allowed up to capacity, then throttled</li>
              </ul>
              <button onClick={() => testSingleRequest('token')} disabled={loading}>
                📤 Single Request
              </button>
              <button onClick={() => testBurst('token')} disabled={loading}>
                🔥 Burst Test ({burstSize} requests)
              </button>
            </div>
          </section>
        )}

        {/* Sliding Window */}
        {activeTab === 'sliding' && (
          <section>
            <h2>📈 Sliding Window</h2>
            <p className="description">
              Track timestamps of all requests. Window slides continuously. Most accurate.
              <br/>
              Best for: Strict quotas, financial compliance, audit trails
            </p>
            <div className="panel">
              <h3>How It Works:</h3>
              <ul>
                <li>Maintain list of request timestamps</li>
                <li>Window: [now - {window}s, now]</li>
                <li>Remove requests outside window</li>
                <li>Count remaining requests</li>
                <li>No burst possible - exact rate limiting</li>
              </ul>
              <button onClick={() => testSingleRequest('sliding')} disabled={loading}>
                📤 Single Request
              </button>
              <button onClick={() => testBurst('sliding')} disabled={loading}>
                🔥 Burst Test ({burstSize} requests)
              </button>
            </div>
          </section>
        )}

        {/* Compare */}
        {activeTab === 'compare' && (
          <section>
            <h2>📊 Algorithm Comparison</h2>
            <div className="panel">
              <table>
                <thead>
                  <tr>
                    <th>Aspect</th>
                    <th>Fixed Window</th>
                    <th>Token Bucket</th>
                    <th>Sliding Window</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Speed</strong></td>
                    <td>⚡⚡⚡ Fastest</td>
                    <td>⚡⚡ Fast</td>
                    <td>⚡ Slow</td>
                  </tr>
                  <tr>
                    <td><strong>Memory</strong></td>
                    <td>⭐⭐⭐ Minimal</td>
                    <td>⭐⭐ Low</td>
                    <td>⭐ High</td>
                  </tr>
                  <tr>
                    <td><strong>Accuracy</strong></td>
                    <td>80% (burst at boundaries)</td>
                    <td>95% (allows burst)</td>
                    <td>100% (perfect precision)</td>
                  </tr>
                  <tr>
                    <td><strong>Burst Allowed</strong></td>
                    <td>✅ Yes (boundary spike)</td>
                    <td>✅ Yes (up to capacity)</td>
                    <td>❌ No</td>
                  </tr>
                  <tr>
                    <td><strong>Best For</strong></td>
                    <td>High-traffic APIs</td>
                    <td>Fair allocation</td>
                    <td>Regulatory compliance</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="panel">
              <h3>📝 Decision Matrix</h3>
              <ul>
                <li><strong>Need speed?</strong> → Fixed Window</li>
                <li><strong>Need fairness?</strong> → Token Bucket</li>
                <li><strong>Need precision?</strong> → Sliding Window</li>
                <li><strong>Public API?</strong> → Fixed Window or Token Bucket</li>
                <li><strong>Financial system?</strong> → Sliding Window</li>
                <li><strong>DDoS protection?</strong> → Fixed Window (fastest)</li>
              </ul>
            </div>

            <div className="panel">
              <h3>🧪 Test All Three</h3>
              <button onClick={() => testBurst('fixed')} disabled={loading}>
                Test Fixed Window
              </button>
              <button onClick={() => testBurst('token')} disabled={loading}>
                Test Token Bucket
              </button>
              <button onClick={() => testBurst('sliding')} disabled={loading}>
                Test Sliding Window
              </button>
              <button onClick={clearAll} disabled={loading} style={{ background: '#d93f3f' }}>
                🗑️ Clear All
              </button>
            </div>
          </section>
        )}

        {/* Response */}
        {response && (
          <div className="response">
            <h3 style={{ color: response.type === 'success' ? '#00ff00' : response.type === 'warning' ? '#ffff00' : '#ff6b6b' }}>
              {response.title}
            </h3>
            {response.message ? (
              <p>{response.message}</p>
            ) : (
              <pre>{JSON.stringify(response.data, null, 2)}</pre>
            )}
          </div>
        )}
      </div>

      <footer>
        <p className="info">
          💡 <strong>Tip:</strong> Set a low limit (5) and burst size (10) to see rate limiting in action.
          Note how each algorithm handles the burst differently.
        </p>
      </footer>
    </div>
  );
}
