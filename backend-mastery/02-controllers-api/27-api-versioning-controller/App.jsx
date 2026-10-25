import React, { useState } from 'react';

export default function VersioningDemo() {
  const [version, setVersion] = useState('v1');
  const [result, setResult] = useState('');

  const testVersion = async () => {
    try {
      const res = await fetch(`/api/${version}/users`);
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>API Versioning Demo</h1>
      <select value={version} onChange={(e) => setVersion(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10 }}>
        <option value="v1">Version 1</option>
        <option value="v2">Version 2</option>
        <option value="v3">Version 3</option>
      </select>
      <button onClick={testVersion} style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Test API</button>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 20, borderRadius: 4 }}>{result}</pre>
    </div>
  );
}
