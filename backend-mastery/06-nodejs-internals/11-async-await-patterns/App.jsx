import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3011';
  
  const TESTS = [
    { id: 'sequential', label: '🔀 Sequential', path: '/api/async-patterns/sequential' },
    { id: 'parallel', label: '⚡ Parallel', path: '/api/async-patterns/parallel' },
    { id: 'retry', label: '🔁 Retry', path: '/api/async-patterns/retry?times=3' },
    { id: 'timeout', label: '⏱️ Timeout', path: '/api/async-patterns/timeout?ms=2000' },
    { id: 'error', label: '❌ Error Handling', path: '/api/async-patterns/error-handling' },
    { id: 'fintally', label: '🔒 Cleanup', path: '/api/async-patterns/finally-cleanup' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>🔄 11: Async/Await Patterns</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Sequential, parallel, retry, timeout, error handling patterns
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
            <p>Executing async operation...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.pattern && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Pattern:</strong> {response.pattern}</p>
                {response.duration !== undefined && (
                  <p><strong>Duration:</strong> {response.duration}ms</p>
                )}
                {response.iterations !== undefined && (
                  <p><strong>Iterations:</strong> {response.iterations}</p>
                )}
              </div>
            )}
            {response.results && Array.isArray(response.results) && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Results:</h4>
                {response.results.map((result, idx) => (
                  <div key={idx} style={{ backgroundColor: '#d5f4e6', padding: '10px', borderRadius: '4px', marginBottom: '8px', fontSize: '12px' }}>
                    <strong>Step {idx + 1}:</strong> {JSON.stringify(result)}
                  </div>
                ))}
              </div>
            )}
            {response.message && (
              <div style={{ marginBottom: '15px', backgroundColor: '#d4edda', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #28a745' }}>
                <strong>Success:</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>{response.message}</p>
              </div>
            )}
            {response.error && (
              <div style={{ marginBottom: '15px', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #dc3545' }}>
                <strong>Error:</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>{response.error}</p>
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
          <h2>📚 Async/Await Patterns</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>Sequential</strong>
              <pre style={{ fontSize: '11px', margin: '10px 0 0 0', backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '3px', overflow: 'auto' }}>
{`const r1 = await op1();
const r2 = await op2(r1);`}
              </pre>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>Parallel</strong>
              <pre style={{ fontSize: '11px', margin: '10px 0 0 0', backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '3px', overflow: 'auto' }}>
{`const [r1, r2] = 
  await Promise.all([
    op1(), op2()
  ]);`}
              </pre>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>Retry Logic</strong>
              <pre style={{ fontSize: '11px', margin: '10px 0 0 0', backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '3px', overflow: 'auto' }}>
{`for(let i=0;i<3;i++)
  try { return await op(); }
  catch { if(i===2) throw; }`}
              </pre>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>Timeout</strong>
              <pre style={{ fontSize: '11px', margin: '10px 0 0 0', backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '3px', overflow: 'auto' }}>
{`Promise.race([
  op(),
  sleep(ms)
]);`}
              </pre>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #f39c12' }}>
              <strong>Try/Catch/Finally</strong>
              <pre style={{ fontSize: '11px', margin: '10px 0 0 0', backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '3px', overflow: 'auto' }}>
{`try {
  await op();
} catch(e) {
  handle(e);
} finally {
  cleanup();
}`}
              </pre>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #16a085' }}>
              <strong>Avoid Common Mistakes</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>❌ Await in loops: slow</li>
                <li>❌ Missing error handler</li>
                <li>❌ Unhandled rejections</li>
              </ul>
            </div>
          </div>
          <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px' }}>
            <strong>💡 Performance:</strong> Use Promise.all() instead of sequential awaits when operations are independent. Use race() for timeout patterns.
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

