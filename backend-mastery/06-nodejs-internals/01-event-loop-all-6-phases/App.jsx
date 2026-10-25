import React, { useState, useCallback } from 'react';
import './App.css';

/**
 * Event Loop - All 6 Phases
 * Interactive React Component to visualize Node.js event loop phases
 */

const App = () => {
  const [activePhase, setActivePhase] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3001';
  const PHASES = {
    timers: 'Timers Phase (setTimeout, setInterval)',
    pending: 'Pending Callbacks & I/O Phase',
    poll: 'Poll Phase (Main I/O Waiting)',
    check: 'Check Phase (setImmediate)',
    close: 'Close Phase (Stream/Socket Close)',
    executionOrder: 'Execution Order Demonstration',
    lag: 'Event Loop Lag Detection',
    microVsMacro: 'Microtasks vs Macrotasks',
  };

  const callEndpoint = useCallback(
    async (endpoint) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}${endpoint}`);
        const data = await res.json();
        setResponse(data);
        setHistory((prev) => [...prev.slice(-9), { endpoint, timestamp: new Date(), data }]);
      } catch (error) {
        setResponse({ error: error.message });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handlePhaseClick = (phase) => {
    setActivePhase(phase);
    const endpoints = {
      timers: '/api/event-loop/timers',
      pending: '/api/event-loop/pending',
      poll: '/api/event-loop/poll',
      check: '/api/event-loop/check',
      close: '/api/event-loop/close',
      executionOrder: '/api/event-loop/execution-order',
      lag: '/api/event-loop/lag',
      microVsMacro: '/api/event-loop/micro-vs-macro',
    };
    callEndpoint(endpoints[phase]);
  };

  const handleReset = async () => {
    await fetch(`${API_BASE}/api/event-loop/reset`, { method: 'POST' });
    setResponse(null);
    setActivePhase(null);
  };

  const handleMetrics = async () => {
    await callEndpoint('/api/event-loop/metrics');
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🔄 Node.js Event Loop - All 6 Phases</h1>
        <p>Interactive visualization of the Node.js event loop phases and execution order</p>
      </header>

      <nav className="nav">
        <div className="nav-section">
          <h3>Event Loop Phases</h3>
          {Object.entries(PHASES).map(([key, label]) => (
            <button
              key={key}
              className={`nav-button ${activePhase === key ? 'active' : ''}`}
              onClick={() => handlePhaseClick(key)}
              disabled={loading}>
              {label}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <h3>Controls</h3>
          <button className="nav-button" onClick={handleMetrics} disabled={loading}>
            📊 Metrics
          </button>
          <button className="nav-button reset" onClick={handleReset} disabled={loading}>
            🔄 Reset
          </button>
        </div>
      </nav>

      <main className="main">
        {/* Phase Diagram */}
        <section className="phase-diagram">
          <h2>Event Loop Phase Sequence</h2>
          <div className="phases-container">
            <div className={`phase ${activePhase === 'timers' ? 'active' : ''}`}>
              <div className="phase-number">1</div>
              <div className="phase-name">Timers</div>
              <div className="phase-desc">setTimeout, setInterval</div>
            </div>
            <div className="arrow">→</div>
            <div className={`phase ${activePhase === 'pending' ? 'active' : ''}`}>
              <div className="phase-number">2</div>
              <div className="phase-name">Pending I/O</div>
              <div className="phase-desc">Deferred callbacks</div>
            </div>
            <div className="arrow">→</div>
            <div className={`phase ${activePhase === 'poll' ? 'active' : ''}`}>
              <div className="phase-number">3</div>
              <div className="phase-name">Poll</div>
              <div className="phase-desc">I/O events</div>
            </div>
            <div className="arrow">→</div>
            <div className={`phase ${activePhase === 'check' ? 'active' : ''}`}>
              <div className="phase-number">4</div>
              <div className="phase-name">Check</div>
              <div className="phase-desc">setImmediate</div>
            </div>
            <div className="arrow">→</div>
            <div className={`phase ${activePhase === 'close' ? 'active' : ''}`}>
              <div className="phase-number">5</div>
              <div className="phase-name">Close</div>
              <div className="phase-desc">Stream closes</div>
            </div>
          </div>
          <p className="phase-note">Note: Microtasks (process.nextTick, Promises) run BETWEEN phases</p>
        </section>

        {/* Response Display */}
        <section className="response-section">
          <h2>{activePhase ? `${PHASES[activePhase]} Results` : 'Select a phase to test'}</h2>

          {loading && <div className="loading">Loading...</div>}

          {response && (
            <div className="response-box">
              {/* Results */}
              {response.results && (
                <div className="results">
                  <h3>Results:</h3>
                  <ul>
                    {response.results.map((result, idx) => (
                      <li key={idx}>{result}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Execution Order */}
              {response.executionOrder && (
                <div className="execution-order">
                  <h3>Execution Order:</h3>
                  <ol>
                    {response.executionOrder.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ol>
                  {response.expectedOrder && (
                    <div className="expected-order">
                      <h4>Expected Order:</h4>
                      <ol>
                        {response.expectedOrder.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Metrics */}
              {response.metrics && (
                <div className="metrics">
                  <h3>Metrics:</h3>
                  <pre>{JSON.stringify(response.metrics, null, 2)}</pre>
                </div>
              )}

              {/* Event Loop Health */}
              {response.eventLoopHealth && (
                <div className="health">
                  <h3>Event Loop Health:</h3>
                  <pre>{JSON.stringify(response.eventLoopHealth, null, 2)}</pre>
                </div>
              )}

              {/* Explanation */}
              {response.explanation && (
                <div className="explanation">
                  <h3>Explanation:</h3>
                  <pre>{JSON.stringify(response.explanation, null, 2)}</pre>
                </div>
              )}

              {/* Blocking Test */}
              {response.blockingTest && (
                <div className="blocking-test">
                  <h3>Blocking Test Results:</h3>
                  <ul>
                    {response.blockingTest.map((result, idx) => (
                      <li key={idx}>{result}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw JSON */}
              {!response.results &&
                !response.executionOrder &&
                !response.metrics &&
                !response.blockingTest && (
                  <pre>{JSON.stringify(response, null, 2)}</pre>
                )}

              {/* Error */}
              {response.error && <div className="error">❌ Error: {response.error}</div>}
            </div>
          )}
        </section>

        {/* History */}
        {history.length > 0 && (
          <section className="history-section">
            <h2>Recent Requests ({history.length})</h2>
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
          <h2>📚 Event Loop Theory</h2>

          <div className="theory-card">
            <h3>What is the Event Loop?</h3>
            <p>
              The event loop is the heart of Node.js. It continuously checks if there are callbacks
              to execute from different queue.
            </p>
          </div>

          <div className="theory-card">
            <h3>The 6 Phases (in order)</h3>
            <ol>
              <li>
                <strong>Timers:</strong> Execute setTimeout() and setInterval() callbacks
              </li>
              <li>
                <strong>Pending Callbacks:</strong> Execute I/O callbacks deferred to next iteration
              </li>
              <li>
                <strong>Idle/Prepare:</strong> Internal use only
              </li>
              <li>
                <strong>Poll:</strong> Wait for I/O events, execute their callbacks
              </li>
              <li>
                <strong>Check:</strong> Execute setImmediate() callbacks
              </li>
              <li>
                <strong>Close:</strong> Execute close callbacks (socket.on('close'))
              </li>
            </ol>
          </div>

          <div className="theory-card">
            <h3>Microtasks vs Macrotasks</h3>
            <p>
              <strong>Microtasks</strong> (process.nextTick, Promises) execute BETWEEN phases.
              <br />
              <strong>Macrotasks</strong> (setTimeout, I/O) execute IN the phases.
              <br />
              All microtasks flush before moving to the next macrotask phase.
            </p>
          </div>

          <div className="theory-card">
            <h3>Event Loop Lag</h3>
            <p>
              If one phase takes too long, subsequent callbacks are delayed. This is called "event
              loop lag". Keep functions synchronous and quick!
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          Backend API running on port 3001 | React Frontend | Learn Node.js Event Loop Internals
        </p>
      </footer>
    </div>
  );
};

export default App;

