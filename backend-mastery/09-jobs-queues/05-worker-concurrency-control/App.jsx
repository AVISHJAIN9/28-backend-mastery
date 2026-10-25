import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4005/api';

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [response, setResponse] = useState(null);
  const [formData, setFormData] = useState({
    taskType: 'io-intensive',
    duration: 5000,
    priority: 'normal'
  });
  const [selectedQueue, setSelectedQueue] = useState('high-concurrency');

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 3000);
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

  const submitJob = async () => {
    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          queueName: selectedQueue
        })
      });
      const data = await res.json();
      setResponse(data);
      if (data.success) loadDashboard();
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const getRecommendation = async () => {
    try {
      const res = await fetch(`${API_BASE}/recommendation?systemType=${formData.taskType}`);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="container">
      <h1>05 - Worker Concurrency Control</h1>

      {dashboard && (
        <div className="dashboard">
          <h2>System Dashboard</h2>
          <div className="stats">
            <div className="stat-box">
              <label>Active Workers</label>
              <span>{dashboard.activeWorkers}</span>
            </div>
            <div className="stat-box">
              <label>Pending Jobs</label>
              <span>{dashboard.pendingJobs}</span>
            </div>
            <div className="stat-box">
              <label>CPU Usage</label>
              <span>{dashboard.cpuUsage}%</span>
            </div>
            <div className="stat-box">
              <label>Memory Usage</label>
              <span>{dashboard.memoryUsage}%</span>
            </div>
          </div>

          <h3>Queue Status</h3>
          <div className="queues">
            {dashboard.queues && Object.entries(dashboard.queues).map(([name, stats]) => (
              <div key={name} className="queue-card">
                <h4>{name}</h4>
                <p>Workers: {stats.workers}</p>
                <p>Jobs Processed: {stats.jobsProcessed}</p>
                <p>Avg Duration: {stats.avgDuration}ms</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <h2>Submit Task</h2>
        <label>
          Task Type:
          <select value={formData.taskType} onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}>
            <option>cpu-intensive</option>
            <option>io-intensive</option>
            <option>memory-intensive</option>
          </select>
        </label>

        <label>
          Duration (ms):
          <input
            type="number"
            min="100"
            max="30000"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
          />
        </label>

        <label>
          Priority:
          <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
            <option>high</option>
            <option>normal</option>
            <option>low</option>
          </select>
        </label>

        <label>
          Queue:
          <select value={selectedQueue} onChange={(e) => setSelectedQueue(e.target.value)}>
            <option>high-concurrency</option>
            <option>low-concurrency</option>
            <option>adaptive</option>
          </select>
        </label>

        <button onClick={submitJob}>Submit Task</button>
        <button onClick={getRecommendation}>Get Recommendation</button>
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

