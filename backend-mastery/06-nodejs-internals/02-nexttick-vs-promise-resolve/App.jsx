import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3002';
  
  const TESTS = [
    { id: 'order', label: '📊 Execution Order', path: '/api/microtask/nexttick-vs-promise', desc: 'See callback execution order' },
    { id: 'frames', label: '🔄 Multiple Frames', path: '/api/microtask/multiple-nexttick-frames', desc: 'nextTick across event loop cycles' },
    { id: 'promise', label: '⛓️ Promise Chain', path: '/api/microtask/promise-chain', desc: 'Promise microtask queue behavior' },
    { id: 'log', label: '📝 View Log', path: '/api/microtask/log', desc: 'See accumulated execution log' },
  ];

  const callEndpoint = useCallback(async (endpoint) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      const data = await res.json();
      setResponse(data);
      setHistory(prev => [...prev.slice(-4), { endpoint, time: new Date(), data }]);
    } catch (error) {
      setResponse({ error: `Failed to connect to ${API_BASE}${endpoint}` });
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
        <h1 style={{ margin: '0 0 10px 0' }}>⚡ 02: process.nextTick vs Promise.resolve</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Understand callback execution order: Synchronous → Microtasks (nextTick, Promises) → Macrotasks
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
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            title={test.desc}
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
            {response.executionSequence && (
              <ol style={{ backgroundColor: '#ecf0f1', padding: '15px 30px', borderRadius: '4px' }}>
                {response.executionSequence.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '8px', fontFamily: 'monospace' }}>
                    {item}
                  </li>
                ))}
              </ol>
            )}
            {!response.executionSequence && (
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
            )}
          </div>
        )}

        {history.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px',marginBottom: '20px' }}>
            <h3>📜 History ({history.length})</h3>
            {history.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: '#ecf0f1', padding: '10px', borderRadius: '4px', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ fontWeight: 'bold' }}>{item.time.toLocaleTimeString()}</span> - <code>{item.endpoint}</code>
              </div>
            ))}
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
          <h2>📚 Microtask Queue</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#d5dbdb', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>Synchronous</strong><p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>Runs immediately</p>
            </div>
            <div style={{ backgroundColor: '#d5dbdb', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>Microtasks</strong><p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>nextTick & Promises</p>
            </div>
            <div style={{ backgroundColor: '#d5dbdb', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #2ecc71' }}>
              <strong>Macrotasks</strong><p style={{ fontSize: '13px', margin: '8px 0 0 0' }}>setTimeout, I/O</p>
            </div>
          </div>
          <ul>
            <li><strong>process.nextTick():</strong> Highest priority microtask</li>
            <li><strong>Promise callbacks:</strong> Run after all nextTick</li>
            <li><strong>All microtasks flush</strong> before macrotasks</li>
            <li><strong>Event loop re-enters</strong> for next phase</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default App;

