import React, { useState, useCallback } from 'react';
import './App.css';

/**
 * Testing & Assertions
 * Interactive React Component for testing assertion patterns
 */

const App = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [value1Input, setValue1Input] = useState('5');
  const [value2Input, setValue2Input] = useState('5');
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3021';

  const TABS = {
    basic: 'Basic Assertions',
    type: 'Type Checking',
    deep: 'Deep Equality',
    array: 'Array Assertions',
    throws: 'Throws/DoesNotThrow',
    range: 'Range Assertions',
    conditional: 'Conditional',
    suite: 'Test Suite'
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

  const handleBasicAssertions = () => {
    callEndpoint('/api/tests/basic-assertions', 'POST', {
      value1: parseInt(value1Input),
      value2: parseInt(value2Input)
    });
  };

  const handleTypeAssertions = () => {
    callEndpoint('/api/tests/type-assertions', 'POST', {
      value: value1Input,
      expectedType: 'string'
    });
  };

  const handleDeepEquality = () => {
    callEndpoint('/api/tests/deep-equality', 'POST', {
      obj1: { name: 'Alice', age: 30 },
      obj2: { name: 'Alice', age: 30 }
    });
  };

  const handleArrayAssertions = () => {
    callEndpoint('/api/tests/array-assertions', 'POST', {
      array: [1, 2, 3, 4, 5],
      value: 3
    });
  };

  const handleThrowAssertions = () => {
    callEndpoint('/api/tests/throw-assertions', 'POST', {
      shouldThrow: true
    });
  };

  const handleRangeAssertions = () => {
    callEndpoint('/api/tests/range-assertions', 'POST', {
      value: 50,
      min: 0,
      max: 100
    });
  };

  const handleConditionalAssertions = () => {
    callEndpoint('/api/tests/conditional-assertions', 'POST', {
      condition: true,
      message: 'Test condition passed'
    });
  };

  const handleRunSuite = () => {
    callEndpoint('/api/tests/run-suite', 'GET');
  };

  return (
    <div className="container">
      <header className="header">
        <h1>✓ Testing & Assertions</h1>
        <p>Node.js assert module patterns and unit testing</p>
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
          {activeTab === 'basic' && (
            <div className="section">
              <h3>Basic Equality Assertions</h3>
              <p>Test value equality using strictEqual</p>
              <div className="input-row">
                <div className="input-group">
                  <label>Value 1</label>
                  <input type="number" value={value1Input} onChange={(e) => setValue1Input(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Value 2</label>
                  <input type="number" value={value2Input} onChange={(e) => setValue2Input(e.target.value)} />
                </div>
              </div>
              <button onClick={handleBasicAssertions} disabled={loading} className="btn-primary">
                Test Equality
              </button>
            </div>
          )}

          {activeTab === 'type' && (
            <div className="section">
              <h3>Type Checking</h3>
              <p>Verify data types using assert</p>
              <button onClick={handleTypeAssertions} disabled={loading} className="btn-primary">
                Check Type (string)
              </button>
            </div>
          )}

          {activeTab === 'deep' && (
            <div className="section">
              <h3>Deep Equality</h3>
              <p>Recursively compare objects and arrays</p>
              <button onClick={handleDeepEquality} disabled={loading} className="btn-primary">
                Test Deep Equality
              </button>
            </div>
          )}

          {activeTab === 'array' && (
            <div className="section">
              <h3>Array Assertions</h3>
              <p>Test array operations and membership</p>
              <button onClick={handleArrayAssertions} disabled={loading} className="btn-primary">
                Test Array [1,2,3,4,5]
              </button>
            </div>
          )}

          {activeTab === 'throws' && (
            <div className="section">
              <h3>Throws & DoesNotThrow</h3>
              <p>Test exception handling</p>
              <button onClick={handleThrowAssertions} disabled={loading} className="btn-primary">
                Test Throws
              </button>
            </div>
          )}

          {activeTab === 'range' && (
            <div className="section">
              <h3>Range Assertions</h3>
              <p>Verify values are within expected range</p>
              <button onClick={handleRangeAssertions} disabled={loading} className="btn-primary">
                Test Range (0-100)
              </button>
            </div>
          )}

          {activeTab === 'conditional' && (
            <div className="section">
              <h3>Conditional Assertions</h3>
              <p>Test boolean conditions with custom messages</p>
              <button onClick={handleConditionalAssertions} disabled={loading} className="btn-primary">
                Test Condition
              </button>
            </div>
          )}

          {activeTab === 'suite' && (
            <div className="section">
              <h3>Full Test Suite</h3>
              <p>Run comprehensive test suite</p>
              <button onClick={handleRunSuite} disabled={loading} className="btn-primary">
                Run Test Suite
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className={`response ${response.error ? 'error' : 'success'}`}>
          <h4>{response.error ? '❌ Error' : '✅ Results'}</h4>
          
          {response.summary && (
            <div className="summary">
              <h5>Summary:</h5>
              <div className="summary-grid">
                <div className="summary-item">
                  <strong>Total</strong>
                  <div>{response.summary.total}</div>
                </div>
                <div className="summary-item passed">
                  <strong>Passed</strong>
                  <div>{response.summary.passed}</div>
                </div>
                <div className="summary-item failed">
                  <strong>Failed</strong>
                  <div>{response.summary.failed}</div>
                </div>
              </div>
            </div>
          )}

          {response.results && (
            <div className="results-list">
              <h5>Test Results:</h5>
              {response.results.map((result, idx) => (
                <div key={idx} className={`result-item ${result.passed ? 'passed' : 'failed'}`}>
                  <span className="status">{result.passed ? '✓' : '✗'}</span>
                  <span className="test-name">{result.test}</span>
                  {result.error && <span className="error-msg">{result.error}</span>}
                </div>
              ))}
            </div>
          )}

          {response.tests && (
            <div className="tests-list">
              {response.tests.map((test, idx) => (
                <div key={idx} className={`test-item ${test.passed ? 'passed' : 'failed'}`}>
                  <span className="status">{test.passed ? '✓' : '✗'}</span>
                  <span>{test.name}</span>
                  {test.error && <div className="error">{test.error}</div>}
                </div>
              ))}
            </div>
          )}

          <pre className="response-json">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* Assert Methods Reference */}
      <div className="reference">
        <h4>📚 Assert Methods</h4>
        <div className="methods-grid">
          <div className="method-card">
            <h5>strictEqual(actual, expected)</h5>
            <p>Tests strict equality (===)</p>
          </div>
          <div className="method-card">
            <h5>deepStrictEqual(obj1, obj2)</h5>
            <p>Recursively compares objects</p>
          </div>
          <div className="method-card">
            <h5>throws(fn)</h5>
            <p>Expects function to throw</p>
          </div>
          <div className="method-card">
            <h5>doesNotThrow(fn)</h5>
            <p>Expects no exception</p>
          </div>
          <div className="method-card">
            <h5>match(string, regex)</h5>
            <p>Regex string matching</p>
          </div>
          <div className="method-card">
            <h5>rejects(promise)</h5>
            <p>Expects promise rejection</p>
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="history">
          <h4>📋 Test History</h4>
          <div className="history-items">
            {history.map((item, idx) => (
              <div key={idx} className="history-item">
                <small>{item.timestamp.toLocaleTimeString()}</small>
                <code>{item.endpoint}</code>
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

        .input-row {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .input-group {
          flex: 1;
          min-width: 150px;
        }

        .input-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .input-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
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

        .summary {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .summary h5 {
          margin: 0 0 10px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .summary-item {
          background: white;
          padding: 12px;
          border-radius: 4px;
          text-align: center;
        }

        .summary-item.passed {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .summary-item.failed {
          background: #ffebee;
          color: #c62828;
        }

        .summary-item strong {
          display: block;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .summary-item div {
          font-size: 20px;
          font-weight: bold;
        }

        .results-list,
        .tests-list {
          background: #fafafa;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .results-list h5,
        .tests-list h5 {
          margin: 0 0 10px;
        }

        .result-item,
        .test-item {
          padding: 8px 10px;
          margin-bottom: 8px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .result-item.passed,
        .test-item.passed {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .result-item.failed,
        .test-item.failed {
          background: #ffebee;
          color: #c62828;
        }

        .status {
          font-weight: bold;
          font-size: 16px;
        }

        .test-name {
          flex: 1;
        }

        .error {
          width: 100%;
          margin-top: 5px;
          padding-top: 5px;
          border-top: 1px solid currentColor;
          font-size: 12px;
        }

        .response-json {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }

        .reference {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .reference h4 {
          margin: 0 0 20px;
        }

        .methods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .method-card {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          border-left: 4px solid #0066cc;
        }

        .method-card h5 {
          margin: 0 0 8px;
          color: #333;
          font-size: 13px;
          font-family: monospace;
        }

        .method-card p {
          margin: 0;
          color: #666;
          font-size: 13px;
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
