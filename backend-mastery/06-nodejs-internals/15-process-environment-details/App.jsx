import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3015';
  
  const TESTS = [
    { id: 'info', label: '📊 Process Info', path: '/api/process/info' },
    { id: 'env', label: '🌍 Environment', path: '/api/process/environment' },
    { id: 'argv', label: '📝 Arguments', path: '/api/process/argv' },
    { id: 'memory', label: '💾 Memory', path: '/api/process/memory' },
    { id: 'uptime', label: '⏱️ Uptime', path: '/api/process/uptime' },
    { id: 'versions', label: '📦 Versions', path: '/api/process/versions' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>⚙️ 15: Process & Environment</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Node.js process object, environment variables, memory, argv, versions
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
            <p>Fetching...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.pid !== undefined && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Process ID:</strong> {response.pid}</p>
                {response.nodeVersion && <p><strong>Node Version:</strong> {response.nodeVersion}</p>}
                {response.platform && <p><strong>Platform:</strong> {response.platform}</p>}
                {response.arch && <p><strong>Architecture:</strong> {response.arch}</p>}
              </div>
            )}
            {response.heapUsed !== undefined && (
              <div style={{ marginBottom: '15px', backgroundColor: '#d5f4e6', padding: '10px', borderRadius: '4px' }}>
                <strong>Memory Usage:</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                  Heap Used: {Math.round(response.heapUsed / 1024 / 1024)}MB | Heap Total: {Math.round(response.heapTotal / 1024 / 1024)}MB
                </p>
              </div>
            )}
            {response.uptime !== undefined && (
              <div style={{ marginBottom: '15px', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px' }}>
                <strong>Uptime:</strong> {Math.floor(response.uptime)}s
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
          <h2>📚 Process Object Concepts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>process.pid</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Process identifier</li>
                <li>Unique per process</li>
                <li>Useful for logging</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>process.env</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Environment variables</li>
                <li>Set in OS or .env</li>
                <li>Configuration</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>process.argv</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Command line args</li>
                <li>argv[0] = node</li>
                <li>argv[1] = script</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>process.memoryUsage()</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Heap memory info</li>
                <li>Monitor leaks</li>
                <li>Performance tracking</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #f39c12' }}>
              <strong>process.versions</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Dependency versions</li>
                <li>Node, V8, npm</li>
                <li>Compatibility check</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #27ae60' }}>
              <strong>process.uptime()</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Seconds running</li>
                <li>Health indicator</li>
                <li>Restart detection</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3015';
  
  const TESTS = [
    { id: 'info', label: '📊 Process Info', path: '/api/process/info' },
    { id: 'env', label: '🌍 Environment', path: '/api/process/environment' },
    { id: 'argv', label: '📝 Arguments', path: '/api/process/argv' },
    { id: 'memory', label: '💾 Memory', path: '/api/process/memory' },
    { id: 'uptime', label: '⏱️ Uptime', path: '/api/process/uptime' },
    { id: 'versions', label: '📦 Versions', path: '/api/process/versions' },
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
          {['processInfo', 'envVars', 'argv', 'workingDir', 'versions'].map((key) => (
            <button
              key={key}
              className={`nav-button ${activeTest === key ? 'active' : ''}`}
              onClick={() => handleTestClick(key)}
              disabled={loading}
            >
              {TESTS[key]}
            </button>
          ))}
        </div>
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
            {response.pid !== undefined && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Process ID:</strong> {response.pid}</p>
                {response.nodeVersion && <p><strong>Node Version:</strong> {response.nodeVersion}</p>}
                {response.platform && <p><strong>Platform:</strong> {response.platform}</p>}
                {response.arch && <p><strong>Architecture:</strong> {response.arch}</p>}
              </div>
            )}
            {response.heapUsed !== undefined && (
              <div style={{ marginBottom: '15px', backgroundColor: '#d5f4e6', padding: '10px', borderRadius: '4px' }}>
                <strong>Memory Usage:</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                  Heap Used: {Math.round(response.heapUsed / 1024 / 1024)}MB | Heap Total: {Math.round(response.heapTotal / 1024 / 1024)}MB
                </p>
              </div>
            )}
            {response.uptime !== undefined && (
              <div style={{ marginBottom: '15px', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px' }}>
                <strong>Uptime:</strong> {Math.floor(response.uptime)}s
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
          <h2>📚 Process Object Concepts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>process.pid</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Process identifier</li>
                <li>Unique per process</li>
                <li>Useful for logging</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>process.env</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Environment variables</li>
                <li>Set in OS or .env</li>
                <li>Configuration</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>process.argv</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Command line args</li>
                <li>argv[0] = node</li>
                <li>argv[1] = script</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>process.memoryUsage()</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Heap memory info</li>
                <li>Monitor leaks</li>
                <li>Performance tracking</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #f39c12' }}>
              <strong>process.versions</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Dependency versions</li>
                <li>Node, V8, npm</li>
                <li>Compatibility check</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #27ae60' }}>
              <strong>process.uptime()</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Seconds running</li>
                <li>Health indicator</li>
                <li>Restart detection</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
          {['memory', 'systemResources', 'uptime', 'signalHandling'].map((key) => (
            <button
              key={key}
              className={`nav-button ${activeTest === key ? 'active' : ''}`}
              onClick={() => handleTestClick(key)}
              disabled={loading}
            >
              {TESTS[key]}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <h3>Controls</h3>
          <button className="nav-button reset" onClick={handleReset} disabled={loading}>
            🔄 Reset
          </button>
        </div>
      </nav>

      <main className="main">
        {/* Process Object Overview */}
        <section className="overview-section">
          <h2>Node.js process Object</h2>
          <div className="overview-cards">
            <div className="overview-card">
              <h4>process.env</h4>
              <p>Access environment variables set by the OS or .env files</p>
            </div>
            <div className="overview-card">
              <h4>process.argv</h4>
              <p>Command-line arguments passed to the script</p>
            </div>
            <div className="overview-card">
              <h4>process.pid</h4>
              <p>Unique identifier of the current process</p>
            </div>
            <div className="overview-card">
              <h4>process.memoryUsage()</h4>
              <p>Detailed breakdown of memory consumption</p>
            </div>
          </div>
        </section>

        {/* Response Display */}
        <section className="response-section">
          <h2>{activeTest ? `${TESTS[activeTest]} Results` : 'Select a property to explore'}</h2>

          {loading && <div className="loading">Loading...</div>}

          {response && (
            <div className="response-box">
              {/* Process Info */}
              {response.processInfo && (
                <div className="info-section">
                  <h3>📊 Process Information:</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>PID:</strong> {response.processInfo.pid}
                    </div>
                    <div className="info-item">
                      <strong>Platform:</strong> {response.processInfo.platform}
                    </div>
                    <div className="info-item">
                      <strong>Architecture:</strong> {response.processInfo.arch}
                    </div>
                    <div className="info-item">
                      <strong>Node Version:</strong> {response.processInfo.version}
                    </div>
                  </div>
                </div>
              )}

              {/* Environment Variables */}
              {response.env && (
                <div className="env-section">
                  <h3>🌍 Environment Variables:</h3>
                  <div className="env-vars">
                    {Object.entries(response.env).map(([key, value]) => (
                      <div key={key} className="env-item">
                        <code>{key}</code>
                        <span>=</span>
                        <code>{String(value).slice(0, 60)}{String(value).length > 60 ? '...' : ''}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory */}
              {response.memory && (
                <div className="memory-section">
                  <h3>💾 Memory Usage:</h3>
                  <div className="memory-bars">
                    {Object.entries(response.memory).map(([key, value]) => (
                      <div key={key} className="memory-item">
                        <label>{key}</label>
                        <div className="memory-bar">
                          <div className="memory-fill" style={{ width: `${Math.min((value / 1024 / 1024 / 100) * 10, 100)}%` }} />
                          <span>{Math.round(value / 1024 / 1024)}MB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Resources */}
              {response.system && (
                <div className="system-section">
                  <h3>⚙️ System Resources:</h3>
                  <div className="system-grid">
                    {Object.entries(response.system).map(([key, value]) => (
                      <div key={key} className="system-item">
                        <strong>{key}:</strong>
                        {typeof value === 'object' ? (
                          <pre>{JSON.stringify(value, null, 2)}</pre>
                        ) : (
                          <span>{value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uptime */}
              {response.uptime && (
                <div className="uptime-section">
                  <h3>⏱️ Process Uptime:</h3>
                  <div className="uptime-display">
                    <p>{response.uptime}</p>
                  </div>
                </div>
              )}

              {/* Versions */}
              {response.versions && (
                <div className="versions-section">
                  <h3>📦 Component Versions:</h3>
                  <div className="versions-grid">
                    {Object.entries(response.versions).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="version-item">
                        <strong>{key}:</strong> <code>{value}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {response.explanation && (
                <div className="explanation-section">
                  <h3>💡 Explanation:</h3>
                  <p>{response.explanation}</p>
                </div>
              )}

              {/* Code Example */}
              {response.code && (
                <div className="code-section">
                  <h3>📝 Code Example:</h3>
                  <pre className="code-block">{response.code}</pre>
                </div>
              )}

              {/* Error */}
              {response.error && <div className="error">❌ {response.error}</div>}

              {/* Generic JSON fallback */}
              {!response.processInfo &&
                !response.env &&
                !response.memory &&
                !response.system &&
                !response.error && (
                  <pre className="json-fallback">{JSON.stringify(response, null, 2)}</pre>
                )}
            </div>
          )}
        </section>

        {/* History */}
        {history.length > 0 && (
          <section className="history-section">
            <h2>Recent Queries ({history.length})</h2>
            <div className="history-list">
              {history.map((item, idx) => (
                <div key={idx} className="history-item">
                  <span className="history-time">{item.timestamp.toLocaleTimeString()}</span>
                  <span className="history-endpoint">{item.endpoint}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Theory Section */}
        <section className="theory-section">
          <h2>📚 Process & Environment Theory</h2>

          <div className="theory-card">
            <h3>The process Global Object</h3>
            <p>
              Node.js provides a global `process` object that gives access to information and
              control over the currently running Node.js process. It's available everywhere without
              requiring to use `require()`.
            </p>
          </div>

          <div className="theory-card">
            <h3>Environment Variables (process.env)</h3>
            <p>
              Environment variables are dynamic values that define system behavior. They're
              typically set in the operating system or loaded from `.env` files using packages
              like `dotenv`. Used for configuration, secrets, and feature flags.
            </p>
          </div>

          <div className="theory-card">
            <h3>Memory Management</h3>
            <p>
              `process.memoryUsage()` returns an object containing memory statistics: rss
              (resident set size), heapTotal, heapUsed, external, and arrayBuffers. Monitoring
              these helps detect memory leaks in production.
            </p>
          </div>

          <div className="theory-card">
            <h3>Process Signals</h3>
            <p>
              Signals are asynchronous notifications sent  to processes. SIGTERM (graceful
              shutdown), SIGINT (Ctrl+C), and SIGHUP are common. Handling them properly is
              essential for production applications.
            </p>
          </div>

          <div className="theory-card">
            <h3>Graceful Shutdown</h3>
            <p>
              Instead of abruptly terminating, applications should listen for SIGTERM,
              stop accepting new requests, complete in-flight requests, close database
              connections, and then exit cleanly.
            </p>
          </div>

          <div className="theory-card">
            <h3>Best Practices</h3>
            <ul>
              <li>Never hardcode secrets - use environment variables</li>
              <li>Validate required env vars at startup</li>
              <li>Monitor memory usage in production</li>
              <li>Implement graceful shutdown handlers</li>
              <li>Use process.exitCode instead of process.exit() when possible</li>
              <li>Check process.env.NODE_ENV for staging/production logic</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Backend API on port {3000 + 15} | Process Internals | Node.js Best Practices</p>
      </footer>
    </div>
  );
};

export default App;

export default App;
