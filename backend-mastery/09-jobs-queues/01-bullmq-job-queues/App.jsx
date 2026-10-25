import React, { useState, useEffect } from 'react';
import './App.css';

export default function BullMQApp() {
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [report, setReport] = useState({ userId: '', reportType: 'sales', format: 'pdf' });
  const [queueName, setQueueName] = useState('emails');
  const [jobId, setJobId] = useState('');
  const [response, setResponse] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('add-job');

  const API_URL = 'http://localhost:4009';

  // Add Email Job
  const addEmailJob = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/jobs/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(email)
      });
      const data = await res.json();
      setResponse(data);
      if (data.jobId) setJobId(data.jobId);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  // Add Report Job
  const addReportJob = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/jobs/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      const data = await res.json();
      setResponse(data);
      if (data.jobId) setJobId(data.jobId);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  // Get Queue Stats
  const getQueueStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/queues/${queueName}/stats`);
      const data = await res.json();
      setQueueStats(data);
      setResponse(null);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  // Get Job Status
  const getJobStatus = async () => {
    if (!jobId) {
      setResponse({ error: 'Please enter a Job ID' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}/status/${queueName}`);
      const data = await res.json();
      setJobStatus(data);
      setResponse(null);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  // Retry Job
  const retryJob = async () => {
    if (!jobId) {
      setResponse({ error: 'Please enter a Job ID' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}/retry/${queueName}`, {
        method: 'POST'
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  // Remove Job
  const removeJob = async () => {
    if (!jobId) {
      setResponse({ error: 'Please enter a Job ID' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}/${queueName}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  // Clear Queue
  const clearQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/queues/${queueName}/clear`, {
        method: 'DELETE'
      });
      const data = await res.json();
      setResponse(data);
      setQueueStats(null);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <header>
        <h1>🚀 BullMQ Job Queue Manager</h1>
        <p>Add, Monitor, and Control Background Jobs</p>
      </header>

      <div className="container">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'add-job' ? 'active' : ''}`}
            onClick={() => setActiveTab('add-job')}
          >
            ➕ Add Job
          </button>
          <button
            className={`tab ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            📊 Monitor
          </button>
          <button
            className={`tab ${activeTab === 'control' ? 'active' : ''}`}
            onClick={() => setActiveTab('control')}
          >
            ⚙️ Control
          </button>
        </div>

        {/* Add Job Tab */}
        {activeTab === 'add-job' && (
          <div className="panel">
            <h2>Add New Job</h2>

            {/* Email Job */}
            <div className="section">
              <h3>📧 Email Job</h3>
              <input
                type="email"
                placeholder="Email address"
                value={email.to}
                onChange={(e) => setEmail({ ...email, to: e.target.value })}
              />
              <input
                type="text"
                placeholder="Subject"
                value={email.subject}
                onChange={(e) => setEmail({ ...email, subject: e.target.value })}
              />
              <textarea
                placeholder="Email body"
                value={email.body}
                onChange={(e) => setEmail({ ...email, body: e.target.value })}
              />
              <button onClick={addEmailJob} disabled={loading}>
                {loading ? '⏳ Adding...' : 'Add Email Job'}
              </button>
            </div>

            {/* Report Job */}
            <div className="section">
              <h3>📄 Report Job</h3>
              <input
                type="number"
                placeholder="User ID"
                value={report.userId}
                onChange={(e) => setReport({ ...report, userId: e.target.value })}
              />
              <select
                value={report.reportType}
                onChange={(e) => setReport({ ...report, reportType: e.target.value })}
              >
                <option>sales</option>
                <option>analytics</option>
                <option>inventory</option>
                <option>financial</option>
              </select>
              <select
                value={report.format}
                onChange={(e) => setReport({ ...report, format: e.target.value })}
              >
                <option>pdf</option>
                <option>csv</option>
                <option>excel</option>
              </select>
              <button onClick={addReportJob} disabled={loading}>
                {loading ? '⏳ Adding...' : 'Add Report Job'}
              </button>
            </div>
          </div>
        )}

        {/* Monitor Tab */}
        {activeTab === 'monitor' && (
          <div className="panel">
            <h2>Monitor Queue</h2>

            <div className="section">
              <h3>Queue Selection</h3>
              <select value={queueName} onChange={(e) => setQueueName(e.target.value)}>
                <option>emails</option>
                <option>reports</option>
                <option>imports</option>
                <option>batch</option>
              </select>
              <button onClick={getQueueStats} disabled={loading}>
                {loading ? '⏳ Loading...' : 'Get Queue Stats'}
              </button>
            </div>

            {queueStats && (
              <div className="section">
                <h3>Queue Statistics</h3>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="label">Pending</span>
                    <span className="value">{queueStats.stats.wait}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Active</span>
                    <span className="value">{queueStats.stats.active}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Completed</span>
                    <span className="value">{queueStats.stats.completed}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Failed</span>
                    <span className="value">{queueStats.stats.failed}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Delayed</span>
                    <span className="value">{queueStats.stats.delayed}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Workers</span>
                    <span className="value">{queueStats.workersCount}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="section">
              <h3>Job Status</h3>
              <input
                type="text"
                placeholder="Job ID"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
              />
              <button onClick={getJobStatus} disabled={loading}>
                {loading ? '⏳ Loading...' : 'Check Job Status'}
              </button>
            </div>

            {jobStatus && (
              <div className="section">
                <h3>Job Details</h3>
                <pre>{JSON.stringify(jobStatus, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Control Tab */}
        {activeTab === 'control' && (
          <div className="panel">
            <h2>Control Jobs</h2>

            <div className="section">
              <h3>Job Control</h3>
              <select value={queueName} onChange={(e) => setQueueName(e.target.value)}>
                <option>emails</option>
                <option>reports</option>
                <option>imports</option>
                <option>batch</option>
              </select>
              <input
                type="text"
                placeholder="Job ID"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
              />
              <div className="button-group">
                <button onClick={retryJob} disabled={loading} className="btn-retry">
                  🔄 Retry Job
                </button>
                <button onClick={removeJob} disabled={loading} className="btn-delete">
                  ❌ Remove Job
                </button>
              </div>
            </div>

            <div className="section">
              <h3>Queue Operations</h3>
              <button onClick={clearQueue} disabled={loading} className="btn-danger">
                🗑️ Clear All Jobs
              </button>
            </div>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className={`response ${response.error ? 'error' : 'success'}`}>
            <h3>{response.error ? '❌ Error' : '✅ Success'}</h3>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

