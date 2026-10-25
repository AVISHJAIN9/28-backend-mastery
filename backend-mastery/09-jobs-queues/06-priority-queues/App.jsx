import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4006/api';

const PRIORITIES = {
  'critical': { level: 0, color: '#d32f2f' },
  'high': { level: 1, color: '#f57c00' },
  'normal': { level: 5, color: '#1976d2' },
  'low': { level: 10, color: '#388e3c' }
};

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [response, setResponse] = useState(null);
  const [formData, setFormData] = useState({
    jobName: '',
    priority: 'normal',
    payload: {}
  });

  useEffect(() => {
    loadDashboard();
    loadQueue();
    const interval = setInterval(() => {
      loadDashboard();
      loadQueue();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      const data = await res.json();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadQueue = async () => {
    try {
      const res = await fetch(`${API_BASE}/queue`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  };

  const submitJob = async () => {
    if (!formData.jobName) {
      setResponse({ error: 'Job name required' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResponse(data);
      if (data.success) {
        setFormData({ jobName: '', priority: 'normal', payload: {} });
        loadDashboard();
        loadQueue();
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const getNextJob = async () => {
    try {
      const res = await fetch(`${API_BASE}/next-job`);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="container">
      <h1>06 - Priority Queues</h1>

      {dashboard && (
        <div className="dashboard">
          <h2>Priority Distribution</h2>
          <div className="stats">
            {Object.entries(dashboard.priorityDistribution || {}).map(([priority, count]) => (
              <div key={priority} className="stat-box" style={{ borderLeft: `4px solid ${PRIORITIES[priority]?.color}` }}>
                <label>{priority.charAt(0).toUpperCase() + priority.slice(1)}</label>
                <span>{count} jobs</span>
              </div>
            ))}
          </div>
          <div className="stat-box">
            <label>Total Jobs</label>
            <span>{dashboard.totalJobs}</span>
          </div>
        </div>
      )}

      <div className="section">
        <h2>Submit Priority Job</h2>
        <input
          placeholder="Job Name"
          value={formData.jobName}
          onChange={(e) => setFormData({ ...formData, jobName: e.target.value })}
        />

        <label>
          Priority:
          <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
            {Object.keys(PRIORITIES).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <button onClick={submitJob}>Submit Job</button>
        <button onClick={getNextJob}>Get Next Job</button>
      </div>

      <div className="section">
        <h2>Queue ({jobs.length} jobs)</h2>
        <table>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Priority</th>
              <th>Name</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} style={{ borderLeft: `3px solid ${PRIORITIES[job.priority]?.color}` }}>
                <td>{job.id}</td>
                <td><span style={{ background: PRIORITIES[job.priority]?.color, color: 'white', padding: '3px 8px', borderRadius: '3px' }}>{job.priority}</span></td>
                <td>{job.name}</td>
                <td>{job.status}</td>
                <td>{new Date(job.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {response && (
        <div className={`response ${response.error ? 'error' : 'success'}`}>
          <pre>{JSON.stringify(response, null, 2)}</pre>
          <button onClick={() => setResponse(null)}>Clear</button>
        </div>
      )}
    </div>
  );
}

