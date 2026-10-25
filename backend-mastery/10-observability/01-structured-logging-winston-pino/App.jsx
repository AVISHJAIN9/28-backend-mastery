import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4001/api';

function App() {
  const [logs, setLogs] = useState([]);
  const [response, setResponse] = useState(null);
  const [testType, setTestType] = useState('view-logs');
  const [formData, setFormData] = useState({
    event: '',
    level: 'info',
    data: '{}',
    event_filter: '',
    level_filter: '',
    userId: '1',
    checkoutAmount: '99.99'
  });
  const [loggerInfo, setLoggerInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [correlationId, setCorrelationId] = useState(null);

  useEffect(() => {
    setCorrelationId(`req_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  }, []);

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const callAPI = async (method, endpoint, body = null) => {
    setIsLoading(true);
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId
        }
      };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await res.json();
      return { correlationId: data.correlationId || correlationId, ...data };
    } catch (error) {
      return { error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const testViewLogs = async () => {
    const result = await callAPI('GET', '/logs');
    setResponse(result);
    setLogs(result.logs || []);
  };

  const testFilterLogs = async () => {
    const query = new URLSearchParams();
    if (formData.event_filter) query.append('event', formData.event_filter);
    if (formData.level_filter) query.append('level', formData.level_filter);
    const result = await callAPI('GET', `/logs/filter?${query.toString()}`);
    setResponse(result);
    setLogs(result.logs || []);
  };

  const testCreateLog = async () => {
    try {
      const data = JSON.parse(formData.data);
      const result = await callAPI('POST', '/logs/create', {
        event: formData.event,
        level: formData.level,
        data
      });
      setResponse(result);
      const logsResult = await callAPI('GET', '/logs');
      setLogs(logsResult.logs || []);
    } catch (e) {
      setResponse({ error: 'Invalid JSON' });
    }
  };

  const testLoggerInfo = async () => {
    const result = await callAPI('GET', '/logger/info');
    setResponse(result);
    setLoggerInfo(result.logger);
  };

  const testGetUser = async () => {
    const result = await callAPI('GET', `/users/${formData.userId}`);
    setResponse(result);
  };

  const testCheckout = async () => {
    const result = await callAPI('POST', '/checkout', {
      userId: formData.userId,
      amount: parseFloat(formData.checkoutAmount)
    });
    setResponse(result);
  };

  const testStatistics = async () => {
    const result = await callAPI('GET', '/logs/statistics');
    setResponse(result);
    setStats(result.statistics);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 Structured Logging with Winston</h1>
        <p>Learn structured logging, log levels, and correlation IDs</p>
        {correlationId && (
          <div className="correlation-id">
            <small>Correlation ID: {correlationId}</small>
          </div>
        )}
      </header>

      <div className="app-container">
        <div className="controls-panel">
          <h2>Test Cases</h2>
          
          <div className="test-section">
            <h3>📋 View & Filter Logs</h3>
            <button onClick={testViewLogs} disabled={isLoading} className="btn btn-primary">
              {isLoading ? '⏳ Loading...' : '📬 Get All Logs'}
            </button>

            <div className="form-group">
              <label>Filter by Event:</label>
              <input type="text" name="event_filter" placeholder="e.g., checkout_started"
                value={formData.event_filter} onChange={handleFormChange} />
              <label>Filter by Level:</label>
              <select name="level_filter" value={formData.level_filter} onChange={handleFormChange}>
                <option value="">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warn</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
              <button onClick={testFilterLogs} className="btn btn-secondary">
                🔎 Filter Logs
              </button>
            </div>
          </div>

          <div className="test-section">
            <h3>✍️ Create Log Event</h3>
            <div className="form-group">
              <label>Event Name:</label>
              <input type="text" name="event" placeholder="e.g., user_signup"
                value={formData.event} onChange={handleFormChange} />
              <label>Log Level:</label>
              <select name="level" value={formData.level} onChange={handleFormChange}>
                <option value="error">Error</option>
                <option value="warn">Warn</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
              <label>Data (JSON):</label>
              <textarea name="data" value={formData.data} onChange={handleFormChange} rows="3" />
              <button onClick={testCreateLog} className="btn btn-success">
                ✅ Create Log
              </button>
            </div>
          </div>

          <div className="test-section">
            <h3>ℹ️ Logger Information</h3>
            <button onClick={testLoggerInfo} className="btn btn-info">
              ⚙️ Get Logger Info
            </button>
          </div>

          <div className="test-section">
            <h3>👤 User Operations</h3>
            <div className="form-group">
              <label>User ID:</label>
              <input type="text" name="userId" value={formData.userId} onChange={handleFormChange} />
              <button onClick={testGetUser} className="btn btn-warning">
                👁️ Get User (with logging)
              </button>
            </div>
          </div>

          <div className="test-section">
            <h3>🛒 Business Operations</h3>
            <div className="form-group">
              <label>Checkout Amount:</label>
              <input type="number" name="checkoutAmount" value={formData.checkoutAmount}
                onChange={handleFormChange} step="0.01" />
              <button onClick={testCheckout} className="btn btn-danger">
                💳 Simulate Checkout
              </button>
            </div>
          </div>

          <div className="test-section">
            <h3>📊 Statistics</h3>
            <button onClick={testStatistics} className="btn btn-stats">
              📈 Get Log Statistics
            </button>
          </div>
        </div>

        <div className="response-panel">
          <div className="response-tabs">
            <button onClick={() => setTestType('view-logs')} className={testType === 'view-logs' ? 'tab active' : 'tab'}>
              Logs ({logs.length})
            </button>
            <button onClick={() => setTestType('response')} className={testType === 'response' ? 'tab active' : 'tab'}>
              Response
            </button>
            <button onClick={() => setTestType('logger-info')} className={testType === 'logger-info' ? 'tab active' : 'tab'}>
              Logger Info
            </button>
            <button onClick={() => setTestType('statistics')} className={testType === 'statistics' ? 'tab active' : 'tab'}>
              Statistics
            </button>
          </div>

          <div className="response-content">
            {testType === 'view-logs' && (
              <div>
                <h3>📝 Logs ({logs.length})</h3>
                {logs.length > 0 ? (
                  <div className="logs-list">
                    {logs.slice(-20).reverse().map((log, idx) => (
                      <div key={idx} className={`log-item level-${log.level || 'info'}`}>
                        <div className="log-header">
                          <strong>{log.event}</strong>
                          <span className={`level-badge level-${log.level || 'info'}`}>
                            {log.level || 'info'}
                          </span>
                        </div>
                        <div className="log-meta">
                          <small>{log.timestamp}</small>
                          {log.correlationId && <small> | ID: {log.correlationId}</small>}
                        </div>
                        {log.data && Object.keys(log.data).length > 0 && (
                          <pre className="log-data">{JSON.stringify(log.data, null, 2)}</pre>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty">No logs yet. Create some!</p>
                )}
              </div>
            )}

            {testType === 'response' && (
              <div>
                <h3>📊 Last Response</h3>
                {response ? (
                  <pre className="response-box">{JSON.stringify(response, null, 2)}</pre>
                ) : (
                  <p className="empty">No response yet</p>
                )}
              </div>
            )}

            {testType === 'logger-info' && (
              <div>
                <h3>⚙️ Logger Configuration</h3>
                {loggerInfo ? (
                  <div className="info-box">
                    <p><strong>Name:</strong> {loggerInfo.name}</p>
                    <p><strong>Level:</strong> {loggerInfo.level}</p>
                    <p><strong>Environment:</strong> {loggerInfo.environment}</p>
                    <p><strong>Format:</strong> {loggerInfo.format}</p>
                    <p><strong>Transports:</strong></p>
                    <ul>
                      {loggerInfo.transports?.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="empty">Click "Get Logger Info"</p>
                )}
              </div>
            )}

            {testType === 'statistics' && (
              <div>
                <h3>📈 Log Statistics</h3>
                {stats ? (
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">Total Logs</div>
                      <div className="stat-value">{stats.total}</div>
                    </div>
                    <div className="stat-item level-error">
                      <div className="stat-label">Errors</div>
                      <div className="stat-value">{stats.byLevel.error}</div>
                    </div>
                    <div className="stat-item level-warn">
                      <div className="stat-label">Warnings</div>
                      <div className="stat-value">{stats.byLevel.warn}</div>
                    </div>
                    <div className="stat-item level-info">
                      <div className="stat-label">Info</div>
                      <div className="stat-value">{stats.byLevel.info}</div>
                    </div>
                    {stats.byEvent && (
                      <div className="stat-events">
                        <h4>Events:</h4>
                        <ul>
                          {Object.entries(stats.byEvent).map(([event, count]) => (
                            <li key={event}>{event}: {count}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="empty">Click "Get Log Statistics"</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>Module: 01-Structured Logging (Winston) | Port: 4001</p>
        <p>Server: <code>http://localhost:4001</code></p>
      </footer>
    </div>
  );
}

export default App;
