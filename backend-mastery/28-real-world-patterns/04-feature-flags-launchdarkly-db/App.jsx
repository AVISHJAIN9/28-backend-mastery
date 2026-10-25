import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4004';

export default function App() {
  const [activeTab, setActiveTab] = useState('evaluate');
  const [flags, setFlags] = useState({});
  const [auditLog, setAuditLog] = useState([]);
  const [message, setMessage] = useState('');

  // Tab 1: Evaluate Flag
  const [flagName, setFlagName] = useState('new_checkout');
  const [userId, setUserId] = useState('user123');
  const [context, setContext] = useState({ tier: 'pro', country: 'US' });
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [useVulnerable, setUseVulnerable] = useState(false);

  // Tab 2: Create Flag
  const [newFlagName, setNewFlagName] = useState('new_feature');
  const [newFlagEnabled, setNewFlagEnabled] = useState(true);
  const [rolloutPercentage, setRolloutPercentage] = useState(50);
  const [newFlagDesc, setNewFlagDesc] = useState('');

  // Tab 3: Manage Flags
  const [editingFlag, setEditingFlag] = useState(null);
  const [updateRollout, setUpdateRollout] = useState(50);

  // Evaluate flag
  const evaluateFlag = async () => {
    try {
      const endpoint = useVulnerable
        ? '/api/vulnerable/flag-check'
        : '/api/secure/flag-check';

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flag_name: flagName,
          user_id: userId,
          context
        })
      });

      const data = await response.json();
      setEvaluationResult(data);
      setMessage(`Flag evaluated: ${data.enabled ? 'ENABLED' : 'DISABLED'}`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Create flag
  const createFlag = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/secure/flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFlagName,
          description: newFlagDesc,
          enabled: newFlagEnabled,
          rollout_percentage: rolloutPercentage,
          targeting_rules: []
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`Flag '${newFlagName}' created!`);
        setNewFlagName('');
        setNewFlagDesc('');
        setNewFlagEnabled(true);
        setRolloutPercentage(50);
        fetchAllFlags();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Fetch all flags
  const fetchAllFlags = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/secure/flags?limit=100&offset=0`
      );
      const data = await response.json();
      const flagMap = {};
      data.flags.forEach(flag => {
        flagMap[flag.name] = flag;
      });
      setFlags(flagMap);
    } catch (error) {
      console.error('Error fetching flags:', error);
    }
  };

  // Update flag
  const updateFlag = async (name, rollout) => {
    try {
      const response = await fetch(`${API_BASE}/api/secure/flags/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollout_percentage: rollout
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`Flag '${name}' updated!`);
        setEditingFlag(null);
        fetchAllFlags();
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Delete flag
  const deleteFlag = async (name) => {
    try {
      const response = await fetch(`${API_BASE}/api/secure/flags/${name}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`Flag '${name}' deleted!`);
        fetchAllFlags();
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Fetch audit log
  const fetchAuditLog = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/secure/audit-log?limit=100&offset=0`
      );
      const data = await response.json();
      setAuditLog(data.events);
    } catch (error) {
      console.error('Error fetching audit log:', error);
    }
  };

  // Clear all data
  const clearData = async () => {
    try {
      await fetch(`${API_BASE}/api/test/clear`, { method: 'POST' });
      setMessage('All data cleared!');
      setFlags({});
      setAuditLog([]);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchAllFlags();
    const interval = setInterval(fetchAuditLog, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>⚙️ Feature Flags Control Panel</h1>
        <p>LaunchDarkly-style flag management with database backing</p>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'evaluate' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluate')}
        >
          📊 Evaluate Flag
        </button>
        <button
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          ➕ Create Flag
        </button>
        <button
          className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          🔧 Manage Flags
        </button>
        <button
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('audit');
            fetchAuditLog();
          }}
        >
          📋 Audit Log
        </button>
      </div>

      <div className="content">
        {/* Tab 1: Evaluate Flag */}
        {activeTab === 'evaluate' && (
          <div className="tab-content">
            <h2>Flag Evaluation</h2>

            <div className="section">
              <h3>Choose Endpoint</h3>
              <label>
                <input
                  type="radio"
                  checked={!useVulnerable}
                  onChange={() => setUseVulnerable(false)}
                />
                🔒 Secure (Database-backed, targeting rules)
              </label>
              <label>
                <input
                  type="radio"
                  checked={useVulnerable}
                  onChange={() => setUseVulnerable(true)}
                />
                ⚠️ Vulnerable (Hardcoded flags)
              </label>
            </div>

            <div className="section">
              <h3>Evaluation Parameters</h3>
              <input
                type="text"
                placeholder="Flag name"
                value={flagName}
                onChange={(e) => setFlagName(e.target.value)}
              />
              <input
                type="text"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <div>
                <label>Country:</label>
                <input
                  type="text"
                  placeholder="US, EU, etc."
                  value={context.country}
                  onChange={(e) =>
                    setContext({ ...context, country: e.target.value })
                  }
                />
              </div>
              <div>
                <label>Tier:</label>
                <select
                  value={context.tier}
                  onChange={(e) =>
                    setContext({ ...context, tier: e.target.value })
                  }
                >
                  <option>free</option>
                  <option>pro</option>
                  <option>enterprise</option>
                </select>
              </div>
              <button className="btn-primary" onClick={evaluateFlag}>
                Evaluate Flag
              </button>
            </div>

            {evaluationResult && (
              <div className="section result">
                <h3>Result</h3>
                <pre>{JSON.stringify(evaluationResult, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create Flag */}
        {activeTab === 'create' && (
          <div className="tab-content">
            <h2>Create New Flag</h2>
            <div className="section">
              <input
                type="text"
                placeholder="Flag name (e.g., new_checkout)"
                value={newFlagName}
                onChange={(e) => setNewFlagName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Description"
                value={newFlagDesc}
                onChange={(e) => setNewFlagDesc(e.target.value)}
              />
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={newFlagEnabled}
                    onChange={(e) => setNewFlagEnabled(e.target.checked)}
                  />
                  Enabled
                </label>
              </div>
              <div>
                <label>Rollout Percentage: {rolloutPercentage}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rolloutPercentage}
                  onChange={(e) => setRolloutPercentage(parseInt(e.target.value))}
                />
              </div>
              <button className="btn-primary" onClick={createFlag}>
                Create Flag
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Manage Flags */}
        {activeTab === 'manage' && (
          <div className="tab-content">
            <h2>Manage Feature Flags</h2>
            <div className="flags-grid">
              {Object.values(flags).map((flag) => (
                <div key={flag.name} className="flag-card">
                  <h3>{flag.name}</h3>
                  <p>{flag.description}</p>
                  <div className="flag-info">
                    <span className={flag.enabled ? 'badge-on' : 'badge-off'}>
                      {flag.enabled ? 'ON' : 'OFF'}
                    </span>
                    <span className="badge-rollout">
                      {flag.rollout_percentage}% rollout
                    </span>
                  </div>
                  {editingFlag === flag.name ? (
                    <div className="edit-mode">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={updateRollout}
                        onChange={(e) =>
                          setUpdateRollout(parseInt(e.target.value))
                        }
                      />
                      <button
                        className="btn-success"
                        onClick={() => updateFlag(flag.name, updateRollout)}
                      >
                        Save
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setEditingFlag(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="actions">
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setEditingFlag(flag.name);
                          setUpdateRollout(flag.rollout_percentage);
                        }}
                      >
                        Edit Rollout
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => deleteFlag(flag.name)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {Object.keys(flags).length === 0 && (
              <p className="empty">No flags yet. Create one in the Create Flag tab!</p>
            )}
          </div>
        )}

        {/* Tab 4: Audit Log */}
        {activeTab === 'audit' && (
          <div className="tab-content">
            <h2>Audit Log</h2>
            <div className="audit-log">
              {auditLog.length > 0 ? (
                auditLog.map((entry, idx) => (
                  <div key={idx} className="audit-entry">
                    <span className="timestamp">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="event">{entry.event}</span>
                    {entry.details && (
                      <span className="details">{entry.details}</span>
                    )}
                  </div>
                ))
              ) : (
                <p>No audit events yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message && <div className="message">{message}</div>}

      {/* Footer */}
      <footer className="footer">
        <button className="btn-danger" onClick={clearData}>
          Clear All Data
        </button>
        <p>Feature Flags Demo - Port 4004</p>
      </footer>
    </div>
  );
}
