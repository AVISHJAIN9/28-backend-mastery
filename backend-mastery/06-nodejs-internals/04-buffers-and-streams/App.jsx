import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3004';
  
  const TESTS = [
    { id: 'buffers', label: '🔹 Buffer Operations', path: '/api/streams/buffers' },
    { id: 'readable', label: '📖 Readable Stream', path: '/api/streams/readable' },
    { id: 'writable', label: '✍️ Writable Stream', path: '/api/streams/writable' },
    { id: 'transform', label: '🔄 Transform Stream', path: '/api/streams/transform' },
    { id: 'pipeline', label: '⛓️ Pipeline', path: '/api/streams/pipeline' },
    { id: 'backpressure', label: '⚖️ Backpressure', path: '/api/streams/backpressure' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>📦 04: Buffers & Streams</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Work with binary data and memory-efficient data pipelines
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
            {response.title && <h4>{response.title}</h4>}
            {response.operations && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Operations:</h4>
                {response.operations.map((op, idx) => (
                  <div key={idx} style={{ backgroundColor: '#ecf0f1', padding: '10px', borderRadius: '4px', marginBottom: '8px', fontSize: '13px' }}>
                    <strong>{op.type}</strong>: {op.data}
                  </div>
                ))}
              </div>
            )}
            {response.memoryUsage && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Memory Usage:</h4>
                {Object.entries(response.memoryUsage).map(([key, val]) => (
                  <p key={key} style={{ margin: '5px 0' }}><code>{key}:</code> {val} bytes</p>
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
                <span style={{ fontWeight: 'bold' }}>{item.time.toLocaleTimeString()}</span> - <code>{item.endpoint.split('/').pop()}</code>
              </div>
            ))}
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
          <h2>📚 Understanding Streams & Buffers</h2>
          <div style={{ marginBottom: '20px' }}>
            <h4>Buffer Types:</h4>
            <ul>
              <li><code>Buffer.alloc(size)</code> - Allocate buffer, filled with zeros</li>
              <li><code>Buffer.allocUnsafe(size)</code> - Faster, uninitialized memory</li>
              <li><code>Buffer.from(data)</code> - Create from string/array</li>
              <li><code>Buffer.concat([buf1, buf2])</code> - Combine buffers</li>
            </ul>
          </div>
          <div>
            <h4>Stream Types:</h4>
            <ul>
              <li><strong>Readable:</strong> Read data (e.g., fs.createReadStream)</li>
              <li><strong>Writable:</strong> Write data (e.g., fs.createWriteStream)</li>
              <li><strong>Transform:</strong> Modify data (e.g., compression, encryption)</li>
              <li><strong>Duplex:</strong> Both readable and writable (e.g., sockets)</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginTop: '15px' }}>
            <strong>💡 Backpressure:</strong> When stream consumers can't keep up, producers should pause. Watch for <code>write()</code> returning false.
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

export default App;

