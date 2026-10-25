import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [endpoint, setEndpoint] = useState('/health');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (path) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000${path}`);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      setEndpoint(path);
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>07 Lru Eviction</h1>
        <p>Interactive API Testing UI</p>
      </header>

      <main>
        <section className="controls">
          <h2>Test Endpoints</h2>
          <div className="button-group">
            <button onClick={() => testEndpoint('/health')}>
              Health Check
            </button>
            <button onClick={() => testEndpoint('/api')}>
              API Root
            </button>
          </div>
        </section>

        <section className="results">
          <h2>Response</h2>
          {loading ? (
            <p>Loading...</p>
          ) : response ? (
            <pre>{response}</pre>
          ) : (
            <p>Click a button to test an endpoint</p>
          )}
        </section>
      </main>
    </div>
  );
}
