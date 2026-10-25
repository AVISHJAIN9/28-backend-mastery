import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3009';
  
  const TESTS = [
    { id: 'health', label: '❤️ Health Check', path: '/api/graceful/health' },
    { id: 'pending', label: '⏳ Pending Requests', path: '/api/graceful/pending-requests' },
    { id: 'connections', label: '🔌 Connections', path: '/api/graceful/connections' },
    { id: 'drain', label: '💧 Drain Queue', path: '/api/graceful/drain-queue' },
    { id: 'timeout', label: '⛔ Force Timeout', path: '/api/graceful/force-timeout?delay=3000' },
    { id: 'shutdown', label: '🛑 Shutdown Simulation', path: '/api/graceful/shutdown-simulation' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>🛑 09: Graceful Shutdown</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Handle SIGTERM, drain requests, close connections safely
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
            <p>Processing...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.status && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Status:</strong> {response.status}</p>
                {response.activeRequests !== undefined && (
                  <p><strong>Active Requests:</strong> {response.activeRequests}</p>
                )}
                {response.pendingConnections !== undefined && (
                  <p><strong>Pending Connections:</strong> {response.pendingConnections}</p>
                )}
                {response.queuedTasks !== undefined && (
                  <p><strong>Queued Tasks:</strong> {response.queuedTasks}</p>
                )}
              </div>
            )}
            {response.message && (
              <div style={{ marginBottom: '15px', backgroundColor: '#d4edda', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #28a745' }}>
                <strong>Message:</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>{response.message}</p>
              </div>
            )}
            {response.timeline && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Timeline:</h4>
                {response.timeline.map((event, idx) => (
                  <div key={idx} style={{ backgroundColor: '#d5f4e6', padding: '8px', borderRadius: '4px', marginBottom: '6px', fontSize: '12px' }}>
                    <strong>{event.phase}:</strong> {event.description}
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
          <h2>📚 Graceful Shutdown Pattern</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>1. Stop Accepting</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Stop listening for new connections</li>
                <li>Return 503 Service Unavailable</li>
                <li>Immediately with no delay</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>2. Drain Pending</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Wait for in-flight requests</li>
                <li>Set timeout (10-30s)</li>
                <li>Force close if timeout</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>3. Close Resources</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Database connections</li>
                <li>Message queues</li>
                <li>File handles</li>
              </ul>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '4px', marginBottom: '15px', borderLeft: '4px solid #ffc107' }}>
            <strong>Implementation:</strong>
            <pre style={{ margin: '10px 0 0 0', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', fontSize: '12px', overflow: 'auto' }}>
{`process.on('SIGTERM', async () => {
  server.close(async () => {
    // Drain pending, close resources
    process.exit(0);
  });
});`}
            </pre>
          </div>
          <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px' }}>
            <strong>⚠️ Signals:</strong> SIGTERM (deployments), SIGINT (Ctrl+C), SIGHUP (reload config)
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

