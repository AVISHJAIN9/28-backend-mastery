import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3008';
  
  const TESTS = [
    { id: 'global', label: '🌍 Global Accumulation', path: '/api/memory-leaks/global-accumulation' },
    { id: 'listeners', label: '👂 Event Listeners', path: '/api/memory-leaks/event-listeners?count=5' },
    { id: 'promises', label: '⚠️ Promise Leak', path: '/api/memory-leaks/unhandled-promises' },
    { id: 'timers', label: '⏱️ Timer Leaks', path: '/api/memory-leaks/timer-leaks' },
    { id: 'closure', label: '📦 Closure Leak', path: '/api/memory-leaks/closure-leak' },
    { id: 'fixed', label: '✅ Fixed Pattern', path: '/api/memory-leaks/fixed-pattern' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>💧 08: Memory Leaks</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Identify and fix common Node.js memory leak patterns
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
            <p>Analyzing memory...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.pattern && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Pattern:</strong> {response.pattern}</p>
                {response.allocatedMB !== undefined && (
                  <p><strong>Memory Allocated:</strong> {response.allocatedMB} MB</p>
                )}
                {response.itemsHeld !== undefined && (
                  <p><strong>Items Held:</strong> {response.itemsHeld}</p>
                )}
              </div>
            )}
            {response.analysis && (
              <div style={{ marginBottom: '15px', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #ffc107' }}>
                <strong>Analysis:</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>{response.analysis}</p>
              </div>
            )}
            {response.solution && (
              <div style={{ marginBottom: '15px', backgroundColor: '#d4edda', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #28a745' }}>
                <strong>Solution:</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>{response.solution}</p>
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
          <h2>📚 Common Memory Leak Patterns</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>Global Accumulation</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Unbounded global objects</li>
                <li>Never cleaning append-only lists</li>
                <li>Retain references indefinitely</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e67e22' }}>
              <strong>Event Listeners</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Not removing listeners</li>
                <li>Multiple registrations</li>
                <li>Accumulate over time</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>Unhandled Promises</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Silent promise rejections</li>
                <li>Dangling async operations</li>
                <li>Resource holders never freed</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>Timer References</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>setInterval not cleared</li>
                <li>setTimeout holding references</li>
                <li>Callbacks close over scope</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>Closures</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Outer scope references</li>
                <li>Unintended captures</li>
                <li>Chain of scopes held</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #27ae60' }}>
              <strong>Best Practices</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>removeListener on cleanup</li>
                <li>clearInterval/setTimeout</li>
                <li>Set refs to null</li>
              </ul>
            </div>
          </div>
          <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginTop: '15px' }}>
            <strong>🛠️ Detection:</strong> Use --inspect flag with Chrome DevTools Memory tab to track heap snapshots and find growing nodes.
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

