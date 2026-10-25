import React, { useState } from 'react';

export default function APIGatewayDemo() {
  const [service, setService] = useState('service1');
  const [result, setResult] = useState('');

  const callService = async () => {
    try {
      const res = await fetch(`/gateway/${service}/api/data`);
      const data = await res.json();
      setResult(JSON.stringify(data));
    } catch (err) {
      setResult(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>API Gateway Demo</h1>
      <select value={service} onChange={(e) => setService(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10 }}>
        <option value="service1">Service 1</option>
        <option value="service2">Service 2</option>
        <option value="service3">Service 3</option>
      </select>
      <button onClick={callService} style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Call Service</button>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 20, borderRadius: 4 }}>{result}</pre>
    </div>
  );
}
