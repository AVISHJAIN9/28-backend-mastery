import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3017';
  
  const TESTS = [
    { id: 'heap', label: '💾 Heap Stats', path: '/api/gc/heap-stats' },
    { id: 'gc', label: '🔄 GC Behavior', path: '/api/gc/behavior' },
    { id: 'memory', label: '📊 Memory Usage', path: '/api/gc/memory-usage' },
    { id: 'objects', label: '📦 Object Allocation', path: '/api/gc/allocation' },
    { id: 'weak', label: '🔗 WeakMap/Set', path: '/api/gc/weak-references' },
    { id: 'leak', label: '💧 Memory Leak', path: '/api/gc/leak-detection' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>♻️ 17: V8 Garbage Collection</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Heap memory, GC strategies, profiling, memory optimization
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
            <p>Profiling...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.totalHeapSize !== undefined && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Total Heap:</strong> {Math.round(response.totalHeapSize / 1024 / 1024)}MB</p>
                {response.heapUsed !== undefined && (
                  <p><strong>Heap Used:</strong> {Math.round(response.heapUsed / 1024 / 1024)}MB</p>
                )}
                {response.gcTime !== undefined && (
                  <p><strong>GC Time:</strong> {response.gcTime}ms</p>
                )}
              </div>
            )}
            {response.description && (
              <div style={{ marginBottom: '15px', backgroundColor: '#d4edda', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #28a745' }}>
                <p style={{ margin: '0', fontSize: '13px' }}>{response.description}</p>
              </div>
            )}
            {response.stats && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Memory Stats:</h4>
                <div style={{ backgroundColor: '#ecf0f1', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                  {Object.entries(response.stats).map(([key, val]) => (
                    <div key={key} style={{ marginBottom: '6px' }}>
                      <strong>{key}:</strong> {typeof val === 'number' ? Math.round(val / 1024 / 1024) + 'MB' : val}
                    </div>
                  ))}
                </div>
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
          <h2>📚 V8 GC Concepts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>Generational GC</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Young generation - GC often</li>
                <li>Old generation - sparse</li>
                <li>Most objects die young</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>Scavenging (Minor GC)</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Fast collection</li>
                <li>Young objects only</li>
                <li>Frequent collections</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>Mark-Sweep (Major GC)</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>All heap scanned</li>
                <li>Slower collection</li>
                <li>Full cleanup</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>Heap Snapshots</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Point-in-time memory</li>
                <li>Find leaks visually</li>
                <li>Chrome DevTools</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #f39c12' }}>
              <strong>WeakMap & WeakSet</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Keys/values not held</li>
                <li>GC can remove entries</li>
                <li>Perfect for caches</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #27ae60' }}>
              <strong>Profiling Tools</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>--inspect, --prof flags</li>
                <li>Chrome DevTools</li>
                <li>Node clinic tools</li>
              </ul>
            </div>
          </div>
          <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px' }}>
            <strong>💡 Optimization Tip:</strong> Most memory issues are not GC problems but leak patterns. Use heap snapshots to identify what's being held.
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
