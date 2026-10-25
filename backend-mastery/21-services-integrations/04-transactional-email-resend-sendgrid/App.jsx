import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6304';

function App() {
  const [activeTab, setActiveTab] = useState('send');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);

  const callAPI = async (path, method = 'GET', body = null) => {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      };
      const res = await fetch(`${API_BASE}${path}`, options);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>📧 Transactional Email</h1>
      </header>
      <div className="container">
        <div className="form-group">
          <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Email" />
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" rows="6" />
          <button onClick={() => callAPI('/api/send', 'POST', { to, subject, body })} className="btn-primary">Send Email</button>
        </div>
      </div>
      {response && <div className="response-panel"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
}

export default App;

