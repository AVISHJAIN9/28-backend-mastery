import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3010';
  
  const TESTS = [
    { id: 'info', label: '📊 Cluster Info', path: '/api/cluster/info' },
    { id: 'workers', label: '👷 Workers', path: '/api/cluster/workers' },
    { id: 'load', label: '⚖️ Load Distribution', path: '/api/cluster/load-distribution' },
    { id: 'restart', label: '🔄 Restart Worker', path: '/api/cluster/restart-worker?workerId=1' },
    { id: 'cpu', label: '💻 CPU Count', path: '/api/cluster/cpu-count' },
    { id: 'message', label: '💬 IPC Message', path: '/api/cluster/send-message' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>🔗 10: Cluster Module</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Master-worker pattern, utilize all CPU cores, load balancing
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
            <p>Fetching cluster data...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.isMaster !== undefined && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Is Master:</strong> {response.isMaster ? '✅ Yes' : '❌ No'}</p>
                {response.cpuCount !== undefined && (
                  <p><strong>CPU Cores:</strong> {response.cpuCount}</p>
                )}
                {response.workerCount !== undefined && (
                  <p><strong>Worker Processes:</strong> {response.workerCount}</p>
                )}
                {response.pid !== undefined && (
                  <p><strong>Process ID:</strong> {response.pid}</p>
                )}
              </div>
            )}
            {response.workers && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Active Workers:</h4>
                {response.workers.map((worker, idx) => (
                  <div key={idx} style={{ backgroundColor: '#d5f4e6', padding: '10px', borderRadius: '4px', marginBottom: '8px', fontSize: '12px' }}>
                    <strong>Worker {worker.id}:</strong> PID {worker.pid} - {worker.state}
                  </div>
                ))}
              </div>
            )}
            {response.loads && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Request Distribution:</h4>
                {response.loads.map((load, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '10px' }}>
                    <strong style={{ width: '80px' }}>Worker {idx}:</strong>
                    <div style={{ flex: 1, backgroundColor: '#ecf0f1', borderRadius: '4px', height: '20px', position: 'relative' }}>
                      <div style={{
                        width: `${(load / Math.max(...response.loads)) * 100}%`,
                        height: '100%',
                        backgroundColor: '#3498db',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white'
                      }}>
                        {load}
                      </div>
                    </div>
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
          <h2>📚 Cluster Architecture</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>Master Process</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Forks worker processes</li>
                <li>Listens on shared port</li>
                <li>Distributes connections</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>Worker Processes</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>One per CPU core</li>
                <li>Independent V8 instances</li>
                <li>Shares port via IPC</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>Load Balancing</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Round-robin distribution</li>
                <li>OS typically handles</li>
                <li>Even request spreading</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>Worker Restart</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Zero-downtime reload</li>
                <li>Graceful shutdown</li>
                <li>Replace with new worker</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #f39c12' }}>
              <strong>IPC Communication</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>worker.send()</li>
                <li>worker.on('message')</li>
                <li>Pass any serializable data</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #27ae60' }}>
              <strong>Benefits</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Full CPU utilization</li>
                <li>Fault tolerance</li>
                <li>Load distribution</li>
              </ul>
            </div>
          </div>
          <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px' }}>
            <strong>⚠️ Note:</strong> Cluster is process-based, not thread-based. Each worker has separate memory, use message passing for shared state.
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

