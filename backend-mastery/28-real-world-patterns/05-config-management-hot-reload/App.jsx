import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4005';

export default function App() {
  const [activeTab, setActiveTab] = useState('view');
  const [currentConfig, setCurrentConfig] = useState(null);
  const [environments, setEnvironments] = useState([]);
  const [message, setMessage] = useState('');
  const [useVulnerable, setUseVulnerable] = useState(false);

  // Tab 1: View Config
  const [selectedEnv, setSelectedEnv] = useState('development');
  const [selectedKey, setSelectedKey] = useState('');

  // Tab 2: Update Config
  const [updateKey, setUpdateKey] = useState('api_timeout');
  const [updateValue, setUpdateValue] = useState('5000');

  // Tab 3: Validate
  const [validateKey, setValidateKey] = useState('api_timeout');
  const [validateValue, setValidateValue] = useState('8000');
  const [validationResult, setValidationResult] = useState(null);

  // Tab 4: History
  const [history, setHistory] = useState([]);

  // Fetch current config
  const fetchConfig = async () => {
    try {
      const endpoint = useVulnerable ? '/api/vulnerable/config' : '/api/secure/config';
      const response = await fetch(`${API_BASE}${endpoint}`);
      const data = await response.json();
      setCurrentConfig(data.config || data);
      setMessage(`Config loaded (${useVulnerable ? 'hardcoded' : 'dynamic'})`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Fetch environments
  const fetchEnvironments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/secure/environments`);
      const data = await response.json();
      setEnvironments(data.environments || []);
    } catch (error) {
      console.error('Error fetching environments:', error);
    }
  };

  // Update config
  const updateConfiguration = async () => {
    try {
      const updateData = {};
      updateData[updateKey] = isNaN(updateValue) ? updateValue : Number(updateValue);

      const response = await fetch(`${API_BASE}/api/secure/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`Config updated! Key: ${updateKey}`);
        fetchConfig();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Validate config
  const validateConfiguration = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/secure/config/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: validateKey,
          value: isNaN(validateValue) ? validateValue : Number(validateValue)
        })
      });

      const data = await response.json();
      setValidationResult(data);
      setMessage(data.valid ? 'Config valid!' : 'Config invalid');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/secure/config/history?limit=50&offset=0`);
      const data = await response.json();
      setHistory(data.changes);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Get environment config
  const getEnvConfig = async (env) => {
    try {
      const response = await fetch(`${API_BASE}/api/secure/environments/${env}`);
      const data = await response.json();
      setCurrentConfig(data.config);
      setSelectedEnv(env);
      setMessage(`Loaded ${env} config`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchConfig();
    fetchEnvironments();
  }, [useVulnerable]);

  useEffect(() => {
    const interval = setInterval(fetchConfig, 3000);
    return () => clearInterval(interval);
  }, [useVulnerable]);

  return (
    <div className="app">
      <header className="header">
        <h1>⚙️ Configuration Management System</h1>
        <p>Hot-reload configuration without server restart</p>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => { setActiveTab('view'); fetchConfig(); }}
        >
          👁️ View Config
        </button>
        <button
          className={`tab ${activeTab === 'update' ? 'active' : ''}`}
          onClick={() => setActiveTab('update')}
        >
          ✏️ Update Config
        </button>
        <button
          className={`tab ${activeTab === 'validate' ? 'active' : ''}`}
          onClick={() => setActiveTab('validate')}
        >
          ✓ Validate
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => { setActiveTab('history'); fetchHistory(); }}
        >
          📋 History
        </button>
      </div>

      <div className="content">
        {/* Tab 1: View Config */}
        {activeTab === 'view' && (
          <div className="tab-content">
            <h2>Configuration Viewer</h2>

            <div className="section">
              <h3>Choose Endpoint</h3>
              <label>
                <input
                  type="radio"
                  checked={!useVulnerable}
                  onChange={() => setUseVulnerable(false)}
                />
                🔒 Secure (Database-backed, hot-reload)
              </label>
              <label>
                <input
                  type="radio"
                  checked={useVulnerable}
                  onChange={() => setUseVulnerable(true)}
                />
                ⚠️ Vulnerable (Hardcoded)
              </label>
            </div>

            <div className="section">
              <h3>Environments</h3>
              <div className="env-buttons">
                {environments.map((env) => (
                  <button
                    key={env.name}
                    className={`btn-env ${selectedEnv === env.name ? 'active' : ''}`}
                    onClick={() => getEnvConfig(env.name)}
                  >
                    {env.name}
                    <br />
                    <small>{env.recent_changes} changes</small>
                  </button>
                ))}
              </div>
            </div>

            {currentConfig && (
              <div className="section result">
                <h3>Current Configuration ({selectedEnv})</h3>
                <div className="config-display">
                  {Object.entries(currentConfig).map(([key, value]) => (
                    <div key={key} className="config-item">
                      <span className="key">
                        {key}:
                      </span>
                      <span className="value">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Update Config */}
        {activeTab === 'update' && (
          <div className="tab-content">
            <h2>Update Configuration (Hot-Reload)</h2>
            <div className="section">
              <h3>Modify Setting</h3>
              <div>
                <label>Configuration Key:</label>
                <select value={updateKey} onChange={(e) => setUpdateKey(e.target.value)}>
                  <option>database_url</option>
                  <option>redis_url</option>
                  <option>api_timeout</option>
                  <option>max_retries</option>
                  <option>cache_ttl</option>
                  <option>log_level</option>
                  <option>rate_limit_requests</option>
                </select>
              </div>
              <div>
                <label>New Value:</label>
                <input
                  type="text"
                  placeholder="Enter new value"
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={updateConfiguration}>
                Apply Update (No Restart!)
              </button>
              <p className="info">
                ⚡ Changes applied instantly to running application
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Validate Config */}
        {activeTab === 'validate' && (
          <div className="tab-content">
            <h2>Validate Configuration</h2>
            <div className="section">
              <h3>Test Config Value</h3>
              <div>
                <label>Key:</label>
                <select value={validateKey} onChange={(e) => setValidateKey(e.target.value)}>
                  <option>api_timeout</option>
                  <option>max_retries</option>
                  <option>database_url</option>
                  <option>log_level</option>
                </select>
              </div>
              <div>
                <label>Value to Validate:</label>
                <input
                  type="text"
                  placeholder="Enter value"
                  value={validateValue}
                  onChange={(e) => setValidateValue(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={validateConfiguration}>
                Validate
              </button>

              {validationResult && (
                <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
                  <h4>{validationResult.valid ? '✓ Valid' : '✗ Invalid'}</h4>
                  <p>{validationResult.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: History */}
        {activeTab === 'history' && (
          <div className="tab-content">
            <h2>Configuration Change History</h2>
            <div className="history-list">
              {history.length > 0 ? (
                history.map((entry, idx) => (
                  <div key={idx} className="history-entry">
                    <div className="timestamp">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    <div className="env-badge">{entry.environment}</div>
                    <div className="changes">
                      {Object.entries(entry.changes).map(([key, value]) => (
                        <div key={key} className="change-item">
                          <code>{key}</code>: <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p>No changes recorded yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && <div className="message">{message}</div>}

      {/* Footer */}
      <footer className="footer">
        <p>Configuration Management - Port 4005</p>
      </footer>
    </div>
  );
}
