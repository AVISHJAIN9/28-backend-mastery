import React, { useState } from 'react';

export default function HealthMonitoringDemo() {
  const [health, setHealth] = useState('');
  const [metrics, setMetrics] = useState('');

  const checkHealth = async () => {
    try {
      const res = await fetch('/health/live');
      const data = await res.json();
      setHealth(JSON.stringify(data));
    } catch (err) {
      setHealth(err.message);
    }
  };

  const getMetrics = async () => {
    try {
      const res = await fetch('/metrics');
      const text = await res.text();
      setMetrics(text.substring(0, 500) + '...');
    } catch (err) {
      setMetrics(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Health Monitoring Demo</h1>
      <button onClick={checkHealth} style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>Check Health</button>
      <button onClick={getMetrics} style={{ width: '100%', padding: 10, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>Get Metrics</button>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 20, borderRadius: 4 }}>Health: {health}</pre>
      <pre style={{ background: '#f0f0f0', padding: 10, marginTop: 10, borderRadius: 4 }}>Metrics: {metrics}</pre>
    </div>
  );
}
