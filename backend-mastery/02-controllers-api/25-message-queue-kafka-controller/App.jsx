import React, { useState } from 'react';

export default function KafkaDemo() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState('');

  const publishMessage = async () => {
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Kafka Message Queue Demo</h1>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
      <button onClick={publishMessage} style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Publish</button>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 20, borderRadius: 4 }}>{result}</pre>
    </div>
  );
}
