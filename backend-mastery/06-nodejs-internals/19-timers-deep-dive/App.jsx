import React, { useState, useCallback } from 'react';
import './App.css';

/**
 * Timers Deep Dive
 * Interactive React Component for testing timer behaviors
 */

const App = () => {
  const [activeTab, setActiveTab] = useState('precision');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [precisionDelayInput, setPrecisionDelayInput] = useState('100');
  const [precisionCountInput, setPrecisionCountInput] = useState('10');
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3019';

  const TABS = {
    precision: 'Timer Precision Test',
    immediate: 'setTimeout vs setImmediate',
    unref: 'Timer.unref() Test',
    interval: 'setInterval Behavior',
    micromacro: 'Microtasks vs Macrotasks',
    memory: 'Timer Memory Usage',
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
      setHistory((prev) => [...prev.slice(-9), { endpoint, timestamp: new Date(), data }]);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePrecisionTest = async () => {
    callEndpoint('/api/timers/test-precision', 'POST', {
      count: parseInt(precisionCountInput),
      delay: parseInt(precisionDelayInput),
    });
  };

  const handleImmediateTest = async () => {
    callEndpoint('/api/timers/test-immediate', 'GET');
  };

  const handleUnrefTest = async () => {
    callEndpoint('/api/timers/test-unref', 'POST', { delay: 5000 });
  };

  const handleIntervalTest = async () => {
    callEndpoint('/api/timers/test-interval', 'GET');
  };

  const handleMicroMacroTest = async () => {
    callEndpoint('/api/timers/microtasks-vs-macrotasks', 'GET');
  };

  const handleMemoryTest = async () => {
    callEndpoint('/api/timers/test-memory', 'POST', { count: 1000 });
  };

  const formatResults = (data) => {
    if (Array.isArray(data)) {
      return data.map((item, idx) => (
        <div key={idx} className="result-item">
          {typeof item === 'object' ? JSON.stringify(item) : String(item)}
        </div>
      ));
    }
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>⏱️ Timers: Deep Dive</h1>
        <p>Test timer precision, behavior, and event loop integration</p>
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
          {activeTab === 'precision' && (
            <div className="section">
              <h3>Timer Precision Analysis</h3>
              <p>Measure how accurately timers fire after specified delays</p>
              <div className="input-group">
                <label>Delay (ms)</label>
                <input
                  type="number"
                  value={precisionDelayInput}
                  onChange={(e) => setPrecisionDelayInput(e.target.value)}
                  min="10"
                  max="5000"
                />
              </div>
              <div className="input-group">
                <label>Number of Tests</label>
                <input
                  type="number"
                  value={precisionCountInput}
                  onChange={(e) => setPrecisionCountInput(e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
              <button onClick={handlePrecisionTest} disabled={loading} className="btn-primary">
                Test Precision
              </button>
            </div>
          )}

          {activeTab === 'immediate' && (
            <div className="section">
              <h3>setTimeout(0) vs setImmediate Execution Order</h3>
              <p>See which runs first in the event loop</p>
              <button onClick={handleImmediateTest} disabled={loading} className="btn-primary">
                Run Test
              </button>
            </div>
          )}

          {activeTab === 'unref' && (
            <div className="section">
              <h3>Timer.unref() Behavior</h3>
              <p>Test how unref() affects process lifecycle</p>
              <p className="info">
                ℹ️ unref() allows process to exit even if timer is pending
              </p>
              <button onClick={handleUnrefTest} disabled={loading} className="btn-primary">
                Create Ref & Unref Timers
              </button>
            </div>
          )}

          {activeTab === 'interval' && (
            <div className="section">
              <h3>setInterval Execution Pattern</h3>
              <p>Observe interval timing and drift patterns</p>
              <button onClick={handleIntervalTest} disabled={loading} className="btn-primary">
                Run Interval Test
              </button>
            </div>
          )}

          {activeTab === 'micromacro' && (
            <div className="section">
              <h3>Microtasks vs Macrotasks</h3>
              <p>
                Microtasks (Promises, nextTick) execute before macrotasks (timers,
                setImmediate)
              </p>
              <button onClick={handleMicroMacroTest} disabled={loading} className="btn-primary">
                Test Execution Order
              </button>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="section">
              <h3>Timer Memory Usage</h3>
              <p>Measure heap memory used by timers</p>
              <button onClick={handleMemoryTest} disabled={loading} className="btn-primary">
                Test Memory (1000 timers)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className={`response ${response.error ? 'error' : 'success'}`}>
          <h4>{response.error ? '❌ Error' : '✅ Success'}</h4>
          {response.executionOrder && (
            <div className="execution-order">
              <h5>Execution Order:</h5>
              {response.executionOrder.map((item, idx) => (
                <div key={idx} className="order-item">
                  {idx + 1}. {item}
                </div>
              ))}
            </div>
          )}
          {response.results && Array.isArray(response.results) && (
            <div className="results-grid">
              {response.results.slice(0, 5).map((result, idx) => (
                <div key={idx} className="result-card">
                  <strong>Test {idx + 1}</strong>
                  <div>Expected: {result.expected}ms</div>
                  <div>Actual: {result.actual}ms</div>
                  <div className="drift">Drift: {result.drift > 0 ? '+' : ''}{result.drift}ms</div>
                </div>
              ))}
              {response.results.length > 5 && (
                <div className="result-card">
                  <strong>... {response.results.length - 5} more</strong>
                </div>
              )}
            </div>
          )}
          {response.avgDrift !== undefined && (
            <div className="stat">
              <strong>Average Drift:</strong> {response.avgDrift.toFixed(2)}ms
            </div>
          )}
          {response.iterations && (
            <div className="iterations-view">
              {response.iterations.map((it, idx) => (
                <div key={idx} className="iteration">
                  Iteration {it.iteration}: +{it.timestamp}ms
                </div>
              ))}
              <div className="stat">Total Duration: {response.totalDuration}ms</div>
            </div>
          )}
          {response.timerCount !== undefined && (
            <div className="memory-view">
              <div className="stat">Timers Created: {response.timerCount}</div>
              <div className="stat">Memory Increase: {response.memoryIncreaseMB}MB</div>
              <div className="stat">Per Timer: {response.averagePerTimer}</div>
            </div>
          )}
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* Concepts */}
      <div className="concepts-grid">
        <div className="concept-card">
          <h4>setTimeout vs setImmediate</h4>
          <ul>
            <li>setTimeout: Timers phase</li>
            <li>setImmediate: Check phase</li>
            <li>setImmediate runs next if in I/O</li>
          </ul>
        </div>
        <div className="concept-card">
          <h4>Timer Precision</h4>
          <ul>
            <li>NOT guaranteed precise</li>
            <li>Depends on event loop load</li>
            <li>Linux: ~1ms, Windows: ~15ms</li>
          </ul>
        </div>
        <div className="concept-card">
          <h4>Microtasks vs Macrotasks</h4>
          <ul>
            <li>Microtasks: Promises, nextTick</li>
            <li>Macrotasks: timers, I/O</li>
            <li>All microtasks before next macrotask</li>
          </ul>
        </div>
        <div className="concept-card">
          <h4>Timer.unref()</h4>
          <ul>
            <li>Allows process exit</li>
            <li>Good for keep-alive timers</li>
            <li>Can be ref'd back</li>
          </ul>
        </div>
      </div>

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

        .section .info {
          background: #e3f2fd;
          padding: 10px 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .input-group {
          display: inline-block;
          margin-right: 20px;
          margin-bottom: 15px;
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
        }

        .response.error {
          border-left-color: #f44336;
        }

        .response h4 {
          margin: 0 0 15px;
        }

        .response pre {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }

        .execution-order {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .execution-order h5 {
          margin: 0 0 10px;
        }

        .order-item {
          padding: 5px 0;
          font-family: monospace;
          color: #0066cc;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 15px;
        }

        .result-card {
          background: #f0f7ff;
          padding: 12px;
          border-radius: 4px;
          font-size: 12px;
          border-left: 3px solid #0066cc;
        }

        .result-card strong {
          display: block;
          margin-bottom: 8px;
        }

        .result-card > div {
          margin: 3px 0;
        }

        .drift {
          color: #f44336;
          font-weight: 500;
        }

        .stat {
          background: #f0f7ff;
          padding: 10px 15px;
          border-radius: 4px;
          margin: 10px 0;
          font-size: 14px;
        }

        .iterations-view {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          max-height: 300px;
          overflow-y: auto;
        }

        .iteration {
          padding: 5px 0;
          font-size: 12px;
          font-family: monospace;
        }

        .memory-view {
          background: #f0f7ff;
          padding: 15px;
          border-radius: 4px;
        }

        .concepts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 40px;
        }

        .concept-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .concept-card h4 {
          margin: 0 0 15px;
          color: #333;
        }

        .concept-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .concept-card li {
          color: #666;
          padding: 5px 0;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};

export default App;
