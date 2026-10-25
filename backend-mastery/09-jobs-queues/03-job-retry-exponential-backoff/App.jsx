import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4003/api';

const BACKOFF_STRATEGIES = {
  'exponential': 'Delay doubles with each retry',
  'linear': 'Delay increases linearly',
  'fibonacci': 'Delay follows fibonacci sequence',
  'fixed': 'Constant delay between retries'
};

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState('exponential');
  const [attempts, setAttempts] = useState('5');
  const [baseDelay, setBaseDelay] = useState('2000');
  const [delayCalculation, setDelayCalculation] = useState([]);
  const [response, setResponse] = useState(null);
  const [jobType, setJobType] = useState('email');
  const [emailData, setEmailData] = useState({ to: '', subject: '' });
  const [apiData, setApiData] = useState({ url: '', method: 'GET' });

  useEffect(() => {
    loadDashboard();
    calculateDelays();
    const interval = setInterval(loadDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    calculateDelays();
  }, [selectedStrategy, attempts, baseDelay]);

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      const data = await res.json();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const calculateDelays = async () => {
    try {
      const res = await fetch(`${API_BASE}/calculate-backoff?strategy=${selectedStrategy}&attempt=${attempts}&baseDelay=${baseDelay}`);
      const data = await res.json();
      setDelayCalculation(data.delays || []);
    } catch (error) {
      console.error('Error calculating delays:', error);
    }
  };

  const submitEmailJob = async () => {
    if (!emailData.to || !emailData.subject) {
      setResponse({ error: 'Email and subject required' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/submit/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailData,
          body: 'Test email content',
          maxAttempts: parseInt(attempts),
          baseDelay: parseInt(baseDelay)
        })
      });
      const data = await res.json();
      setResponse(data);
      if (data.success) {
        setEmailData({ to: '', subject: '' });
        loadDashboard();
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const submitApiJob = async () => {
    if (!apiData.url) {
      setResponse({ error: 'URL required' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/submit/api-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...apiData,
          maxRetries: parseInt(attempts),
          backoffType: selectedStrategy
        })
      });
      const data = await res.json();
      setResponse(data);
      if (data.success) {
        setApiData({ url: '', method: 'GET' });
        loadDashboard();
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="app">
      <header>
        <h1>⏱️ Job Retry with Exponential Backoff</h1>
        <p>Intelligent retry strategies with configurable backoff delays</p>
      </header>

      <main>
        {/* Strategy Selection */}
        <section className="strategy-section">
          <h2>Backoff Strategy Configuration</h2>
          <div className="config-grid">
            <div className="config-item">
              <label>Strategy</label>
              <select value={selectedStrategy} onChange={(e) => setSelectedStrategy(e.target.value)}>
                {Object.entries(BACKOFF_STRATEGIES).map(([key, desc]) => (
                  <option key={key} value={key}>{key} - {desc}</option>
                ))}
              </select>
            </div>
            <div className="config-item">
              <label>Max Attempts</label>
              <select value={attempts} onChange={(e) => setAttempts(e.target.value)}>
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="config-item">
              <label>Base Delay (ms)</label>
              <select value={baseDelay} onChange={(e) => setBaseDelay(e.target.value)}>
                {[500, 1000, 2000, 5000, 10000].map(d => (
                  <option key={d} value={d}>{d}ms</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Delay Visualization */}
        <section className="delays-section">
          <h2>Calculated Retry Delays</h2>
          <div className="delays-chart">
            {delayCalculation.map((delay) => (
              <div key={delay.attempt} className="delay-bar-wrapper">
                <div className="delay-label">Attempt {delay.attempt}</div>
                <div className="delay-bar-container">
                  <div 
                    className="delay-bar" 
                    style={{ width: `${Math.min(100, (delay.delayMs / 50000) * 100)}%` }}
                  >
                    <span className="delay-text">{delay.delaySeconds}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit Job */}
        <section className="submit-section">
          <h2>Submit Job for Testing</h2>
          <div className="job-type-selector">
            <button 
              className={`tab ${jobType === 'email' ? 'active' : ''}`}
              onClick={() => setJobType('email')}
            >
              📧 Email Job
            </button>
            <button 
              className={`tab ${jobType === 'api' ? 'active' : ''}`}
              onClick={() => setJobType('api')}
            >
              🌐 API Call Job
            </button>
          </div>

          {jobType === 'email' ? (
            <div className="form">
              <input
                type="email"
                placeholder="Email address"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              />
              <input
                type="text"
                placeholder="Subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              />
              <button onClick={submitEmailJob} className="btn-primary">Submit Email Job</button>
            </div>
          ) : (
            <div className="form">
              <input
                type="url"
                placeholder="API URL"
                value={apiData.url}
                onChange={(e) => setApiData({ ...apiData, url: e.target.value })}
              />
              <select value={apiData.method} onChange={(e) => setApiData({ ...apiData, method: e.target.value })}>
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
              <button onClick={submitApiJob} className="btn-primary">Submit API Job</button>
            </div>
          )}
        </section>

        {/* Dashboard */}
        {dashboard && (
          <section className="dashboard-section">
            <h2>Queue Status</h2>
            <div className="queue-stats">
              {Object.entries(dashboard.queues).map(([qName, stats]) => (
                <div key={qName} className="queue-card">
                  <h3>{qName.replace('-', ' ')}</h3>
                  <div className="stats">
                    <div className="stat">
                      <span className="label">Total</span>
                      <span className="value">{stats.total}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Active</span>
                      <span className="value active">{stats.active}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Completed</span>
                      <span className="value success">{stats.completed}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Failed</span>
                      <span className="value error">{stats.failed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Response */}
        {response && (
          <section className="response-section">
            <h3>Response</h3>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </section>
        )}
      </main>
    </div>
  );
}

