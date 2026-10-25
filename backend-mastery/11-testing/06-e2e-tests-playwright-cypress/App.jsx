import React, { useState } from 'react';
function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const executeTest = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    try {
      const options = { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body ? JSON.stringify(body) : undefined };
      const response = await fetch(`http://localhost:4006/api${endpoint}`, options);
      const data = await response.json();
      if (data.token) setToken(data.token);
      setResults(prev => [{ ts: new Date().toLocaleTimeString(), ep: endpoint, ok: response.ok, data }, ...prev.slice(0, 9)]);
    } catch (e) {
      setResults(prev => [{ ts: new Date().toLocaleTimeString(), ep: endpoint, err: true }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ padding: '2rem' }}>
      <h1>E2E Testing with Playwright & Cypress - Module 06</h1>
      <button onClick={() => executeTest('/login', 'POST', { email: 'test@test.com', password: 'pass' })} disabled={loading}>Login</button>
      <button onClick={() => executeTest('/profile')} disabled={loading}>Profile</button>
      <button onClick={() => executeTest('/logout', 'POST')} disabled={loading || !token}>Logout</button>
      <div style={{ marginTop: '2rem' }}>
        {results.map((r, i) => (<div key={i} style={{ padding: '0.5rem', margin: '0.5rem', background: r.ok ? '#d4edda' : '#f8d7da' }}>{r.ts} - {r.ep} {r.ok ? '✓' : '✗'}</div>))}
      </div>
    </div>
  );
}
export default App;
