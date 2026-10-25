import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3012';
  
  const TESTS = [
    { id: 'basic', label: '📍 Basic Route', path: '/api/routing/users' },
    { id: 'param', label: '🔑 Route Parameter', path: '/api/routing/users/123' },
    { id: 'query', label: '❓ Query String', path: '/api/routing/search?q=node&limit=10' },
    { id: 'methods', label: '🛠️ HTTP Methods', path: '/api/routing/methods' },
    { id: 'middleware', label: '⛓️ Middleware Chain', path: '/api/routing/middleware-test' },
    { id: 'priority', label: '🎯 Route Priority', path: '/api/routing/priority-test' },
  ];

  const callEndpoint = useCallback(async (endpoint) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      const data = await res.json();
      setResponse(data);
      setHistory(prev => [...prev.slice(-4), { endpoint, time: new Date() }]);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTest = (test) => {
    setActiveTest(test.id);
    callEndpoint(test.path);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ backgroundColor: '#2c3e50', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>🛣️ 12: Express Routing</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Path matching, parameters, query strings, middleware chains, priority resolution
        </p>
      </header>

      <nav style={{ backgroundColor: '#34495e', padding: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {TESTS.map(test => (
          <button
            key={test.id}
            onClick={() => handleTest(test)}
            disabled={loading}
            style={{
              padding: '10px 15px',
              backgroundColor: activeTest === test.id ? '#e74c3c' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            {test.label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px' }}>⏳</div>
            <p>Routing...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.route && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Route:</strong> {response.route}</p>
                {response.method && <p><strong>Method:</strong> {response.method}</p>}
                {response.params && Object.keys(response.params).length > 0 && (
                  <p><strong>Params:</strong> {JSON.stringify(response.params)}</p>
                )}
                {response.query && Object.keys(response.query).length > 0 && (
                  <p><strong>Query:</strong> {JSON.stringify(response.query)}</p>
                )}
              </div>
            )}
            {response.execution && Array.isArray(response.execution) && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Execution Order:</h4>
                {response.execution.map((step, idx) => (
                  <div key={idx} style={{ backgroundColor: '#d5f4e6', padding: '10px', borderRadius: '4px', marginBottom: '8px', fontSize: '12px' }}>
                    <strong>{idx + 1}. {step.phase}:</strong> {step.description}
                  </div>
                ))}
              </div>
            )}
            {response.message && (
              <div style={{ marginBottom: '15px', backgroundColor: '#d4edda', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #28a745' }}>
                <strong>Message:</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>{response.message}</p>
              </div>
            )}
            <pre style={{
              backgroundColor: '#2c3e50',
              color: '#ecf0f1',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        {history.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📜 History ({history.length})</h3>
            {history.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: '#ecf0f1', padding: '10px', borderRadius: '4px', marginBottom: '8px', fontSize: '12px' }}>
                <span style={{ fontWeight: 'bold' }}>{item.time.toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
          <h2>📚 Express Routing Concepts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>Path Matching</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>String matching: '/path'</li>
                <li>Regex patterns: /^\/path/</li>
                <li>Wildcard: '*' matches all</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>Route Parameters</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>'/users/:id' → req.params.id</li>
                <li>'/files/:name.:ext'</li>
                <li>Optional: ':id?'</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>Middleware Chain</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>app.use() - all routes</li>
                <li>app.use(path, fn) - specific</li>
                <li>next() continues chain</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>Route Priority</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Static before dynamic</li>
                <li>Exact path first</li>
                <li>Pattern specificity</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #f39c12' }}>
              <strong>HTTP Methods</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>app.get(), .post(), .put()</li>
                <li>app.all() - any method</li>
                <li>app.method() - custom</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #16a085' }}>
              <strong>Query Strings</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>'?key=value' → req.query</li>
                <li>Multiple: ?a=1&b=2</li>
                <li>Array: ?ids=1&ids=2</li>
              </ul>
            </div>
          </div>
          <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px' }}>
            <strong>⚡ Performance:</strong> Static routes are faster than regex patterns. Order matters - most specific to least specific.
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

