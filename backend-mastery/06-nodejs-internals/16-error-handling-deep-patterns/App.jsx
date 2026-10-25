import React, { useState, useCallback } from 'react';

const App = () => {
  const [activeTest, setActiveTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3016';
  
  const TESTS = [
    { id: 'types', label: '🔴 Error Types', path: '/api/errors/types' },
    { id: 'custom', label: '🎯 Custom Error', path: '/api/errors/custom' },
    { id: 'tryCatch', label: '🛑 Try/Catch', path: '/api/errors/try-catch' },
    { id: 'async', label: '⚠️ Async Errors', path: '/api/errors/async' },
    { id: 'rejection', label: '❌ Rejections', path: '/api/errors/unhandled-rejection' },
    { id: 'stack', label: '📍 Stack Trace', path: '/api/errors/stack-trace' },
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
        <h1 style={{ margin: '0 0 10px 0' }}>🔥 16: Error Handling</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Error types, custom errors, try/catch, async error handling, stack traces
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
            <p>Testing...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.type && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Error Type:</strong> {response.type}</p>
                {response.message && <p><strong>Message:</strong> {response.message}</p>}
              </div>
            )}
            {response.description && (
              <div style={{ marginBottom: '15px', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #ffc107' }}>
                <p style={{ margin: '0', fontSize: '13px' }}>{response.description}</p>
              </div>
            )}
            {response.stack && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Stack Trace:</h4>
                <pre style={{ backgroundColor: '#2c3e50', color: '#ecf0f1', padding: '10px', borderRadius: '4px', fontSize: '11px', overflow: 'auto', maxHeight: '150px' }}>
                  {response.stack}
                </pre>
              </div>
            )}
            {response.example && (
              <div style={{ marginBottom: '15px', backgroundColor: '#ecf0f1', padding: '10px', borderRadius: '4px' }}>
                <h4>Example:</h4>
                <pre style={{ margin: '8px 0 0 0', fontSize: '11px', overflow: 'auto', maxHeight: '120px', backgroundColor: '#fff', padding: '8px' }}>
                  {response.example}
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
          <h2>📚 Error Handling Patterns</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>Error Types</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>TypeError - wrong type</li>
                <li>ReferenceError - undefined</li>
                <li>SyntaxError - parse time</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e67e22' }}>
              <strong>Try/Catch/Finally</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Catch synchronous errors</li>
                <li>Finally always runs</li>
                <li>Cleanup operations</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>Async Errors</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Await catch rejections</li>
                <li>Promise.catch()</li>
                <li>.then(null, err)</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>Custom Errors</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Extend Error class</li>
                <li>Named for specificity</li>
                <li>Better debugging</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #c0392b' }}>
              <strong>Unhandled Rejections</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Promise not caught</li>
                <li>Better logging needed</li>
                <li>Exit process safely</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #8e44ad' }}>
              <strong>Stack Traces</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>error.stack property</li>
                <li>Shows call sequence</li>
                <li>Debugging source</li>
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

  const API_BASE = 'http://localhost:3016';
  
  const TESTS = [
    { id: 'types', label: '🔴 Error Types', path: '/api/errors/types' },
    { id: 'custom', label: '🎯 Custom Error', path: '/api/errors/custom' },
    { id: 'tryCatch', label: '🛑 Try/Catch', path: '/api/errors/try-catch' },
    { id: 'async', label: '⚠️ Async Errors', path: '/api/errors/async' },
    { id: 'rejection', label: '❌ Rejections', path: '/api/errors/unhandled-rejection' },
    { id: 'stack', label: '📍 Stack Trace', path: '/api/errors/stack-trace' },
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

  const handleTestClick = (test) => {
    const foundTest = TESTS.find(t => t.id === test);
    if (foundTest) handleTest(foundTest);
  };

  const handleTest = (test) => {
    setActiveTest(test.id);
    callEndpoint(test.path);
  };

  const handleReset = async () => {
    await fetch(`${API_BASE}/api/errors/reset`, { method: 'POST' }).catch(() => {});
    setResponse(null);
    setActiveTest(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ backgroundColor: '#2c3e50', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>🔥 16: Error Handling</h1>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Error types, custom errors, try/catch, async error handling, stack traces
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
            <p>Testing...</p>
          </div>
        )}

        {response && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
            <h3>📋 Response</h3>
            {response.type && (
              <div style={{ backgroundColor: '#ecf0f1', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <p><strong>Error Type:</strong> {response.type}</p>
                {response.message && <p><strong>Message:</strong> {response.message}</p>}
              </div>
            )}
            {response.description && (
              <div style={{ marginBottom: '15px', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #ffc107' }}>
                <p style={{ margin: '0', fontSize: '13px' }}>{response.description}</p>
              </div>
            )}
            {response.stack && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Stack Trace:</h4>
                <pre style={{ backgroundColor: '#2c3e50', color: '#ecf0f1', padding: '10px', borderRadius: '4px', fontSize: '11px', overflow: 'auto', maxHeight: '150px' }}>
                  {response.stack}
                </pre>
              </div>
            )}
            {response.example && (
              <div style={{ marginBottom: '15px', backgroundColor: '#ecf0f1', padding: '10px', borderRadius: '4px' }}>
                <h4>Example:</h4>
                <pre style={{ margin: '8px 0 0 0', fontSize: '11px', overflow: 'auto', maxHeight: '120px', backgroundColor: '#fff', padding: '8px' }}>
                  {response.example}
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
          <h2>📚 Error Handling Patterns</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e74c3c' }}>
              <strong>Error Types</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>TypeError - wrong type</li>
                <li>ReferenceError - undefined</li>
                <li>SyntaxError - parse time</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #e67e22' }}>
              <strong>Try/Catch/Finally</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Catch synchronous errors</li>
                <li>Finally always runs</li>
                <li>Cleanup operations</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #9b59b6' }}>
              <strong>Async Errors</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Await catch rejections</li>
                <li>Promise.catch()</li>
                <li>.then(null, err)</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #1abc9c' }}>
              <strong>Custom Errors</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Extend Error class</li>
                <li>Named for specificity</li>
                <li>Better debugging</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #c0392b' }}>
              <strong>Unhandled Rejections</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Promise not caught</li>
                <li>Better logging needed</li>
                <li>Exit process safely</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#ffe8e8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #8e44ad' }}>
              <strong>Stack Traces</strong>
              <ul style={{ fontSize: '13px', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>error.stack property</li>
                <li>Shows call sequence</li>
                <li>Debugging source</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

        {/* Response Display */}
        <section className="response-section">
          <h2>{activeTest ? `${TESTS[activeTest]} Results` : 'Select an error pattern to explore'}</h2>

          {loading && <div className="loading">Loading...</div>}

          {response && (
            <div className="response-box">
              {/* Error Examples */}
              {response.examples && (
                <div className="examples-section">
                  <h3>📋 Examples:</h3>
                  <div className="examples-list">
                    {response.examples.map((example, idx) => (
                      <div key={idx} className="example-item">
                        <div className="example-type">{example.type}</div>
                        <div className="example-message">{example.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Information */}
              {response.errorInfo && (
                <div className="error-info-section">
                  <h3>📊 Error Information:</h3>
                  <div className="error-info">
                    {Object.entries(response.errorInfo).map(([key, value]) => (
                      <div key={key} className="error-info-item">
                        <strong>{key}:</strong>
                        {typeof value === 'object' ? (
                          <pre>{JSON.stringify(value, null, 2)}</pre>
                        ) : (
                          <span>{String(value)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {response.stackTrace && (
                <div className="stack-trace-section">
                  <h3>📍 Stack Trace:</h3>
                  <pre className="stack-trace">{response.stackTrace}</pre>
                </div>
              )}

              {/* Pattern Demonstration */}
              {response.pattern && (
                <div className="pattern-section">
                  <h3>🏗️ Pattern Demonstration:</h3>
                  <div className="pattern-steps">
                    {response.pattern.map((step, idx) => (
                      <div key={idx} className="pattern-step">
                        <div className="step-number">{idx + 1}</div>
                        <div className="step-content">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Example */}
              {response.code && (
                <div className="code-section">
                  <h3>📝 Code Example:</h3>
                  <pre className="code-block">{response.code}</pre>
                </div>
              )}

              {/* Results */}
              {response.results && (
                <div className="results-section">
                  <h3>✅ Execution Results:</h3>
                  <ul className="results-list">
                    {response.results.map((result, idx) => (
                      <li key={idx}>{result}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Best Practices */}
              {response.bestPractices && (
                <div className="best-practices-section">
                  <h3>💡 Best Practices:</h3>
                  <ul>
                    {response.bestPractices.map((practice, idx) => (
                      <li key={idx}>{practice}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Explanation */}
              {response.explanation && (
                <div className="explanation-section">
                  <h3>🎓 Explanation:</h3>
                  <p>{response.explanation}</p>
                </div>
              )}

              {/* Error */}
              {response.error && <div className="error">❌ {response.error}</div>}

              {/* Generic JSON fallback */}
              {!response.examples &&
                !response.errorInfo &&
                !response.code &&
                !response.error && (
                  <pre className="json-fallback">{JSON.stringify(response, null, 2)}</pre>
                )}
            </div>
          )}
        </section>

        {/* History */}
        {history.length > 0 && (
          <section className="history-section">
            <h2>Recent Tests ({history.length})</h2>
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
          <h2>📚 Error Handling Theory</h2>

          <div className="theory-card">
            <h3>Error Types</h3>
            <p>
              JavaScript has built-in error types: Error, TypeError, ReferenceError, SyntaxError,
              RangeError, EvalError, and URIError. Each represents different kinds of problems.
            </p>
          </div>

          <div className="theory-card">
            <h3>Custom Error Classes</h3>
            <p>
              Extend the Error class to create domain-specific errors with additional properties.
              This makes error handling more precise and testable in production code.
            </p>
          </div>

          <div className="theory-card">
            <h3>Callback Pattern</h3>
            <p>
              Node.js uses error-first callbacks where the error parameter comes first. Check it
              immediately and return early if an error exists.
            </p>
          </div>

          <div className="theory-card">
            <h3>Promise Error Handling</h3>
            <p>
              Promises use .catch() to handle errors. Errors in the chain automatically propagate
              to the next .catch() block.
            </p>
          </div>

          <div className="theory-card">
            <h3>Async/Await</h3>
            <p>
              Async functions return promises. Use try/catch blocks for error handling, which is
              cleaner and more synchronous-looking than callback or promise chains.
            </p>
          </div>

          <div className="theory-card">
            <h3>Production Best Practices</h3>
            <ul>
              <li>Always handle errors - don't ignore them</li>
              <li>Use custom error classes for specific error types</li>
              <li>Log detailed error information for debugging</li>
              <li>Send errors to monitoring services (Sentry, DataDog)</li>
              <li>Never expose stack traces to clients in production</li>
              <li>Implement global error handlers for uncaught errors</li>
              <li>Distinguish operational errors from programming errors</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Backend API on port {3000 + 16} | Error Handling Internals | Node.js Best Practices</p>
      </footer>
    </div>
  );
};

export default App;
