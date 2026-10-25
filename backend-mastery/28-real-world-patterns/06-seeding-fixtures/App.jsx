import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:4006';

export default function App() {
  const [activeTab, setActiveTab] = useState('seed');
  const [seedConfig, setSeedConfig] = useState({
    environment: 'development',
    count: 100,
    includeRelations: true,
    clean_before_seed: false,
    locale: 'en_US'
  });
  const [seederConfig, setSeederConfig] = useState({
    seeder_name: 'users',
    count: 50,
    batch_size: 100
  });
  const [fixture, setFixture] = useState({
    name: 'test_fixture',
    description: 'Test fixture',
    collection: 'users',
    data: []
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  // Seed data
  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/secure/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seedConfig)
      });
      const data = await res.json();
      setResponse(data);
      setLogs([{ timestamp: new Date().toISOString(), action: 'seed', ...data }]);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Run specific seeder
  const handleRunSeeder = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/secure/seed/run?env=${seedConfig.environment}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(seederConfig)
        }
      );
      const data = await res.json();
      setResponse(data);
      setLogs([...logs, { timestamp: new Date().toISOString(), action: 'run_seeder', ...data }]);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Load fixture
  const handleLoadFixture = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/secure/seed/fixture?env=${seedConfig.environment}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fixture)
        }
      );
      const data = await res.json();
      setResponse(data);
      setLogs([...logs, { timestamp: new Date().toISOString(), action: 'load_fixture', ...data }]);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Validate seed
  const handleValidate = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/secure/seed/validate?env=${seedConfig.environment}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seeder_name: seederConfig.seeder_name, sample_size: 10 })
        }
      );
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Get status
  const handleGetStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/secure/seed/status?environment=${seedConfig.environment}&limit=10`,
        { method: 'GET' }
      );
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      setStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Clean environment
  const handleClean = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/secure/seed/clean?env=${seedConfig.environment}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      setResponse(data);
      setLogs([...logs, { timestamp: new Date().toISOString(), action: 'clean', ...data }]);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>🌱 Seeding & Fixtures Management</h1>
      <p>Database seeding, fixtures, and bulk data generation</p>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
        {['seed', 'seeder', 'fixture', 'status'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: activeTab === tab ? '#007bff' : '#f0f0f0',
              color: activeTab === tab ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab 1: Seed Data */}
      {activeTab === 'seed' && (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <h2>Generate Seed Data</h2>
          <div style={{ marginBottom: '15px' }}>
            <label>Environment:</label>
            <select
              value={seedConfig.environment}
              onChange={e => setSeedConfig({ ...seedConfig, environment: e.target.value })}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option>development</option>
              <option>staging</option>
              <option>production</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Record Count:</label>
            <input
              type="number"
              value={seedConfig.count}
              onChange={e => setSeedConfig({ ...seedConfig, count: parseInt(e.target.value) })}
              style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
              min="1"
              max="100000"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="checkbox"
                checked={seedConfig.includeRelations}
                onChange={e => setSeedConfig({ ...seedConfig, includeRelations: e.target.checked })}
              />
              Include Relations (posts, comments)
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="checkbox"
                checked={seedConfig.clean_before_seed}
                onChange={e => setSeedConfig({ ...seedConfig, clean_before_seed: e.target.checked })}
              />
              Clean Before Seed
            </label>
          </div>

          <button
            onClick={handleSeed}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            {loading ? 'Seeding...' : 'Generate Seed Data'}
          </button>

          <button
            onClick={handleClean}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clean Environment
          </button>

          {response && (
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Run Seeder */}
      {activeTab === 'seeder' && (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <h2>Run Specific Seeder</h2>
          <div style={{ marginBottom: '15px' }}>
            <label>Seeder:</label>
            <select
              value={seederConfig.seeder_name}
              onChange={e => setSeederConfig({ ...seederConfig, seeder_name: e.target.value })}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="users">Users</option>
              <option value="posts">Posts</option>
              <option value="comments">Comments</option>
              <option value="tags">Tags</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Count:</label>
            <input
              type="number"
              value={seederConfig.count}
              onChange={e => setSeederConfig({ ...seederConfig, count: parseInt(e.target.value) })}
              style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Batch Size:</label>
            <input
              type="number"
              value={seederConfig.batch_size}
              onChange={e => setSeederConfig({ ...seederConfig, batch_size: parseInt(e.target.value) })}
              style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
            />
          </div>

          <button
            onClick={handleRunSeeder}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            {loading ? 'Running...' : 'Run Seeder'}
          </button>

          <button
            onClick={handleValidate}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Validate Seed Data
          </button>

          {response && (
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Fixture */}
      {activeTab === 'fixture' && (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <h2>Load Fixture Data</h2>
          <div style={{ marginBottom: '15px' }}>
            <label>Fixture Name:</label>
            <input
              type="text"
              value={fixture.name}
              onChange={e => setFixture({ ...fixture, name: e.target.value })}
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Collection:</label>
            <select
              value={fixture.collection}
              onChange={e => setFixture({ ...fixture, collection: e.target.value })}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="users">users</option>
              <option value="posts">posts</option>
              <option value="comments">comments</option>
              <option value="tags">tags</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Fixture Data (JSON):</label>
            <textarea
              value={JSON.stringify(fixture.data, null, 2)}
              onChange={e => {
                try {
                  setFixture({ ...fixture, data: JSON.parse(e.target.value) });
                } catch (err) {
                  // Invalid JSON
                }
              }}
              style={{ marginLeft: '10px', padding: '5px', width: '100%', minHeight: '100px' }}
              placeholder='[{"id": 1, "name": "Test"}]'
            />
          </div>

          <button
            onClick={handleLoadFixture}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'Load Fixture'}
          </button>

          {response && (
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Status */}
      {activeTab === 'status' && (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <h2>Seeding Status</h2>
          <button
            onClick={handleGetStatus}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            {loading ? 'Loading...' : 'Refresh Status'}
          </button>

          {status && (
            <div style={{ padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <pre>{JSON.stringify(status, null, 2)}</pre>
            </div>
          )}

          {logs.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>Recent Logs</h3>
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px',
                    marginBottom: '10px',
                    backgroundColor: '#f0f0f0',
                    borderLeft: '4px solid #007bff',
                    borderRadius: '4px'
                  }}
                >
                  <strong>{log.action}</strong> - {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
