import React, { useState, useCallback } from 'react';
import './App.css';

/**
 * VM Module Sandbox
 * Interactive React Component for testing VM sandboxing
 */

const App = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('2 + 2');
  const [context, setContext] = useState(JSON.stringify({ x: 10, y: 20 }));
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3018';

  const TABS = {
    basic: 'Basic Execution (runInThisContext)',
    context: 'Context Isolation (runInNewContext)',
    timeout: 'Timeout Protection',
    isolation: 'Security Isolation Test',
  };

  const callEndpoint = useCallback(async (endpoint, method = 'POST', body = null) => {
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

  const handleExecuteBasic = async () => {
    callEndpoint('/api/vm/execute-basic', 'POST', { code });
  };

  const handleExecuteContext = async () => {
    try {
      const contextObj = JSON.parse(context);
      callEndpoint('/api/vm/execute-context', 'POST', {
        code,
        context: contextObj,
      });
    } catch (e) {
      setResponse({ error: 'Invalid JSON context' });
    }
  };

  const handleExecuteTimeout = async () => {
    callEndpoint('/api/vm/execute-timeout', 'POST', {
      code,
      timeout: 2000,
    });
  };

  const handleTestIsolation = async () => {
    callEndpoint('/api/vm/test-isolation', 'POST', {});
  };

  const loadExample = (tabKey) => {
    const examples = {
      basic: '2 + 2',
      context: 'x + y',
      timeout: 'let i = 0;\nwhile (true) { i++; }',
      isolation: 'global.hacked = true;',
    };
    setCode(examples[tabKey] || '');
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🔒 VM Module Sandbox</h1>
        <p>Test code execution in isolated sandboxes with security controls</p>
      </header>

      <div className="tab-container">
        <div className="tabs">
          {Object.entries(TABS).map(([key, label]) => (
            <button
              key={key}
              className={`tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(key);
                loadExample(key);
              }}>
              {label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'basic' && (
            <div className="section">
              <h3>Run Code in Current Context</h3>
              <p>⚠️ Less secure but faster - code accesses current scope</p>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter JavaScript code"
                rows="6"
                className="code-input"
              />
              <button onClick={handleExecuteBasic} disabled={loading} className="btn-primary">
                Execute
              </button>
            </div>
          )}

          {activeTab === 'context' && (
            <div className="section">
              <h3>Run Code in Isolated Context</h3>
              <p>✅ More secure - code runs in isolated sandbox</p>
              <label>Context Variables (JSON)</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder='{"x": 10, "y": 20}'
                rows="4"
                className="code-input"
              />
              <label>Code to Execute</label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter JavaScript code"
                rows="6"
                className="code-input"
              />
              <button onClick={handleExecuteContext} disabled={loading} className="btn-primary">
                Execute in Context
              </button>
            </div>
          )}

          {activeTab === 'timeout' && (
            <div className="section">
              <h3>Timeout Protection</h3>
              <p>Test infinite loop protection - code will timeout after 2 seconds</p>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter JavaScript code"
                rows="6"
                className="code-input"
              />
              <button onClick={handleExecuteTimeout} disabled={loading} className="btn-primary">
                Execute (2s timeout)
              </button>
            </div>
          )}

          {activeTab === 'isolation' && (
            <div className="section">
              <h3>Test Security Isolation</h3>
              <p>Verify that sandbox code cannot access global scope</p>
              <button onClick={handleTestIsolation} disabled={loading} className="btn-primary">
                Test Isolation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className={`response ${response.error ? 'error' : 'success'}`}>
          <h4>{response.error ? '❌ Error' : '✅ Success'}</h4>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="history">
          <h4>📋 Execution History</h4>
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

      {/* Examples */}
      <div className="examples">
        <h4>💡 Code Examples</h4>
        <div className="example-grid">
          <div className="example-card">
            <h5>Simple Math</h5>
            <code>2 * 3 + 4</code>
            <p>Basic arithmetic evaluation</p>
          </div>
          <div className="example-card">
            <h5>With Variables</h5>
            <code>x + y * 2</code>
            <p>Use context variables</p>
          </div>
          <div className="example-card">
            <h5>Function Call</h5>
            <code>Math.sqrt(16)</code>
            <p>Access exposed functions</p>
          </div>
          <div className="example-card">
            <h5>Array Operations</h5>
            <code>[1,2,3].reduce((a,b){'=>'}a+b)</code>
            <p>Complex expressions</p>
          </div>
        </div>
      </div>

      {/* Security Notes */}
      <div className="security-notes">
        <h4>🔐 Security Features</h4>
        <ul>
          <li>✅ Code runs in isolated sandbox</li>
          <li>✅ Timeout protection (prevents infinite loops)</li>
          <li>✅ No access to process object</li>
          <li>✅ No access to filesystem</li>
          <li>✅ No access to environment variables</li>
          <li>✅ Limited scope exposure</li>
        </ul>
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
        }

        .tab {
          flex: 1;
          padding: 15px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
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

        label {
          display: block;
          margin: 15px 0 8px;
          font-weight: 500;
          color: #333;
        }

        .code-input {
          width: 100%;
          padding: 12px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          border: 1px solid #ddd;
          border-radius: 4px;
          resize: vertical;
          box-sizing: border-box;
        }

        .btn-primary {
          display: inline-block;
          padding: 10px 20px;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          margin-top: 10px;
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

        .response pre {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
          line-height: 1.4;
        }

        .history {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .history-items {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 15px;
        }

        .history-item {
          background: #f5f5f5;
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

        .examples {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .example-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .example-card {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          border-left: 4px solid #0066cc;
        }

        .example-card h5 {
          margin: 0 0 10px;
          color: #333;
        }

        .example-card code {
          background: white;
          padding: 8px;
          border-radius: 3px;
          display: block;
          font-size: 12px;
          margin-bottom: 10px;
          word-break: break-all;
        }

        .example-card p {
          margin: 0;
          font-size: 13px;
          color: #666;
        }

        .security-notes {
          background: #e3f2fd;
          border-radius: 8px;
          padding: 20px;
          border-left: 4px solid #1976d2;
        }

        .security-notes h4 {
          margin: 0 0 15px;
          color: #1976d2;
        }

        .security-notes ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .security-notes li {
          padding: 8px 0;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default App;
