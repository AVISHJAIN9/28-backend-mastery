import React, { useState } from 'react';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const executeTest = async (endpoint) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4003/api${endpoint}`);
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
      <h1>Test Doubles: Mocks, Stubs & Spies - Module 03</h1>
      <button onClick={() => executeTest('/mocks')} disabled={loading}>Mocks</button>
      <button onClick={() => executeTest('/stubs')} disabled={loading}>Stubs</button>
      <button onClick={() => executeTest('/spies')} disabled={loading}>Spies</button>
      <div style={{ marginTop: '2rem' }}>
        {results.map((r, i) => (
          <div key={i} style={{ padding: '0.5rem', margin: '0.5rem', background: r.ok ? '#d4edda' : '#f8d7da' }}>
            {r.ts} - {r.ep} {r.ok ? '✓' : r.err ? 'ERROR' : '✗'}
          </div>
        ))}
      </div>
    </div>
  );
}
export default App;
