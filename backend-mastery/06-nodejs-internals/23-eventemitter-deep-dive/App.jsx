import React, { useState, useCallback } from 'react';
import './App.css';

/**
 * EventEmitter Deep Dive
 * Interactive React Component for testing EventEmitter patterns
 */

const App = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listenerCountInput, setListenerCountInput] = useState('15');
  const [customEventInput, setCustomEventInput] = useState('myEvent');
  const [customDataInput, setCustomDataInput] = useState('Hello');
  const [history, setHistory] = useState([]);

  const API_BASE = 'http://localhost:3023';

  const TABS = {
    basic: 'Basic Emit',
    once: 'Once Listener',
    multiple: 'Multiple Listeners',
    remove: 'Remove Listeners',
    limit: 'Listener Limit',
    custom: 'Custom Events',
    inheritance: 'Inheritance',
    error: 'Error Handling',
    async: 'Async Events',
    stats: 'Statistics'
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

  const handleBasicEmit = () => callEndpoint('/api/events/basic-emit');
  const handleOnceListener = () => callEndpoint('/api/events/once-listener');
  const handleMultipleListeners = () => callEndpoint('/api/events/multiple-listeners');
  const handleRemoveListeners = () => callEndpoint('/api/events/remove-listeners');
  const handleListenerLimit = () => callEndpoint('/api/events/listener-limit', 'POST', { listenerCount: parseInt(listenerCountInput) });
  const handleCustomEvents = () => callEndpoint('/api/events/custom-events', 'POST', { eventName: customEventInput, data: customDataInput });
  const handleInheritance = () => callEndpoint('/api/events/inheritance');
  const handleErrorHandling = () => callEndpoint('/api/events/error-handling');
  const handleAsyncEvents = () => callEndpoint('/api/events/async-events', 'POST', {});
  const handleStats = () => callEndpoint('/api/events/stats');

  return (
    <div className="container">
      <header className="header">
        <h1>⚡ EventEmitter Deep Dive</h1>
        <p>Explore EventEmitter internals, listener patterns, and pub-sub patterns</p>
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
              <h3>Basic Event Emission</h3>
              <p>Emit events and trigger listeners</p>
              <button onClick={handleBasicEmit} disabled={loading} className="btn-primary">
                Emit Events
              </button>
            </div>
          )}

          {activeTab === 'once' && (
            <div className="section">
              <h3>Once Listener</h3>
              <p>Listener fires only once</p>
              <button onClick={handleOnceListener} disabled={loading} className="btn-primary">
                Test Once Listener
              </button>
            </div>
          )}

          {activeTab === 'multiple' && (
            <div className="section">
              <h3>Multiple Listeners</h3>
              <p>Multiple listeners for same event</p>
              <button onClick={handleMultipleListeners} disabled={loading} className="btn-primary">
                Test Multiple Listeners
              </button>
            </div>
          )}

          {activeTab === 'remove' && (
            <div className="section">
              <h3>Remove Listeners</h3>
              <p>Remove specific or all listeners</p>
              <button onClick={handleRemoveListeners} disabled={loading} className="btn-primary">
                Test Remove Listeners
              </button>
            </div>
          )}

          {activeTab === 'limit' && (
            <div className="section">
              <h3>Listener Limit Warning</h3>
              <p>Default limit: 10 listeners (triggers warning {'>{'} limit)</p>
              <div className="input-group">
                <label>Number of Listeners</label>
                <input
                  type="number"
                  value={listenerCountInput}
                  onChange={(e) => setListenerCountInput(e.target.value)}
                  min="5"
                  max="100"
                />
              </div>
              <button onClick={handleListenerLimit} disabled={loading} className="btn-primary">
                Test Listener Limit
              </button>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="section">
              <h3>Custom Event Names</h3>
              <p>Create and emit custom events</p>
              <div className="input-row">
                <div className="input-group">
                  <label>Event Name</label>
                  <input
                    type="text"
                    value={customEventInput}
                    onChange={(e) => setCustomEventInput(e.target.value)}
                    placeholder="myEvent"
                  />
                </div>
                <div className="input-group">
                  <label>Data</label>
                  <input
                    type="text"
                    value={customDataInput}
                    onChange={(e) => setCustomDataInput(e.target.value)}
                    placeholder="data"
                  />
                </div>
              </div>
              <button onClick={handleCustomEvents} disabled={loading} className="btn-primary">
                Emit Custom Event
              </button>
            </div>
          )}

          {activeTab === 'inheritance' && (
            <div className="section">
              <h3>EventEmitter Inheritance</h3>
              <p>Extend EventEmitter for custom classes</p>
              <button onClick={handleInheritance} disabled={loading} className="btn-primary">
                Test Inheritance
              </button>
            </div>
          )}

          {activeTab === 'error' && (
            <div className="section">
              <h3>Error Handling</h3>
              <p>Handle 'error' events safely</p>
              <button onClick={handleErrorHandling} disabled={loading} className="btn-primary">
                Test Error Handling
              </button>
            </div>
          )}

          {activeTab === 'async' && (
            <div className="section">
              <h3>Async Event Handling</h3>
              <p>Handle async operations triggered by events</p>
              <button onClick={handleAsyncEvents} disabled={loading} className="btn-primary">
                Test Async Events
              </button>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="section">
              <h3>Emitter Statistics</h3>
              <p>View listener counts and event names</p>
              <button onClick={handleStats} disabled={loading} className="btn-primary">
                Get Stats
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className={`response ${response.error ? 'error' : 'success'}`}>
          <h4>{response.error ? '❌ Error' : '✅ Result'}</h4>

          {response.events && (
            <div className="events-display">
              <h5>Events:</h5>
              <ul>
                {response.events.map((event, idx) => (
                  <li key={idx}>{event}</li>
                ))}
              </ul>
            </div>
          )}

          {response.logs && (
            <div className="logs-display">
              <h5>Logs:</h5>
              <ul>
                {response.logs.map((log, idx) => (
                  <li key={idx}>{log}</li>
                ))}
              </ul>
            </div>
          )}

          {response.listenerCount !== undefined && (
            <div className="stats-display">
              <div className="stat-item">
                <strong>Listeners on event:</strong> {response.listenerCount}
              </div>
              <div className="stat-item">
                <strong>Total emits:</strong> {response.totalEmits}
              </div>
              <div className="stat-item">
                <strong>Triggered:</strong> {response.listenersTriggered}
              </div>
            </div>
          )}

          {response.remainingListeners !== undefined && (
            <div className="stats-display">
              <div className="stat-item">
                <strong>Remaining listeners:</strong> {response.remainingListeners}
              </div>
            </div>
          )}

          {response.defaultLimit !== undefined && (
            <div className="limit-display">
              <div className="limit-stat">
                <strong>Default Limit:</strong> {response.defaultLimit}
              </div>
              <div className="limit-stat">
                <strong>Current Count:</strong> {response.currentListenerCount}
              </div>
              <div className={`limit-stat ${response.warningThreshold ? 'warning' : 'ok'}`}>
                <strong>Status:</strong> {response.message}
              </div>
            </div>
          )}

          {response.greetings && (
            <div className="greetings-display">
              <h5>Greetings:</h5>
              <ul>
                {response.greetings.map((greeting, idx) => (
                  <li key={idx}>{greeting}</li>
                ))}
              </ul>
            </div>
          )}

          {response.eventNames && (
            <div className="event-names-display">
              <h5>Event Names: {response.eventNames.length} total</h5>
              {response.listenerCounts && (
                <div className="listener-counts">
                  {Object.entries(response.listenerCounts).map(([name, count]) => (
                    <div key={name} className="count-item">
                      <strong>{name}:</strong> {count} listeners
                    </div>
                  ))}
                </div>
              )}
              <div className="stat-item">
                <strong>Total Listeners:</strong> {response.totalListeners}
              </div>
              <div className="stat-item">
                <strong>Max Listeners:</strong> {response.maxListeners}
              </div>
            </div>
          )}

          <pre className="response-json">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* Methods Reference */}
      <div className="reference">
        <h4>📚 EventEmitter Methods</h4>
        <div className="methods-grid">
          <div className="method-card">
            <h5>on(event, fn)</h5>
            <p>Add persistent listener</p>
          </div>
          <div className="method-card">
            <h5>once(event, fn)</h5>
            <p>Add one-time listener</p>
          </div>
          <div className="method-card">
            <h5>emit(event, ...args)</h5>
            <p>Trigger event listeners</p>
          </div>
          <div className="method-card">
            <h5>removeListener()</h5>
            <p>Remove specific listener</p>
          </div>
          <div className="method-card">
            <h5>removeAllListeners()</h5>
            <p>Remove all listeners</p>
          </div>
          <div className="method-card">
            <h5>listenerCount(event)</h5>
            <p>Get listener count</p>
          </div>
          <div className="method-card">
            <h5>eventNames()</h5>
            <p>Get all event names</p>
          </div>
          <div className="method-card">
            <h5>setMaxListeners(n)</h5>
            <p>Set listener limit</p>
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
          font-size: 12px;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
          white-space: nowrap;
          min-width: 100px;
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

        .events-display,
        .logs-display,
        .greetings-display {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .events-display ul,
        .logs-display ul,
        .greetings-display ul {
          list-style: none;
          padding: 0;
          margin: 10px 0 0;
        }

        .events-display li,
        .logs-display li,
        .greetings-display li {
          padding: 5px 0;
          color: #333;
        }

        .stats-display {
          background: #f0f7ff;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .stat-item {
          padding: 8px 0;
          color: #333;
        }

        .stat-item strong {
          font-weight: 600;
        }

        .limit-display {
          background: #fff3e0;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
          border-left: 3px solid #ff9800;
        }

        .limit-stat {
          padding: 8px 0;
          color: #333;
        }

        .limit-stat.warning {
          color: #d32f2f;
          font-weight: 600;
        }

        .limit-stat.ok {
          color: #388e3c;
          font-weight: 600;
        }

        .event-names-display {
          background: #f0f7ff;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .listener-counts {
          background: white;
          padding: 10px;
          border-radius: 3px;
          margin: 10px 0;
        }

        .count-item {
          padding: 5px 0;
          color: #333;
        }

        .response-json {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
          margin-top: 15px;
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
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
          font-size: 12px;
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
