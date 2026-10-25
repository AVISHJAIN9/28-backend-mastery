import React, { useState } from 'react';
function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const executeTest = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    try {
      const options = { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined };
      const response = await fetch(`http://localhost:4011/api${endpoint}`, options);
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
      <h1>Load Testing with K6 & Artillery - Module 11</h1>
      <button onClick={() => executeTest('/users/1')} disabled={loading}>Get User</button>
      <button onClick={() => executeTest('/users', 'POST', { name: 'User' + userCount, email: `user${userCount}@test.com` })} disabled={loading}>Create User</button>
      <button onClick={() => executeTest('/stats')} disabled={loading}>Get Stats</button>
      <button onClick={() => { setUserCount(c => c + 1); }} style={{ marginLeft: '1rem' }}>User #{userCount}</button>
      <div style={{ marginTop: '2rem' }}>
        {results.map((r, i) => (<div key={i} style={{ padding: '0.5rem', margin: '0.5rem', background: r.ok ? '#d4edda' : '#f8d7da' }}>{r.ts} - {r.ep} {r.ok ? '✓' : '✗'}</div>))}
      </div>
    </div>
  );
}
export default App;
