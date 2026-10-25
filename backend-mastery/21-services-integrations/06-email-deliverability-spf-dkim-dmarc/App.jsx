import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6306';

function App() {
  const [domain, setDomain] = useState('');
  const [response, setResponse] = useState(null);

  const callAPI = async (path, method = 'GET') => {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    const res = await fetch(`${API_BASE}/api${path}`, options);
    setResponse(await res.json());
  };

  return (
    <div className="app">
      <header className="header"><h1>📧 Email Deliverability</h1></header>
      <div className="container">
        <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="domain.com" />
        <button onClick={() => callAPI(`/spf/${domain}`)}>Get SPF Record</button>
        <button onClick={() => callAPI(`/dkim/${domain}/default`)}>Get DKIM Record</button>
        <button onClick={() => callAPI(`/dmarc/${domain}`)}>Get DMARC Record</button>
        <button onClick={() => callAPI(`/status/${domain}`)}>Check Status</button>
      </div>
      {response && <div className="response-panel"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
}

export default App;
