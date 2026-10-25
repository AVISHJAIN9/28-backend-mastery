import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3005';
  
  const TESTS = [
    { id: 'demo', label: '🔍 Basic Context', path: '/api/async-local-storage/demo' },
    { id: 'multi', label: '⚡ Multiple Operations', path: '/api/async-local-storage/multiple-operations' },
    { id: 'nested', label: '📦 Nested Contexts', path: '/api/async-local-storage/nested' },
    { id: 'error', label: '⚠️ Error Propagation', path: '/api/async-local-storage/error-propagation' },
    { id: 'context', label: '📋 Get Context', path: '/api/async-local-storage/context' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>🔒 05: AsyncLocalStorage</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Preserve context across async operations without passing parameters
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
            <p>Loading...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.initialContext && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <h4>Initial Context:</h4>
                <p><strong>Request ID:</strong> {response.initialContext.requestId}</p>
                <p><strong>User ID:</strong> {response.initialContext.userId}</p>
              </div>
            )}
            {response.operations && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Async Operations:</h4>
                {response.operations.map((op, idx) => (
                  <div key={idx} style={{ backgroundColor: '#d5f4e6', padding: '10px', borderRadius: '4px', marginBottom: '8px', fontSize: '13px' }}>
                    <strong>{op.name}:</strong> Context {"✅" if (op.contextAvailable) else "❌"} | Same ID: {"✅" if (op.preserved) else "❌"}
                  </div>
                ))}
              </div>
            )}
            {response.trace && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Execution Trace:</h4>
                {response.trace.map((line, idx) => (
                  <div key={idx} style={{ backgroundColor: '#ecf0f1', padding: '8px', borderRadius: '4px', marginBottom: '5px', fontSize: '12px', fontFamily: 'monospace' }}>
                    {line}
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
                <span style={{ fontWeight: 'bold' }}>{item.time.toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
          <h2>📚 AsyncLocalStorage Basics</h2>
          <div style={{ backgroundColor: '#fadbd8', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
            <strong>❌ Problem:</strong> With concurrent requests, global variables mix up state. Need to pass context through every function call.
          </div>
          <div style={{ backgroundColor: '#d5f4e6', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
            <strong>✅ Solution:</strong> AsyncLocalStorage isolates context per request automatically, even across async boundaries.
          </div>
          <div>
            <h4>Use Cases:</h4>
            <ul>
              <li>Request ID tracking for logging</li>
              <li>User context (who made the request)</li>
              <li>Correlation IDs for distributed tracing</li>
              <li>Tenant isolation in multi-tenant apps</li>
              <li>Transaction context in database operations</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginTop: '15px' }}>
            <strong>💡 Key Point:</strong> Context persists across <code>await</code>, <code>.then()</code>, and setTimeout - no parameter passing needed!
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

