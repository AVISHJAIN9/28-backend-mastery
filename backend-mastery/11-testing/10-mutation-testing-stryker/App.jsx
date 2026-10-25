import React, { useState } from 'react';
function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const executeTest = async (endpoint, body = null) => {
    setLoading(true);
    try {
      const options = { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined };
      const response = await fetch(`http://localhost:4010/api${endpoint}`, options);
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
      <h1>Mutation Testing with Stryker - Module 10</h1>
      <button onClick={() => executeTest('/math/add', { a: 5, b: 3 })} disabled={loading}>Add</button>
      <button onClick={() => executeTest('/check/even', { num: 4 })} disabled={loading}>Check Even</button>
      <button onClick={() => executeTest('/grade', { score: 85 })} disabled={loading}>Get Grade</button>
      <div style={{ marginTop: '2rem' }}>
        {results.map((r, i) => (<div key={i} style={{ padding: '0.5rem', margin: '0.5rem', background: r.ok ? '#d4edda' : '#f8d7da' }}>{r.ts} - {r.ep} {r.ok ? '✓' : '✗'}</div>))}
      </div>
    </div>
  );
}
export default App;
