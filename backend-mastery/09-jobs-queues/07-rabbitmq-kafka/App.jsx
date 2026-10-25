import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4007/api';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [response, setResponse] = useState(null);
  const [formData, setFormData] = useState({
    broker: 'rabbitmq',
    exchange: 'orders',
    topic: 'orders',
    message: '{}'
  });

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 4000);
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

  const publishMessage = async () => {
    try {
      const messageData = JSON.parse(formData.message);
      const res = await fetch(`${API_BASE}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: formData.broker,
          exchange: formData.exchange,
          topic: formData.topic,
          message: messageData
        })
      });
      const data = await res.json();
      setResponse(data);
      if (data.success) loadDashboard();
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const getStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats?broker=${formData.broker}`);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const getConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/config?broker=${formData.broker}`);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="container">
      <h1>07 - RabbitMQ & Kafka</h1>

      {dashboard && (
        <div className="dashboard">
          <h2>Message Broker Dashboard</h2>
          <div className="stats">
            <div className="stat-box">
              <label>RabbitMQ Messages</label>
              <span>{dashboard.rabbitmqStats?.messagesPublished}</span>
            </div>
            <div className="stat-box">
              <label>Kafka Messages</label>
              <span>{dashboard.kafkaStats?.messagesPublished}</span>
            </div>
            <div className="stat-box">
              <label>Active Consumers</label>
              <span>{dashboard.activeConsumers}</span>
            </div>
            <div className="stat-box">
              <label>Total Topics</label>
              <span>{dashboard.totalTopics}</span>
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <h2>Publish Message</h2>
        <label>
          Broker:
          <select value={formData.broker} onChange={(e) => setFormData({ ...formData, broker: e.target.value })}>
            <option value="rabbitmq">RabbitMQ</option>
            <option value="kafka">Kafka</option>
          </select>
        </label>

        {formData.broker === 'rabbitmq' && (
          <input
            placeholder="Exchange"
            value={formData.exchange}
            onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
          />
        )}

        {formData.broker === 'kafka' && (
          <input
            placeholder="Topic"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          />
        )}

        <textarea
          placeholder='{"key": "value"}'
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows="4"
        />

        <button onClick={publishMessage}>Publish</button>
        <button onClick={getStats}>Get Stats</button>
        <button onClick={getConfig}>Get Config</button>
      </div>

      {response && (
        <div className={`response ${response.error ? 'error' : 'success'}`}>
          <pre>{JSON.stringify(response, null, 2)}</pre>
          <button onClick={() => setResponse(null)}>Clear</button>
        </div>
      )}

      <div className="section info">
        <h2>Broker Comparison</h2>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>RabbitMQ</th>
              <th>Kafka</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Message Ordering</td>
              <td>Per Queue</td>
              <td>Per Partition</td>
            </tr>
            <tr>
              <td>Throughput</td>
              <td>Medium</td>
              <td>High</td>
            </tr>
            <tr>
              <td>Use Case</td>
              <td>Task Queues</td>
              <td>Event Streams</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

