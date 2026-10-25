import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3014';
  
  const TESTS = [
    { id: 'readSync', label: '🔒 Read Sync', path: '/api/fs/read-sync' },
    { id: 'readCallback', label: '📞 Read Callback', path: '/api/fs/read-callback' },
    { id: 'readPromise', label: '✅ Read Promise', path: '/api/fs/read-promise' },
    { id: 'writeSync', label: '✍️ Write Sync', path: '/api/fs/write-sync' },
    { id: 'streams', label: '💧 Streams', path: '/api/fs/streams' },
    { id: 'watch', label: '👁️ File Watch', path: '/api/fs/watch' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>📁 14: Filesystem APIs</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Sync, callback, promises, streams, file operations
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
            <p>Reading file...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.method && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Method:</strong> {response.method}</p>
                {response.duration !== undefined && (
                  <p><strong>Duration:</strong> {response.duration}ms</p>
                )}
                {response.bytes !== undefined && (
                  <p><strong>Bytes:</strong> {response.bytes}</p>
                )}
              </div>
            )}
            {response.content && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Content:</h4>
                <pre style={{ backgroundColor: '#2c3e50', color: '#ecf0f1', padding: '10px', borderRadius: '4px', fontSize: '11px', overflow: 'auto', maxHeight: '150px' }}>
                  {response.content}
                </pre>
              </div>
            )}
            {response.stats && (
              <div style={{ marginBottom: '15px', backgroundColor: '#d4edda', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #28a745' }}>
                <strong>File Stats:</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>{JSON.stringify(response.stats)}</p>
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
          <h2>📚 Filesystem API Patterns</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <strong>Synchronous</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>fs.readFileSync()</li>
                <li>Blocks event loop</li>
                <li>Simple for small files</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>Callback (Async)</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>fs.readFile()</li>
                <li>Callback pattern</li>
                <li>Non-blocking</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>Promises</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>fs.promises.readFile()</li>
                <li>Await-friendly</li>
                <li>Cleaner error handling</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>Streams</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>fs.createReadStream()</li>
                <li>Memory efficient</li>
                <li>Chunk processing</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #f39c12' }}>
              <strong>File Stats</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>fs.stat()</li>
                <li>fs.statSync()</li>
                <li>Metadata & permissions</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #27ae60' }}>
              <strong>Watching Files</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>fs.watch()</li>
                <li>fs.watchFile()</li>
                <li>Change detection</li>
              </ul>
            </div>
          </div>
          <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px' }}>
            <strong>💡 Recommendation:</strong> Use fs.promises or streams. Avoid sync operations in production except initialization.
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

        <p>Master synchronous, callback, promise-based, and streaming file operations</p>
      </header>

      <nav className="nav">
        <div className="nav-section">
          <h3>Reading Patterns</h3>
          {['readSync', 'readCallback', 'readPromise'].map((key) => (
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
          <h3>Writing Patterns</h3>
          {['writeSync', 'writeCallback', 'writeStream'].map((key) => (
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
          <h3>Advanced Operations</h3>
          {['dirOps', 'fileStats', 'watchFile', 'streamPerf', 'backpressure', 'largeFile'].map((key) => (
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
        {/* Pattern Comparison */}
        <section className="comparison-section">
          <h2>File Operation Patterns</h2>
          <div className="comparison-table">
            <div className="comparison-row header">
              <div className="comp-cell">Pattern</div>
              <div className="comp-cell">Use Case</div>
              <div className="comp-cell">Performance</div>
              <div className="comp-cell">Async</div>
            </div>
            <div className="comparison-row">
              <div className="comp-cell">Synchronous</div>
              <div className="comp-cell">Startup, initialization</div>
              <div className="comp-cell">Blocks thread</div>
              <div className="comp-cell">❌</div>
            </div>
            <div className="comparison-row">
              <div className="comp-cell">Callback</div>
              <div className="comp-cell">Small-medium files</div>
              <div className="comp-cell">Good</div>
              <div className="comp-cell">✅</div>
            </div>
            <div className="comparison-row">
              <div className="comp-cell">Promises</div>
              <div className="comp-cell">Async chains</div>
              <div className="comp-cell">Good</div>
              <div className="comp-cell">✅</div>
            </div>
            <div className="comparison-row">
              <div className="comp-cell">Streams</div>
              <div className="comp-cell">Large files</div>
              <div className="comp-cell">Excellent</div>
              <div className="comp-cell">✅</div>
            </div>
          </div>
        </section>

        {/* Response Display */}
        <section className="response-section">
          <h2>{activeTest ? `${TESTS[activeTest]} Results` : 'Select a filesystem operation to test'}</h2>

          {loading && <div className="loading">Loading...</div>}

          {response && (
            <div className="response-box">
              {/* Code Example */}
              {response.code && (
                <div className="code-section">
                  <h3>📝 Code Example:</h3>
                  <pre className="code-block">{response.code}</pre>
                </div>
              )}

              {/* File Content */}
              {response.content && (
                <div className="content-section">
                  <h3>📄 File Content:</h3>
                  <pre className="content-block">{response.content}</pre>
                </div>
              )}

              {/* File Stats */}
              {response.stats && (
                <div className="stats-section">
                  <h3>📊 File Stats:</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <strong>Size:</strong> {response.stats.size} bytes
                    </div>
                    <div className="stat-item">
                      <strong>Type:</strong> {response.stats.isFile ? 'File' : 'Directory'}
                    </div>
                    <div className="stat-item">
                      <strong>Mode:</strong> {response.stats.mode}
                    </div>
                    <div className="stat-item">
                      <strong>Modified:</strong> {response.stats.mtime}
                    </div>
                  </div>
                </div>
              )}

              {/* Files List */}
              {response.files && (
                <div className="files-section">
                  <h3>📁 Files:</h3>
                  <ul>
                    {response.files.map((file, idx) => (
                      <li key={idx}>{file}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benchmark Results */}
              {response.benchmark && (
                <div className="benchmark-section">
                  <h3>⏱️ Performance Benchmark:</h3>
                  <div className="benchmark-results">
                    {Object.entries(response.benchmark).map(([key, value]) => (
                      <div key={key} className="benchmark-item">
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

              {/* Stream Events */}
              {response.events && (
                <div className="events-section">
                  <h3>🎯 Stream Events:</h3>
                  <ul>
                    {response.events.map((event, idx) => (
                      <li key={idx}>{event}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Operations */}
              {response.operations && (
                <div className="operations-section">
                  <h3>✅ Operations Completed:</h3>
                  <ul>
                    {response.operations.map((op, idx) => (
                      <li key={idx}>{op}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Explanation */}
              {response.explanation && (
                <div className="explanation-section">
                  <h3>💡 Explanation:</h3>
                  <p>{response.explanation}</p>
                </div>
              )}

              {/* Error */}
              {response.error && <div className="error">❌ {response.error}</div>}

              {/* Generic JSON fallback */}
              {!response.code &&
                !response.content &&
                !response.stats &&
                !response.files &&
                !response.error && (
                  <pre className="json-fallback">{JSON.stringify(response, null, 2)}</pre>
                )}
            </div>
          )}
        </section>

        {/* History */}
        {history.length > 0 && (
          <section className="history-section">
            <h2>Recent Operations ({history.length})</h2>
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
          <h2>📚 Filesystem Internals</h2>

          <div className="theory-card">
            <h3>Synchronous Operations</h3>
            <p>
              Blocking operations that complete before returning. Use only at startup/initialization.
              Never in request handlers - blocks all other requests!
            </p>
          </div>

          <div className="theory-card">
            <h3>Callback Pattern</h3>
            <p>
              Traditional Node.js pattern. Non-blocking. Most Node.js code uses this pattern. Error
              is first parameter (error-first callback convention).
            </p>
          </div>

          <div className="theory-card">
            <h3>Promise Pattern</h3>
            <p>
              Modern async pattern. Use `fs/promises` or wrap callbacks. Better error handling with
              `.catch()` or try/catch blocks.
            </p>
          </div>

          <div className="theory-card">
            <h3>Streaming Pattern</h3>
            <p>
              Best for large files. Reads/writes in chunks. Prevents loading entire file into memory.
              Combines backpressure handling for proper flow control.
            </p>
          </div>

          <div className="theory-card">
            <h3>Backpressure Handling</h3>
            <p>
              When write is slow, pause read to prevent memory buildup. Stream.write() returns false
              when backpressure needed. Resume on 'drain' event.
            </p>
          </div>

          <div className="theory-card">
            <h3>Best Practices</h3>
            <ul>
              <li>Use streams for files &gt; 10MB</li>
              <li>Always handle errors in callbacks</li>
              <li>Validate file paths to prevent traversal attacks</li>
              <li>Use highWaterMark to tune performance</li>
              <li>Close streams explicitly or use pipeline()</li>
              <li>Check file permissions before operations</li>
              <li>Use watch for config file changes, not production polling</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Backend API on port {3000 + 14} | File System Internals | Node.js Performance</p>
      </footer>
    </div>
  );
};

export default App;
