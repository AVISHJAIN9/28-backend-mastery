import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('xfetch');
  const [xfetchResponse, setXfetchResponse] = useState(null);
  const [lockResponse, setLockResponse] = useState(null);
  const [staleResponse, setStaleResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const API_BASE = `http://localhost:${process.env.REACT_APP_BACKEND_PORT || 6415}`;

  // Test XFetch strategy
  const testXFetch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/xfetch`);
      const data = await response.json();
      setXfetchResponse({
        ...data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setXfetchResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Test Lock strategy
  const testLock = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/lock`);
      const data = await response.json();
      setLockResponse({
        ...data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setLockResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Test Stale-While-Revalidate strategy
  const testStale = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/stale-while-revalidate`);
      const data = await response.json();
      setStaleResponse({
        ...data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setStaleResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Simulate stampede (multiple concurrent requests)
  const simulateStampede = async (strategy) => {
    setSimulating(true);
    const endpoint = strategy === 'xfetch' ? 'xfetch' : 
                     strategy === 'lock' ? 'lock' :
                     'stale-while-revalidate';
    
    try {
      // First, clear cache
      await fetch(`${API_BASE}/api/clear-cache`, { method: 'POST' });
      
      // Send 10 concurrent requests (simulating stampede)
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          fetch(`${API_BASE}/api/${endpoint}`).then(r => r.json())
        );
      }
      
      const results = await Promise.all(promises);
      const sources = results.map(r => r.source);
      const sourceCounts = {};
      sources.forEach(s => {
        sourceCounts[s] = (sourceCounts[s] || 0) + 1;
      });
      
      const response = {
        totalRequests: 10,
        sources: sourceCounts,
        timestamp: new Date().toLocaleTimeString(),
        results
      };
      
      if (strategy === 'xfetch') setXfetchResponse(response);
      else if (strategy === 'lock') setLockResponse(response);
      else setStaleResponse(response);
    } catch (error) {
      console.error('Stampede simulation error:', error);
    } finally {
      setSimulating(false);
    }
  };

  // Clear cache
  const clearCache = async () => {
    try {
      await fetch(`${API_BASE}/api/clear-cache`, { method: 'POST' });
      setXfetchResponse(null);
      setLockResponse(null);
      setStaleResponse(null);
      alert('Cache cleared!');
    } catch (error) {
      alert('Error clearing cache: ' + error.message);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>⚡ Cache Stampede Prevention</h1>
        <p>Preventing the thundering herd problem - comparing 3 strategies</p>
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'xfetch' ? 'active' : ''}`}
          onClick={() => setActiveTab('xfetch')}
        >
          🎲 XFetch
        </button>
        <button 
          className={`tab ${activeTab === 'lock' ? 'active' : ''}`}
          onClick={() => setActiveTab('lock')}
        >
          🔒 Distributed Lock
        </button>
        <button 
          className={`tab ${activeTab === 'stale' ? 'active' : ''}`}
          onClick={() => setActiveTab('stale')}
        >
          ⟲ Stale-While-Revalidate
        </button>
      </div>

      <div className="content">
        {/* XFETCH SECTION */}
        {activeTab === 'xfetch' && (
          <section>
            <h2>🎲 XFetch (Probabilistic Early Expiration)</h2>
            <p className="description">
              One random user refreshes cache early. Others hit the cache (fresh or soon-to-be-fresh).
              Prevents stampede by spreading refresh load over time.
            </p>

            <div className="panel">
              <h3>How It Works</h3>
              <ul>
                <li>Cache expiration: Every T seconds</li>
                <li>At T-delta seconds: One request randomly refreshes</li>
                <li>Others: Hit cache immediately (stale briefly)</li>
                <li>Result: Smooth refresh, no spike</li>
              </ul>
            </div>

            <div className="panel">
              <h3>Pros & Cons</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4>✅ Pros</h4>
                  <ul>
                    <li>Prevents stampede</li>
                    <li>Single request refreshes</li>
                    <li>No client waiting</li>
                    <li>Excellent scalability</li>
                  </ul>
                </div>
                <div>
                  <h4>❌ Cons</h4>
                  <ul>
                    <li>Some see stale data</li>
                    <li>Probability math is Hard</li>
                    <li>Not guaranteed fresh</li>
                    <li>Background refresh might fail</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="panel">
              <h3>🧪 Test It</h3>
              <button onClick={testXFetch} disabled={loading || simulating} className="primary">
                {loading ? '⏳ Loading...' : 'Single Request'}
              </button>
              <button onClick={() => simulateStampede('xfetch')} disabled={loading || simulating} style={{ marginLeft: '10px' }}>
                {simulating ? '⏳ Simulating...' : 'Simulate 10 Concurrent Requests'}
              </button>
              <p className="hint">
                💡 Click "Simulate" multiple times to see cache stampede prevention in action.
                Watch how only ONE request hits the DB/refreshes.
              </p>
            </div>

            {xfetchResponse && (
              <div className="response">
                <h3>Response:</h3>
                <pre>{JSON.stringify(xfetchResponse, null, 2)}</pre>
              </div>
            )}
          </section>
        )}

        {/* DISTRIBUTED LOCK SECTION */}
        {activeTab === 'lock' && (
          <section>
            <h2>🔒 Distributed Lock</h2>
            <p className="description">
              When cache expires, first request gets lock and refreshes. Others wait for fresh data.
              Guarantees freshness but clients wait a bit longer.
            </p>

            <div className="panel">
              <h3>How It Works</h3>
              <ul>
                <li>Cache miss detected</li>
                <li>Try to acquire distributed lock (Redis SET NX)</li>
                <li>Lock holder: Refreshes cache</li>
                <li>Waiters: Poll Redis until fresh data available</li>
                <li>All get fresh data</li>
              </ul>
            </div>

            <div className="panel">
              <h3>Pros & Cons</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4>✅ Pros</h4>
                  <ul>
                    <li>Guaranteed fresh data</li>
                    <li>Single refresh process</li>
                    <li>Clear coordination</li>
                    <li>Good for critical data</li>
                  </ul>
                </div>
                <div>
                  <h4>❌ Cons</h4>
                  <ul>
                    <li>Clients wait for lock</li>
                    <li>Lock timeout possible</li>
                    <li>Lock holder crash = stuck</li>
                    <li>Slower response time</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="panel">
              <h3>🧪 Test It</h3>
              <button onClick={testLock} disabled={loading || simulating} className="primary">
                {loading ? '⏳ Loading...' : 'Single Request'}
              </button>
              <button onClick={() => simulateStampede('lock')} disabled={loading || simulating} style={{ marginLeft: '10px' }}>
                {simulating ? '⏳ Simulating...' : 'Simulate 10 Concurrent Requests'}
              </button>
              <p className="hint">
                💡 Watch the response times. Most requests will wait for the lock holder to refresh.
              </p>
            </div>

            {lockResponse && (
              <div className="response">
                <h3>Response:</h3>
                <pre>{JSON.stringify(lockResponse, null, 2)}</pre>
              </div>
            )}
          </section>
        )}

        {/* STALE-WHILE-REVALIDATE SECTION */}
        {activeTab === 'stale' && (
          <section>
            <h2>⟲ Stale-While-Revalidate</h2>
            <p className="description">
              Serve stale cache immediately. Refresh in background asynchronously.
              Best UX: no waiting, guaranteed response, smooth background refresh.
            </p>

            <div className="panel">
              <h3>How It Works</h3>
              <ul>
                <li>Client requests data</li>
                <li>Cache fresh? Return immediately</li>
                <li>Cache stale (but within maxStale)? Return stale + refresh background</li>
                <li>Beyond maxStale? Fetch fresh, return it</li>
                <li>Next request: Gets refreshed data</li>
              </ul>
            </div>

            <div className="panel">
              <h3>Pros & Cons</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4>✅ Pros</h4>
                  <ul>
                    <li>Instant response (no waiting)</li>
                    <li>Best UX</li>
                    <li>No stampede</li>
                    <li>Graceful degradation</li>
                  </ul>
                </div>
                <div>
                  <h4>❌ Cons</h4>
                  <ul>
                    <li>Clients see stale data</li>
                    <li>No freshness guarantee</li>
                    <li>Background refresh might fail</li>
                    <li>Extra staleness window</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="panel">
              <h3>🧪 Test It</h3>
              <button onClick={testStale} disabled={loading || simulating} className="primary">
                {loading ? '⏳ Loading...' : 'Single Request'}
              </button>
              <button onClick={() => simulateStampede('stale')} disabled={loading || simulating} style={{ marginLeft: '10px' }}>
                {simulating ? '⏳ Simulating...' : 'Simulate 10 Concurrent Requests'}
              </button>
              <p className="hint">
                💡 Notice how all requests return instantly. The client gets immediate response
                (stale data is ok), and background refresh happens silently.
              </p>
            </div>

            {staleResponse && (
              <div className="response">
                <h3>Response:</h3>
                <pre>{JSON.stringify(staleResponse, null, 2)}</pre>
              </div>
            )}
          </section>
        )}

        {/* COMPARISON SECTION */}
        <section style={{ marginTop: '60px' }}>
          <h2>📊 Strategy Comparison</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Aspect</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>🎲 XFetch</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>🔒 Lock</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>⟲ Stale</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>Response Speed</td>
                  <td style={{ padding: '10px' }}>⚡ Instant</td>
                  <td style={{ padding: '10px' }}>🐢 Waiting</td>
                  <td style={{ padding: '10px' }}>⚡ Instant</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>Data Freshness</td>
                  <td style={{ padding: '10px' }}>Good</td>
                  <td style={{ padding: '10px' }}>✅ Excellent</td>
                  <td style={{ padding: '10px' }}>Medium</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>Complexity</td>
                  <td style={{ padding: '10px' }}>Medium</td>
                  <td style={{ padding: '10px' }}>Medium</td>
                  <td style={{ padding: '10px' }}>Low</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>Best For</td>
                  <td style={{ padding: '10px' }}>High traffic</td>
                  <td style={{ padding: '10px' }}>Critical data</td>
                  <td style={{ padding: '10px' }}>User-facing</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>Stampede Risk</td>
                  <td style={{ padding: '10px' }}>✅ Prevented</td>
                  <td style={{ padding: '10px' }}>✅ Prevented</td>
                  <td style={{ padding: '10px' }}>✅ Prevented</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="panel" style={{ marginTop: '40px' }}>
          <h3>🧹 Utility</h3>
          <button onClick={clearCache} style={{ backgroundColor: '#ff6b6b' }}>
            Clear All Caches
          </button>
        </div>
      </div>

      <footer>
        <p className="info">
          💡 Tip: Clear cache between tests to see each strategy handle cold start.
          Try simulating concurrent requests to observe how each handles the stampede!
        </p>
      </footer>
    </div>
  );
}
