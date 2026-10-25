import React, { useState } from 'react';
export default function App() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_BASE = 'http://localhost:5808/api';
  const fetchData = async (endpoint) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1>Module 08</h1>
      <button onClick={() => fetchData('/info')} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>Get Info</button>
      {loading && <p>Loading...</p>}
      {response && <pre style={{ backgroundColor: '#f5f5f5', padding: '15px' }}>{JSON.stringify(response, null, 2)}</pre>}
    </div>
  );
}

