import React, { useState } from 'react';

export default function CircuitBreakerDemo() {
  const [status, setStatus] = useState('');
  const [result, setResult] = useState('');

  const testRequest = async () => {
    try {
      const res = await fetch('/api/external');
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/circuit-status');
      const data = await res.json();
      setStatus(JSON.stringify(data));
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Circuit Breaker Demo</h1>
      <button onClick={testRequest} style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>Send Request</button>
      <button onClick={checkStatus} style={{ width: '100%', padding: 10, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>Check Status</button>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 20, borderRadius: 4 }}>Status: {status}</pre>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 10, borderRadius: 4 }}>Result: {result}</pre>
    </div>
  );
}
