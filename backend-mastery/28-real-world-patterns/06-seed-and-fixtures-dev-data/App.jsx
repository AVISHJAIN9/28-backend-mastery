import React, { useState } from 'react';

const API_BASE = 'http://localhost:6806/api';

export default function SeedFixturesApp() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collection, setCollection] = useState('all');
  const [count, setCount] = useState(10);
  const [dbState, setDbState] = useState(null);

  const callAPI = async (method, url, body = null) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      };
      const res = await fetch(url, options);
      const data = await res.json();
      setResponse(data);
      return data;
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFixtures = () => {
    if (window.confirm('Load predefined fixtures?')) {
      callAPI('POST', `${API_BASE}/seed/fixtures`, { collection, count });
    }
  };

  const handleGenerateRandom = () => {
    callAPI('POST', `${API_BASE}/seed/generate`, { collection, count });
  };

  const handleGetState = async () => {
    const data = await callAPI('GET', `${API_BASE}/database/state?collection=${collection}`);
    if (data) setDbState(data);
  };

  const handleGetStats = () => {
    callAPI('GET', `${API_BASE}/seed/stats`);
  };

  const handleReset = () => {
    if (window.confirm('Reset entire database?')) {
      callAPI('POST', `${API_BASE}/database/reset`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🌱 Seed & Fixtures Pattern</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}>
          <h3>Seeding Operations</h3>

          <div style={{ marginBottom: '10px' }}>
            <label>
              Collection:
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                style={{ marginLeft: '10px', padding: '4px' }}
              >
                <option value="all">All</option>
                <option value="users">Users</option>
                <option value="posts">Posts</option>
                <option value="comments">Comments</option>
              </select>
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Count:
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                min="1"
                max="1000"
                style={{ marginLeft: '10px', padding: '4px', width: '100px' }}
              />
            </label>
          </div>

          <button onClick={handleLoadFixtures} style={{ margin: '5px', padding: '8px 12px' }}>
            Load Fixtures
          </button>
          <button onClick={handleGenerateRandom} style={{ margin: '5px', padding: '8px 12px' }}>
            Generate Random
          </button>
          <button onClick={handleGetState} style={{ margin: '5px', padding: '8px 12px' }}>
            Get DB State
          </button>
          <button onClick={handleGetStats} style={{ margin: '5px', padding: '8px 12px' }}>
            Get Stats
          </button>
          <button
            onClick={handleReset}
            style={{ margin: '5px', padding: '8px 12px', backgroundColor: '#ff6b6b', color: 'white' }}
          >
            Reset DB
          </button>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px', overflowY: 'auto', maxHeight: '400px' }}>
          <h3>Response</h3>
          {loading && <p>Loading...</p>}
          {response && (
            <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {dbState && (
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}>
          <h3>Database State</h3>
          <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '300px', overflowY: 'auto' }}>
            {JSON.stringify(dbState, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
