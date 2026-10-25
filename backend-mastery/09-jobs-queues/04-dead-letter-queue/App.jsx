import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4004/api';

export default function App() {
  const [dlqJobs, setDlqJobs] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [response, setResponse] = useState(null);
  const [orderData, setOrderData] = useState({
    orderId: '',
    customerId: '',
    totalAmount: 0
  });

  useEffect(() => {
    loadDashboard();
    loadDLQ();
    const interval = setInterval(() => {
      loadDashboard();
      loadDLQ();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/dlq-dashboard`);
      const data = await res.json();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setResponse({ error: error.message });
    }
  };

  const loadDLQ = async () => {
    try {
      const res = await fetch(`${API_BASE}/dlq`);
      const data = await res.json();
      setDlqJobs(data.jobs || []);
    } catch (error) {
      console.error('Error loading DLQ:', error);
      setResponse({ error: error.message });
    }
  };

  const submitOrder = async () => {
    if (!orderData.orderId || !orderData.customerId || orderData.totalAmount <= 0) {
      setResponse({ error: 'All fields required' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/submit-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      setResponse(data);
      if (data.success) {
        setOrderData({ orderId: '', customerId: '', totalAmount: 0 });
        loadDashboard();
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const retryJob = async (jobId) => {
    try {
      const res = await fetch(`${API_BASE}/dlq/${jobId}/retry`, {
        method: 'POST'
      });
      const data = await res.json();
      setResponse(data);
      loadDashboard();
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const deleteJob = async (jobId) => {
    try {
      const res = await fetch(`${API_BASE}/dlq/${jobId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      setResponse(data);
      loadDLQ();
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="container">
      <h1>04 - Dead Letter Queue Management</h1>

      {dashboard && (
        <div className="dashboard">
          <h2>Dashboard</h2>
          <div className="stats">
            <div className="stat-box">
              <label>Total Dead Letters</label>
              <span>{dashboard.totalDeadLetters}</span>
            </div>
            <div className="stat-box">
              <label>Pending Retry</label>
              <span>{dashboard.pendingRetry}</span>
            </div>
            <div className="stat-box">
              <label>Failed (Max Attempts)</label>
              <span>{dashboard.failedMaxAttempts}</span>
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <h2>Submit Order</h2>
        <input
          placeholder="Order ID"
          value={orderData.orderId}
          onChange={(e) => setOrderData({ ...orderData, orderId: e.target.value })}
        />
        <input
          placeholder="Customer ID"
          value={orderData.customerId}
          onChange={(e) => setOrderData({ ...orderData, customerId: e.target.value })}
        />
        <input
          type="number"
          placeholder="Total Amount"
          value={orderData.totalAmount}
          onChange={(e) => setOrderData({ ...orderData, totalAmount: parseFloat(e.target.value) })}
        />
        <button onClick={submitOrder}>Submit Order</button>
      </div>

      <div className="section">
        <h2>Dead Letter Queue ({dlqJobs.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Status</th>
              <th>Failed Reason</th>
              <th>Attempts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dlqJobs.map((job) => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td>{job.status}</td>
                <td>{job.failedReason}</td>
                <td>{job.failedAttempts}</td>
                <td>
                  <button onClick={() => retryJob(job.id)}>Retry</button>
                  <button onClick={() => deleteJob(job.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {response && (
        <div className={`response ${response.error ? 'error' : 'success'}`}>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

