import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4002/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('queue');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [dlqItems, setDlqItems] = useState([]);
  const [bounces, setBounces] = useState([]);
  const [stats, setStats] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    recipientEmail: '',
    subject: 'Test Email',
    body: '<h1>Test Email</h1><p>This is a test email from the queue system.</p>',
    template: 'custom',
    priority: 5,
    maxAttempts: 5,
    backoffStrategy: 'exponential',
    metadata: {}
  });

  const [bounceForm, setBounceForm] = useState({
    email: '',
    bounceType: 'hard_bounce',
    bounceSubType: 'permanent',
    jobId: null
  });

  // Load initial data
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    await fetchJobs();
    await fetchDLQ();
    await fetchStats();
    await fetchBounces();
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/queue/jobs?limit=50`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchDLQ = async () => {
    try {
      const res = await fetch(`${API_BASE}/dlq/items`);
      const data = await res.json();
      setDlqItems(data.items || []);
    } catch (error) {
      console.error('Error fetching DLQ:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/queue/stats`);
      const data = await res.json();
      setStats(data.statistics || null);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBounces = async () => {
    try {
      const res = await fetch(`${API_BASE}/bounces/log`);
      const data = await res.json();
      setBounces(data.bounces || []);
    } catch (error) {
      console.error('Error fetching bounces:', error);
    }
  };

  const makeRequest = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    setResponse(null);

    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await res.json();

      setResponse({
        status: res.status,
        data,
        timestamp: new Date().toLocaleTimeString()
      });

      // Refresh data after successful operations
      setTimeout(refreshData, 500);
    } catch (error) {
      setResponse({
        status: 'error',
        data: { error: error.message },
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQueueEmail = async (e) => {
    e.preventDefault();
    await makeRequest('/queue/add', 'POST', {
      recipientEmail: formData.recipientEmail,
      subject: formData.subject,
      body: formData.body,
      template: formData.template,
      priority: parseInt(formData.priority),
      maxAttempts: parseInt(formData.maxAttempts),
      backoffStrategy: formData.backoffStrategy,
      metadata: formData.metadata
    });
    setFormData(prev => ({ ...prev, recipientEmail: '' }));
  };

  const handleProcessQueue = async () => {
    await makeRequest('/queue/process', 'POST', { maxJobs: 10 });
  };

  const handleRetryFailed = async () => {
    await makeRequest('/queue/retry-failed', 'POST', {});
  };

  const handleRetryDLQ = async (dlqId) => {
    await makeRequest(`/dlq/retry/${dlqId}`, 'POST', {});
  };

  const handleBounceWebhook = async (e) => {
    e.preventDefault();
    await makeRequest('/bounces/webhook', 'POST', {
      email: bounceForm.email,
      bounceType: bounceForm.bounceType,
      bounceSubType: bounceForm.bounceSubType,
      jobId: bounceForm.jobId ? parseInt(bounceForm.jobId) : null
    });
    setBounceForm(prev => ({ ...prev, email: '', jobId: null }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBounceChange = (e) => {
    const { name, value } = e.target;
    setBounceForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📧 Email Queue Management System</h1>
        <p>Module 02: Email Queuing, Async Retry & Bounce Handling</p>
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          Queue Management
        </button>
        <button 
          className={`tab ${activeTab === 'dlq' ? 'active' : ''}`}
          onClick={() => setActiveTab('dlq')}
        >
          Dead Letter Queue
        </button>
        <button 
          className={`tab ${activeTab === 'bounces' ? 'active' : ''}`}
          onClick={() => setActiveTab('bounces')}
        >
          Bounce Handling
        </button>
        <button 
          className={`tab ${activeTab === 'monitor' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitor')}
        >
          Monitor
        </button>
      </div>

      <div className="content">
        {/* Queue Management Tab */}
        {activeTab === 'queue' && (
          <div className="section">
            <h2>Queue Email for Sending</h2>
            
            <form onSubmit={handleQueueEmail} className="form">
              <div className="form-group">
                <label>Recipient Email *</label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleInputChange}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Email subject"
                  required
                />
              </div>

              <div className="form-group">
                <label>Body (HTML)</label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  placeholder="Email HTML content"
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority (1-10)</label>
                  <input
                    type="number"
                    name="priority"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Max Attempts</label>
                  <input
                    type="number"
                    name="maxAttempts"
                    min="1"
                    value={formData.maxAttempts}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Backoff Strategy</label>
                  <select
                    name="backoffStrategy"
                    value={formData.backoffStrategy}
                    onChange={handleInputChange}
                  >
                    <option value="exponential">Exponential</option>
                    <option value="linear">Linear</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Queuing...' : 'Queue Email'}
              </button>
            </form>

            <div className="actions">
              <button 
                onClick={handleProcessQueue}
                disabled={loading}
                className="btn btn-success"
              >
                Process Queue (Send Emails)
              </button>
              <button 
                onClick={handleRetryFailed}
                disabled={loading}
                className="btn btn-warning"
              >
                Retry Failed Jobs
              </button>
            </div>

            <div className="jobs-list">
              <h3>Queue Jobs ({jobs.length})</h3>
              {jobs.length === 0 ? (
                <p className="empty">No jobs in queue</p>
              ) : (
                <div className="table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Attempts</th>
                        <th>Next Retry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map(job => (
                        <tr key={job.id} className={`status-${job.status}`}>
                          <td>{job.id}</td>
                          <td>{job.recipientEmail}</td>
                          <td>{job.subject.substring(0, 30)}</td>
                          <td><span className={`badge badge-${job.status}`}>{job.status}</span></td>
                          <td>{job.priority}</td>
                          <td>{job.attempts}/{job.maxAttempts}</td>
                          <td>{job.nextRetry ? new Date(job.nextRetry).toLocaleTimeString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dead Letter Queue Tab */}
        {activeTab === 'dlq' && (
          <div className="section">
            <h2>Dead Letter Queue</h2>
            
            <div className="dlq-list">
              {dlqItems.length === 0 ? (
                <p className="empty">No items in DLQ (Good!)</p>
              ) : (
                <div className="table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Reason</th>
                        <th>Moved At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dlqItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.recipientEmail}</td>
                          <td>{item.subject.substring(0, 30)}</td>
                          <td>{item.reason}</td>
                          <td>{new Date(item.movedAt).toLocaleString()}</td>
                          <td>
                            <button
                              onClick={() => handleRetryDLQ(item.id)}
                              disabled={loading || item.manuallyRetried}
                              className="btn btn-small btn-info"
                            >
                              {item.manuallyRetried ? 'Retried' : 'Retry'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bounce Handling Tab */}
        {activeTab === 'bounces' && (
          <div className="section">
            <h2>Bounce Handling</h2>

            <form onSubmit={handleBounceWebhook} className="form">
              <div className="form-group">
                <label>Bounced Email *</label>
                <input
                  type="email"
                  name="email"
                  value={bounceForm.email}
                  onChange={handleBounceChange}
                  placeholder="bounced@example.com"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Bounce Type</label>
                  <select
                    name="bounceType"
                    value={bounceForm.bounceType}
                    onChange={handleBounceChange}
                  >
                    <option value="hard_bounce">Hard Bounce</option>
                    <option value="soft_bounce">Soft Bounce</option>
                    <option value="complaint">Complaint</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Bounce SubType</label>
                  <select
                    name="bounceSubType"
                    value={bounceForm.bounceSubType}
                    onChange={handleBounceChange}
                  >
                    <option value="permanent">Permanent</option>
                    <option value="transient">Transient</option>
                    <option value="suppressed">Suppressed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Job ID (Optional)</label>
                  <input
                    type="number"
                    name="jobId"
                    value={bounceForm.jobId}
                    onChange={handleBounceChange}
                    placeholder="Job ID"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Logging Bounce...' : 'Log Bounce'}
              </button>
            </form>

            <div className="bounces-list">
              <h3>Bounce History ({bounces.length})</h3>
              {bounces.length === 0 ? (
                <p className="empty">No bounces logged</p>
              ) : (
                <div className="table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Type</th>
                        <th>SubType</th>
                        <th>Provider</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bounces.map(bounce => (
                        <tr key={bounce.id}>
                          <td>{bounce.id}</td>
                          <td>{bounce.email}</td>
                          <td><span className="badge badge-danger">{bounce.bounceType}</span></td>
                          <td>{bounce.bounceSubType}</td>
                          <td>{bounce.provider}</td>
                          <td>{new Date(bounce.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monitor Tab */}
        {activeTab === 'monitor' && (
          <div className="section">
            <h2>Queue Statistics</h2>

            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Jobs</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{stats.byStatus.queued}</div>
                  <div className="stat-label">Queued</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{stats.byStatus.processing}</div>
                  <div className="stat-label">Processing</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{stats.byStatus.sent}</div>
                  <div className="stat-label">Sent</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{stats.byStatus.failed}</div>
                  <div className="stat-label">Failed</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{stats.byStatus.deadLetter}</div>
                  <div className="stat-label">Dead Letter</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{stats.avgAttempts}</div>
                  <div className="stat-label">Avg Attempts</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{stats.health.oldestJobAge}s</div>
                  <div className="stat-label">Oldest Job Age</div>
                </div>
              </div>
            )}

            <button 
              onClick={refreshData}
              disabled={loading}
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
            >
              Refresh Statistics
            </button>
          </div>
        )}
      </div>

      {/* Response Display */}
      {response && (
        <div className={`response response-${response.status >= 200 && response.status < 300 ? 'success' : 'error'}`}>
          <div className="response-header">
            <strong>Response ({response.status})</strong>
            <span className="response-time">{response.timestamp}</span>
          </div>
          <pre className="response-body">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

