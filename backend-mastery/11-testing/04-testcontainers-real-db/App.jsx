import React, { useState } from 'react';
function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const executeTest = async (endpoint) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4004/api${endpoint}`);
      const data = await response.json();
      setResults(prev => [{ ts: new Date().toLocaleTimeString(), ep: endpoint, ok: response.ok, data }, ...prev.slice(0, 9)]);
    } catch (e) {
      setResults(prev => [{ ts: new Date().toLocaleTimeString(), ep: endpoint, err: true }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Testcontainers: Real Database Testing - Module 04</h1>
      <button onClick={() => executeTest('/db/users')} disabled={loading}>Get Users</button>
      <button onClick={() => executeTest('/db/create')} disabled={loading}>Create User</button>
      <button onClick={() => executeTest('/db/transactions')} disabled={loading}>Test Transaction</button>
      <div style={{ marginTop: '2rem' }}>
        {results.map((r, i) => (<div key={i} style={{ padding: '0.5rem', margin: '0.5rem', background: r.ok ? '#d4edda' : '#f8d7da' }}>{r.ts} - {r.ep} {r.ok ? '✓' : '✗'}</div>))}
      </div>
    </div>
  );
}
export default App;
