import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3007';
  
  const TESTS = [
    { id: 'spawn', label: '🚀 spawn()', path: '/api/child-process/spawn?command=ls' },
    { id: 'exec', label: '⚙️ exec()', path: '/api/child-process/exec?command=echo%20Hello' },
    { id: 'fork', label: '🍴 fork()', path: '/api/child-process/fork?count=2' },
    { id: 'pipe', label: '⛓️ Pipe', path: '/api/child-process/pipe' },
    { id: 'parallel', label: '⚡ Parallel', path: '/api/child-process/parallel' },
    { id: 'error', label: '❌ Error Handling', path: '/api/child-process/error' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>👨‍👧‍👦 07: Child Processes</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          spawn(), exec(), fork() - Launch separate processes and communicate
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
            <p>Executing...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.method && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Method:</strong> {response.method}</p>
                {response.command && <p><strong>Command:</strong> {response.command}</p>}
                {response.exitCode !== undefined && <p><strong>Exit Code:</strong> {response.exitCode}</p>}
              </div>
            )}
            {response.results && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Results:</h4>
                {response.results.map((result, idx) => (
                  <div key={idx} style={{ backgroundColor: '#d5f4e6', padding: '10px', borderRadius: '4px', marginBottom: '8px', fontSize: '12px' }}>
                    <strong>Process {result.processId}:</strong> {result.command}
                  </div>
                ))}
              </div>
            )}
            {response.output && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Output:</h4>
                <pre style={{ backgroundColor: '#2c3e50', color: '#ecf0f1', padding: '10px', borderRadius: '4px', fontSize: '11px', overflow: 'auto', maxHeight: '150px' }}>
                  {response.output}
                </pre>
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
          <h2>📚 Child Process Methods</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>spawn()</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Streams-based</li>
                <li>Handles large output</li>
                <li>Most control</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>exec()</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Shell commands</li>
                <li>Complete output</li>
                <li>Buffer limit</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>fork()</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Node.js only</li>
                <li>IPC messaging</li>
                <li>Separate V8</li>
              </ul>
            </div>
          </div>
          <div>
            <h4>Use Cases:</h4>
            <ul>
              <li><strong>spawn:</strong> Stream large files, pipes, incremental output</li>
              <li><strong>exec:</strong> Quick shell commands, small output</li>
              <li><strong>fork:</strong> Worker processes, long-running tasks, IPC</li>
            </ul>
          </div>
          <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginTop: '15px' }}>
            <strong>⚠️ Caution:</strong> All methods spawn NEW processes. Use worker-threads for lighter-weight concurrency.
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

