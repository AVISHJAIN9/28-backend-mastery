import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4008/api';

const COMMON_EVENTS = [
  'user.registered',
  'user.deleted',
  'order.created',
  'order.completed',
  'payment.processed',
  'shipment.dispatched',
  'notification.sent'
];

export default function App() {
  const [events, setEvents] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [response, setResponse] = useState(null);
  const [publishFormData, setPublishFormData] = useState({
    eventName: 'user.registered',
    source: 'auth-service',
    data: '{}'
  });
  const [subscribeFormData, setSubscribeFormData] = useState({
    eventName: 'user.registered',
    subscriberId: ''
  });

  useEffect(() => {
    loadDashboard();
    loadEvents();
    loadSubscribers();
    const interval = setInterval(() => {
      loadDashboard();
      loadEvents();
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

  const loadEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/log?limit=50`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadSubscribers = async () => {
    try {
      const res = await fetch(`${API_BASE}/subscribers`);
      const data = await res.json();
      setSubscribers(data.subscribers || []);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    }
  };

  const publishEvent = async () => {
    try {
      const eventData = JSON.parse(publishFormData.data);
      const res = await fetch(`${API_BASE}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: publishFormData.eventName,
          source: publishFormData.source,
          data: eventData
        })
      });
      const data = await res.json();
      setResponse(data);
      if (data.success) {
        loadDashboard();
        loadEvents();
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const subscribeEvent = async () => {
    if (!subscribeFormData.subscriberId) {
      setResponse({ error: 'Subscriber ID required' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscribeFormData)
      });
      const data = await res.json();
      setResponse(data);
      if (data.success) {
        loadSubscribers();
        setSubscribeFormData({ ...subscribeFormData, subscriberId: '' });
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="container">
      <h1>08 - Event-Driven Architecture</h1>

      {dashboard && (
        <div className="dashboard">
          <h2>Event Dashboard</h2>
          <div className="stats">
            <div className="stat-box">
              <label>Total Events</label>
              <span>{dashboard.totalEvents}</span>
            </div>
            <div className="stat-box">
              <label>Event Types</label>
              <span>{dashboard.eventTypes}</span>
            </div>
            <div className="stat-box">
              <label>Total Subscribers</label>
              <span>{dashboard.totalSubscribers}</span>
            </div>
            <div className="stat-box">
              <label>Active Patterns</label>
              <span>{dashboard.activePatterns}</span>
            </div>
          </div>
        </div>
      )}

      <div className="section">
        <h2>Publish Event</h2>
        <label>
          Event:
          <select value={publishFormData.eventName} onChange={(e) => setPublishFormData({ ...publishFormData, eventName: e.target.value })}>
            {COMMON_EVENTS.map((event) => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </label>

        <input
          placeholder="Source Service"
          value={publishFormData.source}
          onChange={(e) => setPublishFormData({ ...publishFormData, source: e.target.value })}
        />

        <textarea
          placeholder='{"userId": "123", "email": "user@example.com"}'
          value={publishFormData.data}
          onChange={(e) => setPublishFormData({ ...publishFormData, data: e.target.value })}
          rows="4"
        />

        <button onClick={publishEvent}>Publish Event</button>
      </div>

      <div className="section">
        <h2>Subscribe to Event</h2>
        <label>
          Event:
          <select value={subscribeFormData.eventName} onChange={(e) => setSubscribeFormData({ ...subscribeFormData, eventName: e.target.value })}>
            {COMMON_EVENTS.map((event) => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </label>

        <input
          placeholder="Subscriber ID (e.g., email-service)"
          value={subscribeFormData.subscriberId}
          onChange={(e) => setSubscribeFormData({ ...subscribeFormData, subscriberId: e.target.value })}
        />

        <button onClick={subscribeEvent}>Subscribe</button>
      </div>

      <div className="section">
        <h2>Active Subscribers ({subscribers.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Subscriber ID</th>
              <th>Event</th>
              <th>Subscribed At</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub, idx) => (
              <tr key={idx}>
                <td>{sub.subscriberId}</td>
                <td>{sub.eventName}</td>
                <td>{new Date(sub.subscribedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section">
        <h2>Event Log ({events.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Source</th>
              <th>Time</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, idx) => (
              <tr key={idx}>
                <td>{event.eventName}</td>
                <td>{event.source}</td>
                <td>{new Date(event.timestamp).toLocaleTimeString()}</td>
                <td><code>{JSON.stringify(event.data).substring(0, 50)}...</code></td>
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

