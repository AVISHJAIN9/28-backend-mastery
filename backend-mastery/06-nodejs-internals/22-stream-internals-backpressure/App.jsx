import React, { useState, useCallback } from 'react';
import './App.css';

/**
 * Streams & Backpressure
 * Interactive React Component for testing stream patterns
 */

const App = () => {
  const [activeTab, setActiveTab] = useState('readable');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataSizeInput, setDataSizeInput] = useState('1000');
  const [writeSizeInput, setWriteSizeInput] = useState('1024');
  const [highWaterMarkInput, setHighWaterMarkInput] = useState('16384');
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3022';

  const TABS = {
    readable: 'Readable Streams',
    writable: 'Writable Streams',
    transform: 'Transform Streams',
    backpressure: 'Backpressure Demo',
    pipe: 'Piping',
    objectMode: 'Object Mode',
    highwater: 'highWaterMark'
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

  const handleReadableDemo = () => callEndpoint('/api/streams/readable-demo');
  const handleWritableDemo = () => callEndpoint('/api/streams/writable-demo', 'POST', { chunks: ['a', 'b', 'c'] });
  const handleTransformDemo = () => callEndpoint('/api/streams/transform-demo', 'POST', { items: ['hello', 'world', 'nodejs'] });
  const handleBackpressureDemo = () => callEndpoint('/api/streams/backpressure-demo', 'POST', { dataSize: parseInt(dataSizeInput), writeSize: parseInt(writeSizeInput) });
  const handlePipeDemo = () => callEndpoint('/api/streams/pipe-demo', 'POST', { itemCount: 100 });
  const handleObjectMode = () => callEndpoint('/api/streams/object-mode', 'POST', { objects: [{ id: 1 }, { id: 2 }, { id: 3 }] });
  const handleHighWaterMark = () => callEndpoint('/api/streams/highwater-mark', 'POST', { highWaterMark: parseInt(highWaterMarkInput) });

  return (
    <div className="container">
      <header className="header">
        <h1>📦 Streams & Backpressure</h1>
        <p>Understand stream internals, readable/writable patterns, and backpressure handling</p>
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
          {activeTab === 'readable' && (
            <div className="section">
              <h3>Readable Streams</h3>
              <p>Read data from source in chunks</p>
              <button onClick={handleReadableDemo} disabled={loading} className="btn-primary">
                Demo Readable Stream
              </button>
            </div>
          )}

          {activeTab === 'writable' && (
            <div className="section">
              <h3>Writable Streams</h3>
              <p>Write data to destination in chunks</p>
              <button onClick={handleWritableDemo} disabled={loading} className="btn-primary">
                Demo Writable Stream
              </button>
            </div>
          )}

          {activeTab === 'transform' && (
            <div className="section">
              <h3>Transform Streams</h3>
              <p>Modify data during transit (e.g., uppercase)</p>
              <button onClick={handleTransformDemo} disabled={loading} className="btn-primary">
                Demo Transform Stream
              </button>
            </div>
          )}

          {activeTab === 'backpressure' && (
            <div className="section">
              <h3>Backpressure Handling</h3>
              <p>See how readable pauses when writable buffer is full</p>
              <div className="input-row">
                <div className="input-group">
                  <label>Data Size</label>
                  <input
                    type="number"
                    value={dataSizeInput}
                    onChange={(e) => setDataSizeInput(e.target.value)}
                    min="10"
                    max="10000"
                  />
                </div>
                <div className="input-group">
                  <label>Write Size (bytes)</label>
                  <input
                    type="number"
                    value={writeSizeInput}
                    onChange={(e) => setWriteSizeInput(e.target.value)}
                    min="100"
                    max="10000"
                  />
                </div>
              </div>
              <button onClick={handleBackpressureDemo} disabled={loading} className="btn-primary">
                Test Backpressure
              </button>
            </div>
          )}

          {activeTab === 'pipe' && (
            <div className="section">
              <h3>Piping Streams</h3>
              <p>Automatic backpressure handling with pipe()</p>
              <button onClick={handlePipeDemo} disabled={loading} className="btn-primary">
                Demo Piping
              </button>
            </div>
          )}

          {activeTab === 'objectMode' && (
            <div className="section">
              <h3>Object Mode Streams</h3>
              <p>Stream objects instead of bytes</p>
              <button onClick={handleObjectMode} disabled={loading} className="btn-primary">
                Demo Object Mode
              </button>
            </div>
          )}

          {activeTab === 'highwater' && (
            <div className="section">
              <h3>highWaterMark Configuration</h3>
              <p>Control internal buffer size (default: 16KB)</p>
              <div className="input-group">
                <label>highWaterMark (bytes)</label>
                <input
                  type="number"
                  value={highWaterMarkInput}
                  onChange={(e) => setHighWaterMarkInput(e.target.value)}
                  min="1024"
                  max="1048576"
                />
              </div>
              <button onClick={handleHighWaterMark} disabled={loading} className="btn-primary">
                Test highWaterMark
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className={`response ${response.error ? 'error' : 'success'}`}>
          <h4>{response.error ? '❌ Error' : '✅ Result'}</h4>

          {response.stream && (
            <div className="stream-info">
              <h5>Stream Type: {response.stream}</h5>
            </div>
          )}

          {response.data && (
            <div className="data-display">
              <h5>Data Received:</h5>
              <ul>
                {response.data.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {response.written && (
            <div className="written-display">
              <h5>Data Written:</h5>
              <ul>
                {response.written.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {response.transformed && (
            <div className="transformed-display">
              <h5>Transformed Data:</h5>
              <ul>
                {response.transformed.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {response.metrics && (
            <div className="metrics-display">
              <h5>Backpressure Metrics:</h5>
              <div className="metric-grid">
                <div className="metric">
                  <strong>Pause Events</strong>
                  <span>{response.metrics.pauseCount}</span>
                </div>
                <div className="metric">
                  <strong>Resume Events</strong>
                  <span>{response.metrics.resumeCount}</span>
                </div>
                <div className="metric">
                  <strong>Bytes Written</strong>
                  <span>{(response.metrics.bytesWritten / 1024).toFixed(2)} KB</span>
                </div>
                <div className="metric">
                  <strong>Bytes Read</strong>
                  <span>{(response.metrics.bytesRead / 1024).toFixed(2)} KB</span>
                </div>
              </div>
            </div>
          )}

          {response.items && (
            <div className="items-display">
              <h5>Items ({response.itemCount} total):</h5>
              <ul>
                {response.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {response.processed && (
            <div className="processed-display">
              <h5>Processed Objects:</h5>
              <pre>{JSON.stringify(response.processed, null, 2)}</pre>
            </div>
          )}

          <pre className="response-json">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* Concepts */}
      <div className="concepts-grid">
        <div className="concept-card">
          <h4>Readable Streams</h4>
          <ul>
            <li>Source of data</li>
            <li>Flowing mode (auto)</li>
            <li>Paused mode (manual)</li>
            <li>Events: data, end, error</li>
          </ul>
        </div>
        <div className="concept-card">
          <h4>Writable Streams</h4>
          <ul>
            <li>Destination for data</li>
            <li>write() returns boolean</li>
            <li>drain event on flush</li>
            <li>finish event on end</li>
          </ul>
        </div>
        <div className="concept-card">
          <h4>Backpressure</h4>
          <ul>
            <li>Buffer fills when slow write</li>
            <li>pause() on write()===false</li>
            <li>resume() on drain</li>
            <li>pipe() handles automatically</li>
          </ul>
        </div>
        <div className="concept-card">
          <h4>highWaterMark</h4>
          <ul>
            <li>Buffer capacity threshold</li>
            <li>Default: 16KB for objects</li>
            <li>Default: 64KB for bytes</li>
            <li>Tune for performance</li>
          </ul>
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
                <code>{item.endpoint}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .container {
          max-width: 1400px;
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
          min-width: 120px;
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

        .stream-info,
        .data-display,
        .written-display,
        .transformed-display,
        .items-display,
        .processed-display {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .data-display ul,
        .written-display ul,
        .transformed-display ul,
        .items-display ul {
          list-style: none;
          padding: 0;
          margin: 10px 0 0;
        }

        .data-display li,
        .written-display li,
        .transformed-display li,
        .items-display li {
          padding: 5px 0;
          color: #333;
        }

        .metrics-display {
          background: #f0f7ff;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .metric {
          background: white;
          padding: 12px;
          border-radius: 4px;
          text-align: center;
          border-left: 3px solid #0066cc;
        }

        .metric strong {
          display: block;
          margin-bottom: 8px;
          color: #333;
        }

        .metric span {
          display: block;
          font-size: 18px;
          font-weight: bold;
          color: #0066cc;
        }

        .response-json {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
          margin-top: 15px;
        }

        .concepts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
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
