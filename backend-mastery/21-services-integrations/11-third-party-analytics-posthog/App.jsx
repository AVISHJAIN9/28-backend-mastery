import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6311';

function App() {
  const [eventName, setEventName] = useState('');
  const [userId, setUserId] = useState('');
  const [response, setResponse] = useState(null);

  const callAPI = async (path, body) => {
    const res = await fetch(`${API_BASE}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setResponse(await res.json());
  };

  return (
    <div className="app">
      <header className="header"><h1>📊 PostHog Analytics</h1></header>
      <div className="container">
        <h3>Event Tracking</h3>
        <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Event name" />
        <button onClick={() => callAPI('/capture', { event: eventName, properties: {} })}>Capture Event</button>
        <hr />
        <h3>User Identification</h3>
        <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" />
        <button onClick={() => callAPI('/identify', { userId, properties: {} })}>Identify User</button>
        <button onClick={() => callAPI('/analytics', {})}>View Analytics</button>
      </div>
      {response && <div className="response-panel"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
}

export default App;
