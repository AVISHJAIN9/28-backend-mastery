import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3006';
  
  const TESTS = [
    { id: 'single', label: '1️⃣ Single Worker', path: '/api/workers/single?iterations=10000000' },
    { id: 'multi', label: '4️⃣ Multiple Workers', path: '/api/workers/multiple?tasks=4' },
    { id: 'pool', label: '🏊 Worker Pool', path: '/api/workers/pool' },
    { id: 'comm', label: '💬 Communication', path: '/api/workers/communication' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>🧵 06: Worker Threads</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Offload CPU-intensive work to separate threads without blocking the event loop
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
            <p>Computing... (may take a moment)</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.processingTimeMs && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Processing Time:</strong> {response.processingTimeMs}ms</p>
                <p><strong>Benefit:</strong> Event loop remains responsive while worker computes</p>
              </div>
            )}
            {response.totalTimeMs && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Total Time:</strong> {response.totalTimeMs}ms</p>
                <p><strong>Tasks:</strong> {response.tasksCount}</p>
                <p><strong>Completed:</strong> {response.completedTasks}</p>
              </div>
            )}
            {response.results && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Results:</h4>
                {response.results.map((result, idx) => (
                  <div key={idx} style={{ backgroundColor: '#d5f4e6', padding: '10px', borderRadius: '4px', marginBottom: '8px', fontSize: '12px' }}>
                    Task {result.taskId}: {result.result && result.result.toFixed(0)}
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
          <h2>📚 Worker Threads</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#fadbd8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>❌ Main Thread Only</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>CPU work blocks</li>
                <li>Event loop stalls</li>
                <li>Simple code</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#d5f4e6', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #27ae60' }}>
              <strong>✅ With Worker Threads</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Parallel execution</li>
                <li>Event loop responsive</li>
                <li>Complex setup</li>
              </ul>
            </div>
          </div>
          <div>
            <h4>Worker Thread Patterns:</h4>
            <ul>
              <li><strong>Single Worker:</strong> For one heavy task</li>
              <li><strong>Worker Pool:</strong> Reuse workers for multiple tasks (faster)</li>
              <li><strong>SharedArrayBuffer:</strong> Share memory between threads efficiently</li>
              <li><strong>Message Passing:</strong> Safe data exchange via postMessage()</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginTop: '15px' }}>
            <strong>💡 Best For:</strong> Cryptography, image processing, data analysis, heavy computations
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

