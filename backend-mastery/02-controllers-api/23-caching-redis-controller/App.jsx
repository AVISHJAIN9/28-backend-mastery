import React, { useState } from 'react';

export default function CachingDemo() {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [result, setResult] = useState('');

  const handleSet = async () => {
    try {
      const res = await fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Caching Demo</h1>
      <input type="text" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Key" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
      <button onClick={handleSet} style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Set Cache</button>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 20, borderRadius: 4 }}>{result}</pre>
    </div>
  );
}
