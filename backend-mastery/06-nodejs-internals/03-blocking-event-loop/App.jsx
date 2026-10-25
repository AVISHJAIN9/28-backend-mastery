import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3003';
  
  const TESTS = [
    { id: 'block', label: '🚫 Blocking Hash', path: '/api/blocking/hash?iterations=1000000' },
    { id: 'nonblock', label: '✅ Non-Blocking Hash', path: '/api/non-blocking/hash?iterations=1000000' },
    { id: 'fileblock', label: '📄 Blocking File Read', path: '/api/blocking/file-read' },
    { id: 'filenonblock', label: '📄 Non-Blocking File', path: '/api/non-blocking/file-read' },
    { id: 'compare', label: '📊 Compare Both', path: '/api/blocking/comparison' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>⚠️ 03: Blocking Event Loop</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Understand how synchronous operations block the event loop
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
            <p>Loading... (this may take a moment)</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.blockTimeMs && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Block Time:</strong> {response.blockTimeMs}ms</p>
                <p><strong>Message:</strong> {response.warning || response.benefit}</p>
              </div>
            )}
            {response.blockingTimeMs !== undefined && (
              <div>
                <p><strong>Blocking Time:</strong> {response.blockingTimeMs}ms</p>
                <p><strong>Non-Blocking Time:</strong> {response.nonBlockingTimeMs}ms</p>
                <p><strong>Difference:</strong> {(response.blockingTimeMs - response.nonBlockingTimeMs).toFixed(0)}ms</p>
              </div>
            )}
            <pre style={{
              backgroundColor: '#2c3e50',
              color: '#ecf0f1',
              padding: '15px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
              marginTop: '15px'
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
                <span style={{ fontWeight: 'bold' }}>{item.time.toLocaleTimeString()}</span> - <code>{item.endpoint.split('?')[0]}</code>
              </div>
            ))}
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
          <h2>📚 Blocking vs Non-Blocking</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#fadbd8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>❌ Blocking (Synchronous)</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Event loop waits for operation</li>
                <li>Other requests delayed</li>
                <li>Simple code</li>
                <li>Predictable but slow</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#d5f4e6', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #27ae60' }}>
              <strong>✅ Non-Blocking (Asynchronous)</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Event loop continues</li>
                <li>Other requests processed</li>
                <li>Complex code flow</li>
                <li>Better performance</li>
              </ul>
            </div>
          </div>
          <div>
            <h4>Key Takeaways:</h4>
            <ul>
              <li><strong>fs.readFileSync():</strong> Blocks event loop - never use in servers</li>
              <li><strong>fs.readFile():</strong> Non-blocking with callback</li>
              <li><strong>await fs.promises.readFile():</strong> Non-blocking with async/await</li>
              <li><strong>setImmediate():</strong> Breaks up CPU-intensive work into chunks</li>
              <li><strong>Worker Threads:</strong> Offload heavy computation to other threads</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
