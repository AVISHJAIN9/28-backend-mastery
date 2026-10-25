import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = `http://localhost:${3000 + 13}`;

  const TESTS = {
    requireBasic: 'Basic require() Pattern',
    esModuleBasic: 'Basic ES Module Pattern',
    caching: 'Module Caching Behavior',
    circularDep: 'Circular Dependencies Issue',
    resolution: 'Module Resolution Process',
    optimization: 'Lazy Loading Optimization',
    mixedModules: 'Mixed CommonJS & ESM',
    exportPatterns: 'Export/Import Patterns',
  };

  const callEndpoint = useCallback(async (endpoint) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      const data = await res.json();
      setResponse(data);
      setHistory((prev) => [...prev.slice(-9), { endpoint, timestamp: new Date(), data }]);
    } catch (error) {
      setResponse({ error: error.message, endpoint });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTestClick = (test) => {
    setActiveTest(test);
    const endpoints = {
      requireBasic: '/api/modules/require-basic',
      esModuleBasic: '/api/modules/esmodule-basic',
      caching: '/api/modules/caching',
      circularDep: '/api/modules/circular-deps',
      resolution: '/api/modules/resolution',
      optimization: '/api/modules/lazy-loading',
      mixedModules: '/api/modules/mixed-modules',
      exportPatterns: '/api/modules/export-patterns',
    };
    callEndpoint(endpoints[test]);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ backgroundColor: '#2c3e50', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>📦 13: Module System</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          CommonJS (require) vs ES Modules (import), caching, resolution, circular dependencies
        </p>
      </header>

      <nav style={{ backgroundColor: '#34495e', padding: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.entries(TESTS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleTestClick(key)}
            disabled={loading}
            style={{
              padding: '10px 15px',
              backgroundColor: activeTest === key ? '#e74c3c' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px' }}>⏳</div>
            <p>Loading module...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.code && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Code:</h4>
                <pre style={{ backgroundColor: '#2c3e50', color: '#ecf0f1', padding: '10px', borderRadius: '4px', fontSize: '11px', overflow: 'auto', maxHeight: '150px' }}>
                  {response.code}
                </pre>
              </div>
            )}
            {response.explanation && (
              <div style={{ marginBottom: '15px', backgroundColor: '#d4edda', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #28a745' }}>
                <strong>💡 {response.explanation}</strong>
              </div>
            )}
            {response.resolution && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Resolution Steps:</h4>
                {response.resolution.map((step, idx) => (
                  <div key={idx} style={{ backgroundColor: '#d5f4e6', padding: '8px', borderRadius: '4px', marginBottom: '6px', fontSize: '12px' }}>
                    {step}
                  </div>
                ))}
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
                <span style={{ fontWeight: 'bold' }}>{item.timestamp?.toLocaleTimeString?.() || 'N/A'}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
          <h2>📚 Module System Patterns</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>CommonJS (require)</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Synchronous loading</li>
                <li>Dynamic at runtime</li>
                <li>require.cache</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>ES Modules (import)</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Asynchronous loading</li>
                <li>Static analysis</li>
                <li>Tree-shaking enabled</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>Module Resolution</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Check cache first</li>
                <li>Search node_modules</li>
                <li>.js, .json, .node</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>Circular Dependencies</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>When A needs B, B needs A</li>
                <li>Returns incomplete object</li>
                <li>Solution: refactor</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #f39c12' }}>
              <strong>Caching Mechanism</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>require.cache object</li>
                <li>Module reuse</li>
                <li>Singleton pattern</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #27ae60' }}>
              <strong>Best Practices</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Named imports clearly</li>
                <li>Single responsibility</li>
                <li>Avoid circular deps</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
