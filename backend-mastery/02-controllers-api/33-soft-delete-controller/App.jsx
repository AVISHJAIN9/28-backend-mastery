import React, { useState } from 'react';

export default function SoftDeleteDemo() {
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState('');

  const deleteRecord = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  const restoreRecord = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/restore`, { method: 'POST' });
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Soft Delete Demo</h1>
      <input type="number" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
      <button onClick={deleteRecord} style={{ width: '100%', padding: 10, background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>Delete</button>
      <button onClick={restoreRecord} style={{ width: '100%', padding: 10, background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>Restore</button>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 20, borderRadius: 4 }}>{result}</pre>
    </div>
  );
}
