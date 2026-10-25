import React, { useState } from 'react';
function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const executeTest = async (endpoint, body = null) => {
    setLoading(true);
    try {
      const options = { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined };
      const response = await fetch(`http://localhost:4012/api${endpoint}`, options);
      const data = await response.json();
      setResults(prev => [{ ts: new Date().toLocaleTimeString(), ep: endpoint, ok: response.ok, data: JSON.stringify(data) }, ...prev.slice(0, 9)]);
    } catch (e) {
      setResults(prev => [{ ts: new Date().toLocaleTimeString(), ep: endpoint, err: true }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Snapshot Testing & API Stability - Module 12</h1>
      <button onClick={() => executeTest('/users/1')} disabled={loading}>Get User Snapshot</button>
      <button onClick={() => executeTest('/users')} disabled={loading}>Get All Users</button>
      <button onClick={() => executeTest('/version')} disabled={loading}>API Version</button>
      <div style={{ marginTop: '2rem' }}>
        {results.map((r, i) => (<div key={i} style={{ padding: '0.5rem', margin: '0.5rem', background: r.ok ? '#d4edda' : '#f8d7da', maxHeight: '100px', overflow: 'auto', fontSize: '0.8rem' }}><strong>{r.ts}</strong> - {r.ep} {r.ok ? '✓' : '✗'}<br/>{typeof r.data === 'string' ? r.data.slice(0, 100) + '...' : r.data}</div>))}
      </div>
    </div>
  );
}
export default App;
