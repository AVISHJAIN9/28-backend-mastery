import React, { useState, useCallback } from 'react';
import './App.css';

/**
 * Debugging & Inspector
 * Interactive React Component for testing debugging features
 */

const App = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cpuIterations, setCpuIterations] = useState('100000000');
  const [slowDuration, setSlowDuration] = useState('2000');
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3020';

  const TABS = {
    info: 'Inspector Information',
    cpu: 'CPU Profiling',
    memory: 'Memory Usage',
    performance: 'Performance Metrics',
    breakpoint: 'Breakpoint Testing',
    slow: 'Slow Function Profiling',
    errors: 'Error Tracking',
    stats: 'Debug Statistics'
  };

  const callEndpoint = useCallback(async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      };
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await res.json();
      setResponse(data);
      setHistory((prev) => [...prev.slice(-9), { endpoint, timestamp: new Date(), method, data }]);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGetInfo = () => callEndpoint('/api/debug/inspector-info');
  const handleCPUProfile = () => callEndpoint('/api/debug/cpu-intensive', 'POST', { iterations: parseInt(cpuIterations) });
  const handleMemory = () => callEndpoint('/api/debug/memory-usage');
  const handlePerformance = () => callEndpoint('/api/debug/performance');
  const handleBreakpoint = () => callEndpoint('/api/debug/breakpoint-test', 'POST', { value: 75 });
  const handleSlowFunction = () => callEndpoint('/api/debug/slow-function', 'POST', { duration: parseInt(slowDuration) });
  const handleTriggerError = () => callEndpoint('/api/debug/trigger-error', 'POST', { errorType: 'reference' });
  const handleStats = () => callEndpoint('/api/debug/stats');

  return (
    <div className="container">
      <header className="header">
        <h1>🔍 Debugging & Inspector</h1>
        <p>Chrome DevTools integration, profiling, and performance analysis</p>
      </header>

      <div className="tab-container">
        <div className="tabs">
          {Object.entries(TABS).map(([key, label]) => (
            <button
              key={key}
              className={`tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'info' && (
            <div className="section">
              <h3>Inspector Configuration</h3>
              <p>Connect to Node.js via Chrome DevTools Protocol</p>
              <div className="instruction-box">
                <h4>How to Connect:</h4>
                <ol>
                  <li>Start Node with: <code>node --inspect server.js</code></li>
                  <li>Open Chrome DevTools: <code>chrome://inspect</code></li>
                  <li>Click "Inspect" on your Node process</li>
                </ol>
              </div>
              <button onClick={handleGetInfo} disabled={loading} className="btn-primary">
                Get Inspector Info
              </button>
            </div>
          )}

          {activeTab === 'cpu' && (
            <div className="section">
              <h3>CPU Profiling</h3>
              <p>Profile CPU-intensive tasks</p>
              <div className="input-group">
                <label>Iterations</label>
                <input
                  type="number"
                  value={cpuIterations}
                  onChange={(e) => setCpuIterations(e.target.value)}
                  min="1000000"
                  max="10000000000"
                />
              </div>
              <button onClick={handleCPUProfile} disabled={loading} className="btn-primary">
                Run CPU Profile
              </button>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="section">
              <h3>Memory Usage Analysis</h3>
              <p>Monitor heap and memory consumption</p>
              <button onClick={handleMemory} disabled={loading} className="btn-primary">
                Get Memory Usage
              </button>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="section">
              <h3>Performance Metrics</h3>
              <p>View CPU, memory, and uptime metrics</p>
              <button onClick={handlePerformance} disabled={loading} className="btn-primary">
                Get Performance Metrics
              </button>
            </div>
          )}

          {activeTab === 'breakpoint' && (
            <div className="section">
              <h3>Breakpoint Simulation</h3>
              <p>Test conditional breakpoints with value checking</p>
              <button onClick={handleBreakpoint} disabled={loading} className="btn-primary">
                Test Breakpoint (value=75)
              </button>
            </div>
          )}

          {activeTab === 'slow' && (
            <div className="section">
              <h3>Slow Function Profiling</h3>
              <p>Profile blocking operations to identify bottlenecks</p>
              <div className="input-group">
                <label>Duration (ms)</label>
                <input
                  type="number"
                  value={slowDuration}
                  onChange={(e) => setSlowDuration(e.target.value)}
                  min="100"
                  max="10000"
                />
              </div>
              <button onClick={handleSlowFunction} disabled={loading} className="btn-primary">
                Run Slow Function
              </button>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="section">
              <h3>Error Tracking</h3>
              <p>Trigger and track errors for debugging</p>
              <button onClick={handleTriggerError} disabled={loading} className="btn-primary">
                Trigger ReferenceError
              </button>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="section">
              <h3>Debug Statistics</h3>
              <p>View aggregated debugging information</p>
              <button onClick={handleStats} disabled={loading} className="btn-primary">
                Get Debug Stats
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className={`response ${response.error ? 'error' : 'success'}`}>
          <h4>{response.error ? '❌ Error' : '✅ Result'}</h4>
          
          {response.memory && (
            <div className="memory-display">
              <h5>Memory Usage:</h5>
              <div className="memory-grid">
                <div className="memory-item">
                  <strong>Heap Used</strong>
                  <div>{response.memory.heapUsed}</div>
                </div>
                <div className="memory-item">
                  <strong>Heap Total</strong>
                  <div>{response.memory.heapTotal}</div>
                </div>
                <div className="memory-item">
                  <strong>RSS</strong>
                  <div>{response.memory.rss}</div>
                </div>
                <div className="memory-item">
                  <strong>External</strong>
                  <div>{response.memory.external}</div>
                </div>
              </div>
            </div>
          )}

          {response.cpu && (
            <div className="cpu-display">
              <h5>CPU Usage (microseconds):</h5>
              <div className="cpu-grid">
                <div className="cpu-item">
                  <strong>User</strong>
                  <div>{response.cpu.user}</div>
                </div>
                <div className="cpu-item">
                  <strong>System</strong>
                  <div>{response.cpu.system}</div>
                </div>
              </div>
            </div>
          )}

          {response.inspectorUrl && (
            <div className="inspector-url">
              <h5>Inspector URL:</h5>
              <code>{response.inspectorUrl}</code>
            </div>
          )}

          {response.errors && (
            <div className="errors-list">
              <h5>Tracked Errors ({response.errors.length})</h5>
              {response.errors.map((err, idx) => (
                <div key={idx} className="error-item">
                  <strong>{err.type}:</strong> {err.message}
                </div>
              ))}
            </div>
          )}

          <pre className="response-json">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* Tools Guide */}
      <div className="tools-guide">
        <h4>🛠️ Debugging Tools</h4>
        <div className="tool-cards">
          <div className="tool-card">
            <h5>Chrome DevTools</h5>
            <p>Visual debugger, profiler, and memory inspector</p>
            <code>chrome://inspect</code>
          </div>
          <div className="tool-card">
            <h5>Node Inspector Flag</h5>
            <p>Enable remote debugging protocol</p>
            <code>--inspect or --inspect-brk</code>
          </div>
          <div className="tool-card">
            <h5>Profiler</h5>
            <p>CPU and memory profiling</p>
            <code>--prof, --prof-process</code>
          </div>
          <div className="tool-card">
            <h5>Flamegraph</h5>
            <p>Visualize function call times</p>
            <code>clinic.js</code>
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="history">
          <h4>📋 Request History</h4>
          <div className="history-items">
            {history.map((item, idx) => (
              <div key={idx} className="history-item">
                <small>{item.timestamp.toLocaleTimeString()}</small>
                <code>{item.method} {item.endpoint}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #eee;
          padding-bottom: 20px;
        }

        .header h1 {
          font-size: 2.5em;
          margin: 0;
          color: #333;
        }

        .header p {
          color: #666;
          margin: 10px 0 0;
        }

        .tab-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #eee;
          background: #f9f9f9;
          overflow-x: auto;
        }

        .tab {
          flex: 1;
          padding: 15px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 13px;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .tab:hover {
          background: #f0f0f0;
        }

        .tab.active {
          color: #0066cc;
          border-bottom-color: #0066cc;
          font-weight: 600;
        }

        .tab-content {
          padding: 30px;
        }

        .section {
          margin-bottom: 30px;
        }

        .section h3 {
          margin: 0 0 10px;
          color: #333;
        }

        .section p {
          color: #666;
          margin: 0 0 15px;
        }

        .instruction-box {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .instruction-box h4 {
          margin: 0 0 10px;
          color: #1976d2;
        }

        .instruction-box ol {
          margin: 0;
          padding-left: 20px;
        }

        .instruction-box code {
          background: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }

        .input-group {
          margin: 15px 0;
        }

        .input-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .input-group input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          width: 200px;
        }

        .btn-primary {
          padding: 10px 20px;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0052a3;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .response {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          border-left: 4px solid #4caf50;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .response.error {
          border-left-color: #f44336;
        }

        .response h4 {
          margin: 0 0 15px;
        }

        .memory-grid,
        .cpu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin: 15px 0;
        }

        .memory-item,
        .cpu-item {
          background: #f0f7ff;
          padding: 12px;
          border-radius: 4px;
          text-align: center;
        }

        .memory-item strong,
        .cpu-item strong {
          display: block;
          margin-bottom: 5px;
          color: #0066cc;
        }

        .inspector-url {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .inspector-url code {
          display: block;
          background: white;
          padding: 10px;
          border-radius: 3px;
          margin-top: 10px;
          overflow-x: auto;
          font-size: 12px;
        }

        .errors-list {
          background: #ffebee;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .error-item {
          padding: 8px 0;
          color: #c62828;
        }

        .response-json {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }

        .tools-guide {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .tools-guide h4 {
          margin: 0 0 20px;
        }

        .tool-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .tool-card {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          border-left: 4px solid #0066cc;
        }

        .tool-card h5 {
          margin: 0 0 8px;
          color: #333;
        }

        .tool-card p {
          color: #666;
          margin: 0 0 10px;
          font-size: 13px;
        }

        .tool-card code {
          background: white;
          padding: 6px 8px;
          border-radius: 3px;
          font-size: 12px;
          display: block;
        }

        .history {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .history h4 {
          margin: 0 0 15px;
        }

        .history-items {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .history-item {
          background: #f0f7ff;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
        }

        .history-item small {
          display: block;
          color: #999;
        }

        .history-item code {
          display: block;
          color: #0066cc;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default App;
