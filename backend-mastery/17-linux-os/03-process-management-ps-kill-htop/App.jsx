import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Backend Mastery</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error">Error: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      <button onClick={fetchData}>Refresh Data</button>
    </div>
  );
}
